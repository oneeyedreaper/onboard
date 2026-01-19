import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validation middleware factory for Zod schemas
 * Validates request body, query, and params
 */
export const validate = (schema: AnyZodObject) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate only request body
 */
export const validateBody = (schema: AnyZodObject) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate only query parameters
 */
export const validateQuery = (schema: AnyZodObject) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate only route parameters
 */
export const validateParams = (schema: AnyZodObject) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            req.params = await schema.parseAsync(req.params);
            next();
        } catch (error) {
            next(error);
        }
    };
};
