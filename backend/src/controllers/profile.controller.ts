import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { errors } from '../utils/errors.js';
import { UpdateProfileInput, ChangePasswordInput } from '../validators/schemas.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { deleteFiles, extractFileKeyFromUrl } from '../utils/uploadthing.js';

/**
 * GET /api/v1/profile
 * Get current user's profile
 */
export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;

        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
                avatarUrl: true,
                emailVerified: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                onboardingProgress: {
                    select: {
                        currentStep: true,
                        status: true,
                        completedAt: true,
                    },
                },
            },
        });

        if (!client) {
            throw errors.notFound('Profile');
        }

        res.json({
            success: true,
            data: client,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/profile
 * Full update of user profile
 */
export const updateProfile = async (
    req: Request<{}, {}, UpdateProfileInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const updateData = req.body;

        const client = await prisma.client.update({
            where: { id: clientId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
                avatarUrl: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            data: client,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/profile
 * Partial update of user profile
 */
export const patchProfile = async (
    req: Request<{}, {}, Partial<UpdateProfileInput>>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const updateData = req.body;

        // Filter out undefined values
        const filteredData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(filteredData).length === 0) {
            throw errors.badRequest('No valid fields to update');
        }

        const client = await prisma.client.update({
            where: { id: clientId },
            data: filteredData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
                avatarUrl: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            data: client,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/profile/change-password
 * Change user's password
 */
export const changePassword = async (
    req: Request<{}, {}, ChangePasswordInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const { currentPassword, newPassword } = req.body;

        // Get current user with password hash
        const client = await prisma.client.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            throw errors.notFound('Client');
        }

        // Verify current password
        const isValidPassword = await comparePassword(currentPassword, client.passwordHash);

        if (!isValidPassword) {
            throw errors.unauthorized('Current password is incorrect');
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await prisma.client.update({
            where: { id: clientId },
            data: { passwordHash: newPasswordHash },
        });

        // Optionally: Delete all refresh tokens except current session
        // For now, we'll keep them logged in

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/profile/account
 * Delete user account and all related data
 */
export const deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;

        // Get all file keys for documents and avatar before deletion
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: {
                avatarUrl: true,
                documents: {
                    select: { fileKey: true },
                },
            },
        });

        if (client) {
            // Collect all file keys to delete from UploadThing
            const fileKeys: string[] = [];

            // Add document file keys
            client.documents.forEach((doc) => {
                if (doc.fileKey) {
                    fileKeys.push(doc.fileKey);
                }
            });

            // Add avatar file key (extract from URL)
            if (client.avatarUrl) {
                const avatarKey = extractFileKeyFromUrl(client.avatarUrl);
                if (avatarKey) {
                    fileKeys.push(avatarKey);
                }
            }

            // Delete files from UploadThing (don't fail account deletion if this fails)
            if (fileKeys.length > 0) {
                await deleteFiles(fileKeys);
            }
        }

        // Delete user (cascade will handle related data in DB)
        await prisma.client.delete({
            where: { id: clientId },
        });

        res.json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

