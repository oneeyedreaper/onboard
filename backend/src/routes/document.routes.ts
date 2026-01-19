import { Router } from 'express';
import * as documentController from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { uploadDocumentSchema } from '../validators/schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/documents:
 *   get:
 *     summary: Get all documents for current user
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ID_DOCUMENT, BUSINESS_LICENSE, TAX_DOCUMENT, PROOF_OF_ADDRESS, OTHER]
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Unauthorized
 */
router.get('/', documentController.getDocuments);

/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Add a document record
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileUrl
 *               - fileKey
 *               - fileType
 *               - fileSize
 *               - category
 *             properties:
 *               fileName:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileKey:
 *                 type: string
 *               fileType:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               category:
 *                 type: string
 *                 enum: [ID_DOCUMENT, BUSINESS_LICENSE, TAX_DOCUMENT, PROOF_OF_ADDRESS, OTHER]
 *     responses:
 *       201:
 *         description: Document added
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/', validateBody(uploadDocumentSchema), documentController.addDocument);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.delete('/:id', documentController.deleteDocument);

export default router;
