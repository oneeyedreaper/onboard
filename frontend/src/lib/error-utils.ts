/**
 * Type-safe error handling utilities
 */

import { ApiError } from './api';

/**
 * Extracts error message from unknown error type
 * Use this instead of `error: any` in catch blocks
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.userMessage || error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unexpected error occurred';
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    );
}
