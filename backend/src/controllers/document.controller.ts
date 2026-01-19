import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { errors } from '../utils/errors.js';
import { UploadDocumentInput, DocumentCategory } from '../validators/schemas.js';

/**
 * GET /api/v1/documents
 * Get all documents for current user
 */
export const getDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const { category } = req.query;

        const documents = await prisma.document.findMany({
            where: {
                clientId,
                ...(category && { category: category as DocumentCategory }),
            },
            orderBy: { uploadedAt: 'desc' },
        });

        res.json({
            success: true,
            data: documents,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/documents
 * Add a document record (after upload to UploadThing)
 */
export const addDocument = async (
    req: Request<{}, {}, UploadDocumentInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const { fileName, fileUrl, fileKey, fileType, fileSize, category } = req.body;

        const document = await prisma.document.create({
            data: {
                clientId,
                fileName,
                fileUrl,
                fileKey,
                fileType,
                fileSize,
                category,
            },
        });

        res.status(201).json({
            success: true,
            data: document,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/documents/:id
 * Delete a document
 */
export const deleteDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const { id } = req.params;

        // Check if document exists and belongs to user
        const document = await prisma.document.findFirst({
            where: { id, clientId },
        });

        if (!document) {
            throw errors.notFound('Document');
        }

        // Delete document record
        await prisma.document.delete({
            where: { id },
        });

        // Note: You would also delete from UploadThing here
        // using the fileKey and UploadThing's delete API

        res.json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
