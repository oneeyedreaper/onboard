import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getRefreshTokenExpiry
} from '../utils/jwt.js';
import { errors } from '../utils/errors.js';
import { SignupInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, VerifyEmailInput } from '../validators/schemas.js';
import crypto from 'crypto';
import { sendVerificationEmail as sendVerificationEmailService, sendPasswordResetEmail as sendPasswordResetEmailService } from '../utils/email.js';

/**
 * POST /api/v1/auth/signup
 * Register a new client
 */
export const signup = async (
    req: Request<{}, {}, SignupInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Check if email already exists
        const existingClient = await prisma.client.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingClient) {
            throw errors.conflict('Email already registered');
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create client with onboarding progress
        const client = await prisma.client.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                firstName,
                lastName,
                onboardingProgress: {
                    create: {
                        currentStep: 1,
                        status: 'PENDING',
                    },
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const accessToken = generateAccessToken({
            clientId: client.id,
            email: client.email
        });
        const refreshToken = generateRefreshToken({
            clientId: client.id,
            email: client.email
        });

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                clientId: client.id,
                expiresAt: getRefreshTokenExpiry(),
            },
        });

        // Create email verification token and "send" email
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.emailVerificationToken.create({
            data: {
                token: verificationToken,
                clientId: client.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Send verification email
        await sendVerificationEmailService(client.email, client.firstName, verificationToken);

        res.status(201).json({
            success: true,
            data: {
                client,
                tokens: {
                    accessToken,
                    refreshToken,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
export const login = async (
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Find client
        const client = await prisma.client.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                firstName: true,
                lastName: true,
                companyName: true,
                avatarUrl: true,
            },
        });

        if (!client) {
            throw errors.unauthorized('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await comparePassword(password, client.passwordHash);

        if (!isValidPassword) {
            throw errors.unauthorized('Invalid email or password');
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            clientId: client.id,
            email: client.email
        });
        const refreshToken = generateRefreshToken({
            clientId: client.id,
            email: client.email
        });

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                clientId: client.id,
                expiresAt: getRefreshTokenExpiry(),
            },
        });

        // Remove passwordHash from response
        const { passwordHash: _, ...clientData } = client;

        res.json({
            success: true,
            data: {
                client: clientData,
                tokens: {
                    accessToken,
                    refreshToken,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export const refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);

        if (payload.type !== 'refresh') {
            throw errors.unauthorized('Invalid token type');
        }

        // Check if refresh token exists in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { client: true },
        });

        if (!storedToken) {
            throw errors.unauthorized('Invalid refresh token');
        }

        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({ where: { id: storedToken.id } });
            throw errors.unauthorized('Refresh token expired');
        }

        // Delete old refresh token (rotation)
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });

        // Generate new tokens
        const newAccessToken = generateAccessToken({
            clientId: storedToken.client.id,
            email: storedToken.client.email
        });
        const newRefreshToken = generateRefreshToken({
            clientId: storedToken.client.id,
            email: storedToken.client.email
        });

        // Store new refresh token
        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                clientId: storedToken.client.id,
                expiresAt: getRefreshTokenExpiry(),
            },
        });

        res.json({
            success: true,
            data: {
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/logout
 * Invalidate refresh token
 */
export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Delete refresh token if provided
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }

        // If authenticated, delete all refresh tokens for this client
        if (req.client) {
            await prisma.refreshToken.deleteMany({
                where: { clientId: req.client.id },
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset email
 */
export const forgotPassword = async (
    req: Request<{}, {}, ForgotPasswordInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email } = req.body;

        // Find client
        const client = await prisma.client.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        if (!client) {
            res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
            return;
        }

        // Delete any existing reset tokens for this client
        await prisma.passwordResetToken.deleteMany({
            where: { clientId: client.id },
        });

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        await prisma.passwordResetToken.create({
            data: {
                token: resetToken,
                clientId: client.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });

        // Send password reset email
        await sendPasswordResetEmailService(client.email, client.firstName, resetToken);

        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
export const resetPassword = async (
    req: Request<{}, {}, ResetPasswordInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { token, password } = req.body;

        // Find token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { client: true },
        });

        if (!resetToken) {
            throw errors.badRequest('Invalid or expired reset token');
        }

        // Check if token is expired
        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
            throw errors.badRequest('Reset token has expired');
        }

        // Hash new password
        const passwordHash = await hashPassword(password);

        // Update password
        await prisma.client.update({
            where: { id: resetToken.clientId },
            data: { passwordHash },
        });

        // Delete all reset tokens for this client
        await prisma.passwordResetToken.deleteMany({
            where: { clientId: resetToken.clientId },
        });

        // Delete all refresh tokens (log out from all devices)
        await prisma.refreshToken.deleteMany({
            where: { clientId: resetToken.clientId },
        });

        res.json({
            success: true,
            message: 'Password reset successfully. Please log in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/send-verification
 * Send email verification link
 */
export const sendVerificationEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;

        // Get client
        const client = await prisma.client.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            throw errors.notFound('Client');
        }

        if (client.emailVerified) {
            throw errors.badRequest('Email is already verified');
        }

        // Delete any existing verification tokens for this client
        await prisma.emailVerificationToken.deleteMany({
            where: { clientId: client.id },
        });

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await prisma.emailVerificationToken.create({
            data: {
                token: verificationToken,
                clientId: client.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Send verification email
        await sendVerificationEmailService(client.email, client.firstName, verificationToken);

        res.json({
            success: true,
            message: 'Verification email sent successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/verify-email
 * Verify email with token
 */
export const verifyEmail = async (
    req: Request<{}, {}, VerifyEmailInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { token } = req.body;

        // Find token
        const verificationToken = await prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { client: true },
        });

        if (!verificationToken) {
            throw errors.badRequest('Invalid or expired verification token');
        }

        // Check if token is expired
        if (verificationToken.expiresAt < new Date()) {
            await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
            throw errors.badRequest('Verification token has expired');
        }

        // Update client
        await prisma.client.update({
            where: { id: verificationToken.clientId },
            data: { emailVerified: true },
        });

        // Delete all verification tokens for this client
        await prisma.emailVerificationToken.deleteMany({
            where: { clientId: verificationToken.clientId },
        });

        res.json({
            success: true,
            message: 'Email verified successfully.',
        });
    } catch (error) {
        next(error);
    }
};

