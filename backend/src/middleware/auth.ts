import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { errors } from '../utils/errors.js';
import prisma from '../lib/prisma.js';
import { Role } from '@prisma/client';

// Extend Express Request to include authenticated client
declare global {
    namespace Express {
        interface Request {
            client?: {
                id: string;
                email: string;
                role: Role;
            };
        }
    }
}

/**
 * Authentication middleware - requires valid access token
 */
export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw errors.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const payload = verifyAccessToken(token);

        if (payload.type !== 'access') {
            throw errors.unauthorized('Invalid token type');
        }

        // Verify client still exists
        const client = await prisma.client.findUnique({
            where: { id: payload.clientId },
            select: { id: true, email: true, role: true },
        });

        if (!client) {
            throw errors.unauthorized('Client not found');
        }

        // Attach client to request
        req.client = client;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication - attaches client if token provided, continues if not
 */
export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = verifyAccessToken(token);

            if (payload.type === 'access') {
                const client = await prisma.client.findUnique({
                    where: { id: payload.clientId },
                    select: { id: true, email: true, role: true },
                });

                if (client) {
                    req.client = client;
                }
            }
        }

        next();
    } catch {
        // Token invalid, continue without auth
        next();
    }
};

/**
 * Admin middleware - requires ADMIN role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    if (!req.client) {
        return next(errors.unauthorized('Authentication required'));
    }

    if (req.client.role !== 'ADMIN') {
        return next(errors.forbidden('Admin access required'));
    }

    next();
};
