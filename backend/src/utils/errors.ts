/**
 * Custom API error class with status code
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(
        statusCode: number,
        message: string,
        code: string = 'ERROR',
        details?: unknown
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                ...(this.details !== undefined ? { details: this.details } : {}),
            },
        };
    }
}

// Common error factory functions
export const errors = {
    badRequest: (message: string, details?: unknown) =>
        new ApiError(400, message, 'BAD_REQUEST', details),

    unauthorized: (message: string = 'Unauthorized') =>
        new ApiError(401, message, 'UNAUTHORIZED'),

    forbidden: (message: string = 'Forbidden') =>
        new ApiError(403, message, 'FORBIDDEN'),

    notFound: (resource: string = 'Resource') =>
        new ApiError(404, `${resource} not found`, 'NOT_FOUND'),

    conflict: (message: string) =>
        new ApiError(409, message, 'CONFLICT'),

    validationError: (details: unknown) =>
        new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', details),

    tooManyRequests: (message: string = 'Too many requests') =>
        new ApiError(429, message, 'TOO_MANY_REQUESTS'),

    internal: (message: string = 'Internal server error') =>
        new ApiError(500, message, 'INTERNAL_ERROR'),
};
