import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { errors } from '../utils/errors.js';

/**
 * GET /api/v1/onboarding/status
 * Get current onboarding status and progress
 */
export const getOnboardingStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;

        // Get or create onboarding progress
        let progress = await prisma.onboardingProgress.findUnique({
            where: { clientId },
            include: {
                stepProgress: {
                    include: {
                        onboardingStep: true,
                    },
                    orderBy: {
                        onboardingStep: {
                            stepNumber: 'asc',
                        },
                    },
                },
            },
        });

        if (!progress) {
            // Create onboarding progress if it doesn't exist
            progress = await prisma.onboardingProgress.create({
                data: {
                    clientId,
                    currentStep: 1,
                    status: 'PENDING',
                },
                include: {
                    stepProgress: {
                        include: {
                            onboardingStep: true,
                        },
                    },
                },
            });
        }

        // Get all steps
        const allSteps = await prisma.onboardingStep.findMany({
            orderBy: { stepNumber: 'asc' },
        });

        // Map step progress
        const stepsWithProgress = allSteps.map((step: { id: string; stepNumber: number; name: string; title: string; description: string; isRequired: boolean }) => {
            const stepProgress = progress!.stepProgress.find(
                (sp: { onboardingStepId: string }) => sp.onboardingStepId === step.id
            );

            return {
                ...step,
                status: stepProgress?.status || 'PENDING',
                data: stepProgress?.data || null,
                completedAt: stepProgress?.completedAt || null,
            };
        });

        res.json({
            success: true,
            data: {
                currentStep: progress.currentStep,
                status: progress.status,
                completedAt: progress.completedAt,
                steps: stepsWithProgress,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/onboarding/steps
 * Get all onboarding steps
 */
export const getOnboardingSteps = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const steps = await prisma.onboardingStep.findMany({
            orderBy: { stepNumber: 'asc' },
        });

        res.json({
            success: true,
            data: steps,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/onboarding/steps/:stepNumber/data
 * Save data for a specific step (without completing it)
 */
export const saveStepData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const stepNumber = parseInt(req.params.stepNumber, 10);
        const { data } = req.body;

        // Get the step
        const step = await prisma.onboardingStep.findUnique({
            where: { stepNumber },
        });

        if (!step) {
            throw errors.notFound('Onboarding step');
        }

        // Get or create onboarding progress
        let progress = await prisma.onboardingProgress.findUnique({
            where: { clientId },
        });

        if (!progress) {
            progress = await prisma.onboardingProgress.create({
                data: {
                    clientId,
                    currentStep: 1,
                    status: 'IN_PROGRESS',
                },
            });
        }

        // Upsert step progress
        const stepProgress = await prisma.stepProgress.upsert({
            where: {
                onboardingProgressId_onboardingStepId: {
                    onboardingProgressId: progress.id,
                    onboardingStepId: step.id,
                },
            },
            update: {
                data,
                status: 'IN_PROGRESS',
            },
            create: {
                onboardingProgressId: progress.id,
                onboardingStepId: step.id,
                data,
                status: 'IN_PROGRESS',
            },
        });

        // Update overall progress status if still pending
        if (progress.status === 'PENDING') {
            await prisma.onboardingProgress.update({
                where: { id: progress.id },
                data: { status: 'IN_PROGRESS' },
            });
        }

        res.json({
            success: true,
            data: stepProgress,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/onboarding/steps/:stepNumber/complete
 * Mark a step as completed
 */
export const completeStep = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.client!.id;
        const stepNumber = parseInt(req.params.stepNumber, 10);
        const { data } = req.body;

        // Get the step
        const step = await prisma.onboardingStep.findUnique({
            where: { stepNumber },
        });

        if (!step) {
            throw errors.notFound('Onboarding step');
        }

        // Get progress
        let progress = await prisma.onboardingProgress.findUnique({
            where: { clientId },
        });

        if (!progress) {
            progress = await prisma.onboardingProgress.create({
                data: {
                    clientId,
                    currentStep: 1,
                    status: 'IN_PROGRESS',
                },
            });
        }

        // Check if step can be completed (must be current or before current)
        if (stepNumber > progress.currentStep) {
            throw errors.badRequest('Cannot complete a step ahead of current progress');
        }

        // Update step progress
        await prisma.stepProgress.upsert({
            where: {
                onboardingProgressId_onboardingStepId: {
                    onboardingProgressId: progress.id,
                    onboardingStepId: step.id,
                },
            },
            update: {
                data: data || undefined,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
            create: {
                onboardingProgressId: progress.id,
                onboardingStepId: step.id,
                data: data || undefined,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });

        // Get total number of steps
        const totalSteps = await prisma.onboardingStep.count();

        // Update overall progress
        const isLastStep = stepNumber === totalSteps;
        const nextStep = Math.min(stepNumber + 1, totalSteps);

        await prisma.onboardingProgress.update({
            where: { id: progress.id },
            data: {
                currentStep: isLastStep ? stepNumber : nextStep,
                status: isLastStep ? 'COMPLETED' : 'IN_PROGRESS',
                completedAt: isLastStep ? new Date() : null,
            },
        });

        // If this is step 1 (personal info), update client profile
        if (stepNumber === 1 && data) {
            await prisma.client.update({
                where: { id: clientId },
                data: {
                    firstName: data.firstName || undefined,
                    lastName: data.lastName || undefined,
                    companyName: data.companyName || undefined,
                    phone: data.phone || undefined,
                },
            });
        }

        // Get updated progress
        const updatedProgress = await prisma.onboardingProgress.findUnique({
            where: { clientId },
            include: {
                stepProgress: {
                    include: {
                        onboardingStep: true,
                    },
                    orderBy: {
                        onboardingStep: {
                            stepNumber: 'asc',
                        },
                    },
                },
            },
        });

        res.json({
            success: true,
            data: {
                message: isLastStep
                    ? 'Onboarding completed!'
                    : `Step ${stepNumber} completed. Proceed to step ${nextStep}.`,
                currentStep: updatedProgress!.currentStep,
                status: updatedProgress!.status,
                completedAt: updatedProgress!.completedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};
