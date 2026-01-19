import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
    getStats,
    getDocuments,
    updateDocumentStatus,
    bulkApproveDocuments,
    approveAllForClient,
    getActivityLog,
    getClients,
    getClientDetails,
} from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /admin/activity:
 *   get:
 *     summary: Get admin activity log
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity log with pagination
 */
router.get('/activity', getActivityLog);

/**
 * @swagger
 * /admin/documents:
 *   get:
 *     summary: Get all documents with optional status filter and search
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by client name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of documents with pagination
 */
router.get('/documents', getDocuments);

/**
 * @swagger
 * /admin/documents/bulk-approve:
 *   post:
 *     summary: Approve multiple documents at once
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentIds
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Documents approved
 */
router.post('/documents/bulk-approve', bulkApproveDocuments);

/**
 * @swagger
 * /admin/documents/{id}:
 *   patch:
 *     summary: Update document verification status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated
 */
router.patch('/documents/:id', updateDocumentStatus);

/**
 * @swagger
 * /admin/clients:
 *   get:
 *     summary: Get all clients with optional search
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of clients with pagination
 */
router.get('/clients', getClients);

/**
 * @swagger
 * /admin/clients/{id}:
 *   get:
 *     summary: Get client details with documents
 *     tags: [Admin]
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
 *         description: Client details
 */
router.get('/clients/:id', getClientDetails);

/**
 * @swagger
 * /admin/clients/{clientId}/approve-all:
 *   post:
 *     summary: Approve all pending documents for a client
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All pending documents approved
 */
router.post('/clients/:clientId/approve-all', approveAllForClient);

export default router;
