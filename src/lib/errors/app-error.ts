/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation error - for invalid input data
 */
export class ValidationError extends AppError {
    constructor(message: string, public field?: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

/**
 * Not found error - for resources that don't exist
 */
export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

/**
 * Unauthorized error - for authentication failures
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

/**
 * Forbidden error - for authorization failures
 */
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

/**
 * Database error - for database operation failures
 */
export class DatabaseError extends AppError {
    constructor(message: string, public originalError?: any) {
        super(message, 500, 'DATABASE_ERROR');
    }
}

/**
 * Business logic error - for business rule violations
 */
export class BusinessLogicError extends AppError {
    constructor(message: string) {
        super(message, 400, 'BUSINESS_LOGIC_ERROR');
    }
}

/**
 * Conflict error - for resource conflicts
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
    }
}
