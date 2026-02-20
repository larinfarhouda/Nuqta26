import {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    DatabaseError,
    BusinessLogicError,
    ConflictError,
} from '@/lib/errors/app-error';

describe('AppError', () => {
    it('should create with default status 500', () => {
        const err = new AppError('Something broke');
        expect(err.message).toBe('Something broke');
        expect(err.statusCode).toBe(500);
        expect(err.code).toBeUndefined();
        expect(err).toBeInstanceOf(Error);
    });

    it('should accept custom status and code', () => {
        const err = new AppError('Custom', 422, 'CUSTOM');
        expect(err.statusCode).toBe(422);
        expect(err.code).toBe('CUSTOM');
    });
});

describe('ValidationError', () => {
    it('should have status 400 and VALIDATION_ERROR code', () => {
        const err = new ValidationError('Email is required', 'email');
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.field).toBe('email');
        expect(err).toBeInstanceOf(AppError);
    });
});

describe('NotFoundError', () => {
    it('should format resource name in message', () => {
        const err = new NotFoundError('Event');
        expect(err.message).toBe('Event not found');
        expect(err.statusCode).toBe(404);
        expect(err.code).toBe('NOT_FOUND');
    });
});

describe('UnauthorizedError', () => {
    it('should have default message', () => {
        const err = new UnauthorizedError();
        expect(err.message).toBe('Unauthorized');
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('UNAUTHORIZED');
    });

    it('should accept custom message', () => {
        const err = new UnauthorizedError('Token expired');
        expect(err.message).toBe('Token expired');
    });
});

describe('ForbiddenError', () => {
    it('should have status 403', () => {
        const err = new ForbiddenError();
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
    });
});

describe('DatabaseError', () => {
    it('should have status 500 and store original error', () => {
        const original = new Error('Connection refused');
        const err = new DatabaseError('DB failed', original);
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe('DATABASE_ERROR');
        expect(err.originalError).toBe(original);
    });
});

describe('BusinessLogicError', () => {
    it('should have status 400', () => {
        const err = new BusinessLogicError('Tier limit reached');
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('BUSINESS_LOGIC_ERROR');
    });
});

describe('ConflictError', () => {
    it('should have status 409', () => {
        const err = new ConflictError('Slug already exists');
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe('CONFLICT');
    });
});
