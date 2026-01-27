import { AppError, ValidationError } from './app-error';

/**
 * Standard error result type for server actions
 */
export type ErrorResult = {
    error: string;
    code?: string;
    field?: string;
};

/**
 * Success result type
 */
export type SuccessResult<T> = {
    success: true;
    data: T;
};

/**
 * Combined result type
 */
export type Result<T> = SuccessResult<T> | { success: false; error: ErrorResult };

/**
 * Handle errors and convert to standard error result
 */
export function handleError(error: unknown): ErrorResult {
    // Handle known application errors
    if (error instanceof AppError) {
        return {
            error: error.message,
            code: error.code,
            field: error instanceof ValidationError ? error.field : undefined
        };
    }

    // Handle standard errors
    if (error instanceof Error) {
        return {
            error: error.message,
            code: 'UNKNOWN_ERROR'
        };
    }

    // Handle unknown errors
    return {
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
    };
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

/**
 * Create a success result
 */
export function success<T>(data: T): SuccessResult<T> {
    return { success: true, data };
}

/**
 * Create an error result
 */
export function failure(error: unknown): { success: false; error: ErrorResult } {
    return { success: false, error: handleError(error) };
}
