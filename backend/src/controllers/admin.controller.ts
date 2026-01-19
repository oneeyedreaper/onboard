import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { errors } from '../utils/errors.js';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updateDocumentStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
});

const bulkApproveSchema = z.object({
    documentIds: z.array(z.string()).min(1),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

const logAdminActivity = async (
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, any>
) => {
    await prisma.adminActivityLog.create({
        data: {
            adminId,
            action,
            targetType,
            targetId,
            details: details ? JSON.stringify(details) : null,
        },
    });
};

// ============================================
// ADMIN CONTROLLERS
// ============================================

/**
 * GET /api/v1/admin/stats
 * Get admin dashboard statistics
 */
export const getStats = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const [
            totalClients,
            pendingDocuments,
            approvedDocuments,
            rejectedDocuments,
            completedOnboarding,
        ] = await Promise.all([
            prisma.client.count({ where: { role: 'USER' } }),
            prisma.document.count({ where: { verificationStatus: 'PENDING' } }),
            prisma.document.count({ where: { verificationStatus: 'APPROVED' } }),
            prisma.document.count({ where: { verificationStatus: 'REJECTED' } }),
            prisma.onboardingProgress.count({ where: { status: 'COMPLETED' } }),
        ]);

        res.json({
            success: true,
            data: {
                totalClients,
                pendingDocuments,
                approvedDocuments,
                rejectedDocuments,
                completedOnboarding,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/admin/documents
 * Get all documents with optional status filter and search
 */
export const getDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { status, search, page = '1', limit = '20' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {};

        if (status) {
            where.verificationStatus = status as 'PENDING' | 'APPROVED' | 'REJECTED';
        }

        // Search by client name or email
        if (search && typeof search === 'string' && search.trim()) {
            const searchTerm = search.trim();
            where.client = {
                OR: [
                    { firstName: { contains: searchTerm, mode: 'insensitive' } },
                    { lastName: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } },
                ],
            };
        }

        const [documents, total] = await Promise.all([
            prisma.document.findMany({
                where,
                orderBy: { uploadedAt: 'desc' },
                skip,
                take: limitNum,
                include: {
                    client: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            prisma.document.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                documents,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/admin/documents/:id
 * Update document verification status
 */
export const updateDocumentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.client!.id;
        const validation = updateDocumentStatusSchema.safeParse(req.body);

        if (!validation.success) {
            throw errors.badRequest(validation.error.errors[0]?.message || 'Invalid input');
        }

        const { status, rejectionReason } = validation.data;

        // Check document exists
        const document = await prisma.document.findUnique({
            where: { id },
            include: { client: { select: { email: true, firstName: true, lastName: true } } },
        });
        if (!document) {
            throw errors.notFound('Document');
        }

        // Update document
        const updatedDoc = await prisma.document.update({
            where: { id },
            data: {
                verificationStatus: status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null,
                verifiedAt: new Date(),
            },
        });

        // Log admin activity
        await logAdminActivity(
            adminId,
            status === 'APPROVED' ? 'APPROVE_DOCUMENT' : 'REJECT_DOCUMENT',
            'DOCUMENT',
            id,
            {
                fileName: document.fileName,
                clientEmail: document.client.email,
                rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
            }
        );

        res.json({
            success: true,
            data: updatedDoc,
            message: `Document ${status.toLowerCase()}`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/admin/documents/bulk-approve
 * Approve multiple documents at once
 */
export const bulkApproveDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const adminId = req.client!.id;
        const validation = bulkApproveSchema.safeParse(req.body);

        if (!validation.success) {
            throw errors.badRequest(validation.error.errors[0]?.message || 'Invalid input');
        }

        const { documentIds } = validation.data;

        // Get documents that are pending
        const documents = await prisma.document.findMany({
            where: {
                id: { in: documentIds },
                verificationStatus: 'PENDING',
            },
            include: { client: { select: { email: true } } },
        });

        if (documents.length === 0) {
            throw errors.badRequest('No pending documents found to approve');
        }

        // Bulk update
        await prisma.document.updateMany({
            where: {
                id: { in: documents.map(d => d.id) },
            },
            data: {
                verificationStatus: 'APPROVED',
                verifiedAt: new Date(),
            },
        });

        // Log activity for bulk approve
        await logAdminActivity(
            adminId,
            'BULK_APPROVE',
            'DOCUMENT',
            'bulk',
            {
                count: documents.length,
                documentIds: documents.map(d => d.id),
            }
        );

        res.json({
            success: true,
            message: `${documents.length} document(s) approved`,
            data: { approvedCount: documents.length },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/admin/clients/:clientId/approve-all
 * Approve all pending documents for a specific client
 */
export const approveAllForClient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { clientId } = req.params;
        const adminId = req.client!.id;

        // Check client exists
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { email: true, firstName: true, lastName: true },
        });
        if (!client) {
            throw errors.notFound('Client');
        }

        // Get pending documents for this client
        const pendingDocs = await prisma.document.findMany({
            where: {
                clientId,
                verificationStatus: 'PENDING',
            },
        });

        if (pendingDocs.length === 0) {
            throw errors.badRequest('No pending documents found for this client');
        }

        // Bulk approve
        await prisma.document.updateMany({
            where: {
                clientId,
                verificationStatus: 'PENDING',
            },
            data: {
                verificationStatus: 'APPROVED',
                verifiedAt: new Date(),
            },
        });

        // Log activity
        await logAdminActivity(
            adminId,
            'APPROVE_ALL_FOR_CLIENT',
            'CLIENT',
            clientId,
            {
                clientEmail: client.email,
                count: pendingDocs.length,
            }
        );

        res.json({
            success: true,
            message: `${pendingDocs.length} document(s) approved for ${client.firstName} ${client.lastName}`,
            data: { approvedCount: pendingDocs.length },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/admin/activity
 * Get admin activity log
 */
export const getActivityLog = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page = '1', limit = '20' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            prisma.adminActivityLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
                include: {
                    admin: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            prisma.adminActivityLog.count(),
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/admin/clients
 * Get all clients (users) with optional search
 */
export const getClients = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page = '1', limit = '20', search } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = { role: 'USER' };

        if (search && typeof search === 'string' && search.trim()) {
            const searchTerm = search.trim();
            where.OR = [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    emailVerified: true,
                    createdAt: true,
                    onboardingProgress: {
                        select: {
                            status: true,
                            currentStep: true,
                        },
                    },
                    _count: {
                        select: { documents: true },
                    },
                },
            }),
            prisma.client.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                clients,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/admin/clients/:id
 * Get client details with documents
 */
export const getClientDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;

        const client = await prisma.client.findUnique({
            where: { id },
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
                onboardingProgress: true,
                documents: {
                    orderBy: { uploadedAt: 'desc' },
                },
            },
        });

        if (!client) {
            throw errors.notFound('Client');
        }

        res.json({
            success: true,
            data: client,
        });
    } catch (error) {
        next(error);
    }
};
