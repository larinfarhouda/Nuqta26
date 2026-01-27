import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { DatabaseError, UnauthorizedError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger/logger';

/**
 * Base repository class
 * All repositories should extend this class
 */
export abstract class BaseRepository {
    protected client: SupabaseClient<Database>;

    constructor(client: SupabaseClient<Database>) {
        this.client = client;
    }

    /**
     * Handle Supabase errors and convert to AppError
     */
    protected handleError(error: any, context?: string): never {
        logger.error('Database error', {
            context,
            error: error.message,
            code: error.code,
            details: error.details
        });

        throw new DatabaseError(
            error.message || 'Database operation failed',
            error
        );
    }

    /**
     * Check if error is "not found" error
     */
    protected isNotFoundError(error: any): boolean {
        return error?.code === 'PGRST116';
    }

    /**
     * Get current authenticated user
     */
    protected async getCurrentUser() {
        const { data: { user }, error } = await this.client.auth.getUser();

        if (error) {
            logger.error('Failed to get current user', { error: error.message });
            throw new UnauthorizedError('Authentication required');
        }

        if (!user) {
            throw new UnauthorizedError('User not authenticated');
        }

        return user;
    }

    /**
     * Get current user ID (convenience method)
     */
    protected async getCurrentUserId(): Promise<string> {
        const user = await this.getCurrentUser();
        return user.id;
    }
}
