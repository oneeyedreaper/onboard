import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const signupSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email must be less than 255 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .trim(),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .trim(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// PROFILE SCHEMAS
// ============================================

export const updateProfileSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .trim()
        .optional(),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .trim()
        .optional(),
    companyName: z.string()
        .max(100, 'Company name must be less than 100 characters')
        .trim()
        .optional()
        .nullable(),
    phone: z.string()
        .max(20, 'Phone must be less than 20 characters')
        .regex(/^[\d\s\-+()]*$/, 'Invalid phone number format')
        .optional()
        .nullable(),
    avatarUrl: z.string()
        .url('Invalid URL')
        .optional()
        .nullable(),
});

// ============================================
// ONBOARDING SCHEMAS
// ============================================

export const stepDataSchema = z.object({
    data: z.record(z.unknown()).optional(),
});

export const stepNumberParamSchema = z.object({
    stepNumber: z.string().regex(/^\d+$/, 'Step number must be a number'),
});

// Step 1: Personal Info
export const personalInfoSchema = z.object({
    firstName: z.string().min(1).max(50).trim(),
    lastName: z.string().min(1).max(50).trim(),
    companyName: z.string().max(100).trim().optional(),
    phone: z.string().max(20).optional(),
});

// Step 4: Final Setup
export const finalSetupSchema = z.object({
    preferences: z.object({
        notifications: z.boolean().optional(),
        newsletter: z.boolean().optional(),
        timezone: z.string().optional(),
    }).optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
    }),
});

// ============================================
// DOCUMENT SCHEMAS
// ============================================

export const documentCategorySchema = z.enum([
    'ID_DOCUMENT',
    'BUSINESS_LICENSE',
    'TAX_DOCUMENT',
    'PROOF_OF_ADDRESS',
    'OTHER',
]);

export const uploadDocumentSchema = z.object({
    fileName: z.string().min(1),
    fileUrl: z.string().url(),
    fileKey: z.string().min(1),
    fileType: z.string().min(1),
    fileSize: z.number().positive(),
    category: documentCategorySchema,
    customDocType: z.string().max(100).trim().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type FinalSetupInput = z.infer<typeof finalSetupSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type DocumentCategory = z.infer<typeof documentCategorySchema>;

// ============================================
// AUTH ENHANCEMENT SCHEMAS
// ============================================

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
});

export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

