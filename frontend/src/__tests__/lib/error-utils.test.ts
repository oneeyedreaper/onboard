import { describe, it, expect } from 'vitest';
import { getErrorMessage, isApiError, hasMessage } from '@/lib/error-utils';
import { ApiError } from '@/lib/api';

describe('Error Utilities', () => {
    describe('getErrorMessage', () => {
        it('extracts message from ApiError', () => {
            const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid input');
            expect(getErrorMessage(error)).toBe('Invalid input');
        });

        it('extracts message from standard Error', () => {
            const error = new Error('Something went wrong');
            expect(getErrorMessage(error)).toBe('Something went wrong');
        });

        it('returns string errors as-is', () => {
            expect(getErrorMessage('Direct error message')).toBe('Direct error message');
        });

        it('returns default message for unknown types', () => {
            expect(getErrorMessage(null)).toBe('An unexpected error occurred');
            expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
            expect(getErrorMessage(123)).toBe('An unexpected error occurred');
        });
    });

    describe('isApiError', () => {
        it('returns true for ApiError instances', () => {
            const error = new ApiError(500, 'SERVER_ERROR', 'Server error');
            expect(isApiError(error)).toBe(true);
        });

        it('returns false for other error types', () => {
            expect(isApiError(new Error('Generic'))).toBe(false);
            expect(isApiError('string error')).toBe(false);
            expect(isApiError(null)).toBe(false);
        });
    });

    describe('hasMessage', () => {
        it('returns true for objects with message property', () => {
            expect(hasMessage({ message: 'test' })).toBe(true);
            expect(hasMessage(new Error('test'))).toBe(true);
        });

        it('returns false for objects without message', () => {
            expect(hasMessage({})).toBe(false);
            expect(hasMessage({ error: 'test' })).toBe(false);
            expect(hasMessage(null)).toBe(false);
            expect(hasMessage('string')).toBe(false);
        });
    });
});
