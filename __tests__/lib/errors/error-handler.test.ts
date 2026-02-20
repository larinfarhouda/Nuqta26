import { handleError, isAppError, success, failure } from '@/lib/errors/error-handler';
import { AppError, ValidationError } from '@/lib/errors/app-error';

describe('handleError', () => {
    it('should handle AppError', () => {
        const err = new AppError('App broke', 500, 'SERVER_ERROR');
        const result = handleError(err);
        expect(result).toEqual({ error: 'App broke', code: 'SERVER_ERROR' });
    });

    it('should handle ValidationError with field', () => {
        const err = new ValidationError('Required', 'email');
        const result = handleError(err);
        expect(result).toEqual({ error: 'Required', code: 'VALIDATION_ERROR', field: 'email' });
    });

    it('should handle standard Error', () => {
        const err = new Error('Standard error');
        const result = handleError(err);
        expect(result).toEqual({ error: 'Standard error', code: 'UNKNOWN_ERROR' });
    });

    it('should handle unknown errors', () => {
        const result = handleError('some string');
        expect(result).toEqual({ error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' });
    });
});

describe('isAppError', () => {
    it('should return true for AppError', () => {
        expect(isAppError(new AppError('test'))).toBe(true);
    });

    it('should return true for subclasses', () => {
        expect(isAppError(new ValidationError('test'))).toBe(true);
    });

    it('should return false for standard Error', () => {
        expect(isAppError(new Error('test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
        expect(isAppError('string')).toBe(false);
    });
});

describe('success', () => {
    it('should wrap data in success result', () => {
        const result = success({ id: '1' });
        expect(result).toEqual({ success: true, data: { id: '1' } });
    });
});

describe('failure', () => {
    it('should wrap error in failure result', () => {
        const result = failure(new AppError('Oops', 400, 'BAD'));
        expect(result).toEqual({
            success: false,
            error: { error: 'Oops', code: 'BAD' },
        });
    });

    it('should handle unknown errors', () => {
        const result = failure(42);
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('UNKNOWN_ERROR');
    });
});
