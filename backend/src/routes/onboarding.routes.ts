import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { stepDataSchema } from '../validators/schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/onboarding/status:
 *   get:
 *     summary: Get onboarding status and progress
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding status retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/status', onboardingController.getOnboardingStatus);

/**
 * @swagger
 * /api/v1/onboarding/steps:
 *   get:
 *     summary: Get all onboarding steps
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of onboarding steps
 */
router.get('/steps', onboardingController.getOnboardingSteps);

/**
 * @swagger
 * /api/v1/onboarding/steps/{stepNumber}/data:
 *   put:
 *     summary: Save data for a step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepNumber
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Step data saved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Step not found
 */
router.put('/steps/:stepNumber/data', validateBody(stepDataSchema), onboardingController.saveStepData);

/**
 * @swagger
 * /api/v1/onboarding/steps/{stepNumber}/complete:
 *   post:
 *     summary: Complete a step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepNumber
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Step completed
 *       400:
 *         description: Cannot complete step ahead of current progress
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Step not found
 */
router.post('/steps/:stepNumber/complete', validateBody(stepDataSchema), onboardingController.completeStep);

export default router;
