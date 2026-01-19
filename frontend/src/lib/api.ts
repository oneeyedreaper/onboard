import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Token management
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = () => Cookies.get(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => Cookies.get(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken: string, refreshToken: string) => {
    Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 1 }); // 1 day
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7 }); // 7 days
};

export const clearTokens = () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
};

// Session expired event for components to listen to
export const SESSION_EXPIRED_EVENT = 'session-expired';

const dispatchSessionExpired = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
};

// API Error with user-friendly message mapping
export class ApiError extends Error {
    public userMessage: string;

    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
        this.userMessage = mapErrorToUserMessage(statusCode, code, message);
    }
}

// Network Error for connection issues
export class NetworkError extends Error {
    public userMessage: string;

    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'NetworkError';
        this.userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    }
}

// Map API errors to user-friendly messages
function mapErrorToUserMessage(statusCode: number, code: string, originalMessage: string): string {
    // Status code based messages
    switch (statusCode) {
        case 400:
            return originalMessage || 'The request was invalid. Please check your input and try again.';
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You don\'t have permission to perform this action.';
        case 404:
            return 'The requested resource was not found.';
        case 409:
            return originalMessage || 'This action conflicts with existing data.';
        case 429:
            return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
            return 'Our servers are experiencing issues. Please try again in a few moments.';
        default:
            break;
    }

    // Error code based messages
    switch (code) {
        case 'VALIDATION_ERROR':
            return originalMessage || 'Please check your input and try again.';
        case 'EMAIL_EXISTS':
            return 'This email is already registered. Try logging in instead.';
        case 'INVALID_CREDENTIALS':
            return 'Invalid email or password. Please try again.';
        case 'TOKEN_EXPIRED':
            return 'Your session has expired. Please log in again.';
        default:
            return originalMessage || 'Something went wrong. Please try again.';
    }
}

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate delay with exponential backoff and jitter
function getRetryDelay(attempt: number): number {
    const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelay
    );
    // Add jitter (±25%)
    return delay * (0.75 + Math.random() * 0.5);
}

// Check if error is retryable
function isRetryable(error: Error | Response): boolean {
    if (error instanceof Response) {
        return RETRY_CONFIG.retryableStatuses.includes(error.status);
    }
    // Network errors are retryable
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
        return true;
    }
    return false;
}

// Token refresh mutex to prevent race conditions when multiple requests fail
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
            return data.data.tokens.accessToken;
        }
    } catch {
        // Refresh failed
    }

    clearTokens();
    dispatchSessionExpired();
    return null;
}

// Fetch wrapper with auth and retry logic
async function fetchWithAuth(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
): Promise<Response> {
    const accessToken = getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    let response: Response;

    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (error) {
        // Network error (offline, DNS failure, etc.)
        if (retryCount < RETRY_CONFIG.maxRetries && isRetryable(error as Error)) {
            const delay = getRetryDelay(retryCount);
            console.log(`⚠️ Network error, retrying in ${Math.round(delay)}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
            await sleep(delay);
            return fetchWithAuth(endpoint, options, retryCount + 1);
        }
        throw new NetworkError('Failed to connect to server', error as Error);
    }

    // Retry on retryable status codes
    if (isRetryable(response) && retryCount < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay(retryCount);
        console.log(`⚠️ Server error ${response.status}, retrying in ${Math.round(delay)}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        return fetchWithAuth(endpoint, options, retryCount + 1);
    }

    // Handle token refresh with mutex to prevent race conditions
    if (response.status === 401 && accessToken) {
        // Use mutex pattern: if refresh is in progress, wait for it
        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;

        if (newToken) {
            // Retry original request with new token
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
            return fetch(`${API_URL}${endpoint}`, { ...options, headers });
        }
    }

    return response;
}

// Parse API response
async function parseResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(
            response.status,
            data.error?.code || 'ERROR',
            data.error?.message || 'An error occurred',
            data.error?.details
        );
    }

    return data.data;
}

// Parse message response (for endpoints that return message instead of data)
async function parseMessageResponse(response: Response): Promise<{ message: string }> {
    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(
            response.status,
            data.error?.code || 'ERROR',
            data.error?.message || 'An error occurred',
            data.error?.details
        );
    }

    return { message: data.message };
}

// ============================================
// AUTH API
// ============================================

export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    client: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export const authApi = {
    signup: async (data: SignupData): Promise<AuthResponse> => {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return parseResponse<AuthResponse>(response);
    },

    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return parseResponse<AuthResponse>(response);
    },

    logout: async (): Promise<void> => {
        const refreshToken = getRefreshToken();
        await fetchWithAuth('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
        clearTokens();
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return parseMessageResponse(response);
    },

    resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });
        return parseMessageResponse(response);
    },

    sendVerificationEmail: async (): Promise<{ message: string }> => {
        const response = await fetchWithAuth('/auth/send-verification', {
            method: 'POST',
        });
        return parseMessageResponse(response);
    },

    verifyEmail: async (token: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        return parseMessageResponse(response);
    },
};

// ============================================
// PROFILE API
// ============================================

export interface Profile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    emailVerified: boolean;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
    onboardingProgress?: {
        currentStep: number;
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
        completedAt: string | null;
    };
}

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    companyName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
}

export const profileApi = {
    get: async (): Promise<Profile> => {
        const response = await fetchWithAuth('/profile');
        return parseResponse<Profile>(response);
    },

    update: async (data: UpdateProfileData): Promise<Profile> => {
        const response = await fetchWithAuth('/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return parseResponse<Profile>(response);
    },

    patch: async (data: Partial<UpdateProfileData>): Promise<Profile> => {
        const response = await fetchWithAuth('/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        return parseResponse<Profile>(response);
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const response = await fetchWithAuth('/profile/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return parseMessageResponse(response);
    },

    deleteAccount: async (): Promise<{ message: string }> => {
        const response = await fetchWithAuth('/profile/account', {
            method: 'DELETE',
        });
        return parseMessageResponse(response);
    },
};

// ============================================
// ONBOARDING API
// ============================================

export interface OnboardingStep {
    id: string;
    stepNumber: number;
    name: string;
    title: string;
    description: string;
    isRequired: boolean;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    data: Record<string, unknown> | null;
    completedAt: string | null;
}

export interface OnboardingStatus {
    currentStep: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    completedAt: string | null;
    steps: OnboardingStep[];
}

export const onboardingApi = {
    getStatus: async (): Promise<OnboardingStatus> => {
        const response = await fetchWithAuth('/onboarding/status');
        return parseResponse<OnboardingStatus>(response);
    },

    getSteps: async (): Promise<OnboardingStep[]> => {
        const response = await fetchWithAuth('/onboarding/steps');
        return parseResponse<OnboardingStep[]>(response);
    },

    saveStepData: async (stepNumber: number, data: Record<string, unknown>): Promise<unknown> => {
        const response = await fetchWithAuth(`/onboarding/steps/${stepNumber}/data`, {
            method: 'PUT',
            body: JSON.stringify({ data }),
        });
        return parseResponse(response);
    },

    completeStep: async (stepNumber: number, data?: Record<string, unknown>): Promise<{
        message: string;
        currentStep: number;
        status: string;
        completedAt: string | null;
    }> => {
        const response = await fetchWithAuth(`/onboarding/steps/${stepNumber}/complete`, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
        return parseResponse(response);
    },
};

// ============================================
// DOCUMENTS API
// ============================================

export interface Document {
    id: string;
    fileName: string;
    fileUrl: string;
    fileKey: string;
    fileType: string;
    fileSize: number;
    category: 'ID_DOCUMENT' | 'BUSINESS_LICENSE' | 'TAX_DOCUMENT' | 'PROOF_OF_ADDRESS' | 'OTHER';
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string | null;
    verifiedAt?: string | null;
    uploadedAt: string;
}

export interface UploadDocumentData {
    fileName: string;
    fileUrl: string;
    fileKey: string;
    fileType: string;
    fileSize: number;
    category: Document['category'];
}

export const documentsApi = {
    getAll: async (category?: Document['category']): Promise<Document[]> => {
        const query = category ? `?category=${category}` : '';
        const response = await fetchWithAuth(`/documents${query}`);
        return parseResponse<Document[]>(response);
    },

    add: async (data: UploadDocumentData): Promise<Document> => {
        const response = await fetchWithAuth('/documents', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return parseResponse<Document>(response);
    },

    delete: async (id: string): Promise<void> => {
        await fetchWithAuth(`/documents/${id}`, {
            method: 'DELETE',
        });
    },
};

// ============================================
// ADMIN API
// ============================================

export interface AdminStats {
    totalClients: number;
    pendingDocuments: number;
    approvedDocuments: number;
    rejectedDocuments: number;
    completedOnboarding: number;
}

export interface AdminDocument extends Document {
    client: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export interface AdminClient {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName?: string | null;
    emailVerified: boolean;
    createdAt: string;
    onboardingProgress?: {
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
        currentStep: number;
    };
    _count: {
        documents: number;
    };
}

export interface PaginatedResponse<T> {
    documents?: T[];
    clients?: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AdminActivityLog {
    id: string;
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    details: string | null;
    createdAt: string;
    admin: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export const adminApi = {
    getStats: async (): Promise<AdminStats> => {
        const response = await fetchWithAuth('/admin/stats');
        return parseResponse<AdminStats>(response);
    },

    getDocuments: async (params?: {
        status?: Document['verificationStatus'];
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<AdminDocument>> => {
        const query = new URLSearchParams();
        if (params?.status) query.set('status', params.status);
        if (params?.search) query.set('search', params.search);
        if (params?.page) query.set('page', params.page.toString());
        if (params?.limit) query.set('limit', params.limit.toString());

        const response = await fetchWithAuth(`/admin/documents?${query}`);
        return parseResponse<PaginatedResponse<AdminDocument>>(response);
    },

    updateDocumentStatus: async (
        id: string,
        data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
    ): Promise<Document> => {
        const response = await fetchWithAuth(`/admin/documents/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        return parseResponse<Document>(response);
    },

    bulkApproveDocuments: async (documentIds: string[]): Promise<{ approvedCount: number }> => {
        const response = await fetchWithAuth('/admin/documents/bulk-approve', {
            method: 'POST',
            body: JSON.stringify({ documentIds }),
        });
        return parseResponse<{ approvedCount: number }>(response);
    },

    approveAllForClient: async (clientId: string): Promise<{ approvedCount: number }> => {
        const response = await fetchWithAuth(`/admin/clients/${clientId}/approve-all`, {
            method: 'POST',
        });
        return parseResponse<{ approvedCount: number }>(response);
    },

    getClients: async (params?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<AdminClient>> => {
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        if (params?.page) query.set('page', params.page.toString());
        if (params?.limit) query.set('limit', params.limit.toString());

        const response = await fetchWithAuth(`/admin/clients?${query}`);
        return parseResponse<PaginatedResponse<AdminClient>>(response);
    },

    getClientDetails: async (id: string): Promise<AdminClient & { documents: Document[] }> => {
        const response = await fetchWithAuth(`/admin/clients/${id}`);
        return parseResponse<AdminClient & { documents: Document[] }>(response);
    },

    getActivityLog: async (params?: {
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<AdminActivityLog> & { logs?: AdminActivityLog[] }> => {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', params.page.toString());
        if (params?.limit) query.set('limit', params.limit.toString());

        const response = await fetchWithAuth(`/admin/activity?${query}`);
        return parseResponse<PaginatedResponse<AdminActivityLog> & { logs?: AdminActivityLog[] }>(response);
    },
};


