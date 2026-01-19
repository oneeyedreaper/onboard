import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError, errors } from '../utils/errors.js';
import { config } from '../config/index.js';

/**
 * Global error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error in development (skip common expected errors)
    if (config.env === 'development' && err.name !== 'TokenExpiredError') {
        console.error('Error:', err);
    }

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        res.status(422).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: formattedErrors,
            },
        });
        return;
    }

    // Handle our custom API errors
    if (err instanceof ApiError) {
        res.status(err.statusCode).json(err.toJSON());
        return;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid token',
            },
        });
        return;
    }

    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Token has expired',
            },
        });
        return;
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;

        // Unique constraint violation
        if (prismaError.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: `A record with this ${prismaError.meta?.target?.[0] || 'value'} already exists`,
                },
            });
            return;
        }

        // Record not found
        if (prismaError.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Record not found',
                },
            });
            return;
        }
    }

    // Default error response
    const statusCode = 500;
    const message = config.env === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message,
            ...(config.env === 'development' && { stack: err.stack }),
        },
    });
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Silently ignore common noise requests (browser extensions, dev tools)
    const ignoredPaths = ['/socket.io', '/favicon.ico', '/__webpack_hmr'];
    if (ignoredPaths.some(path => req.path.startsWith(path))) {
        res.status(404).end();
        return;
    }
    next(errors.notFound(`Route ${req.method} ${req.path}`));
};
