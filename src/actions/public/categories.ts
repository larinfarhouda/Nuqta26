'use server';

import { createClient } from '@/utils/supabase/server';
import { CategoryRepository } from '@/repositories/category.repository';
import { CategoryService } from '@/services/category.service';
import { handleError } from '@/lib/errors/error-handler';
import { logger } from '@/lib/logger/logger';

/**
 * Get all categories
 * Returns categories ordered by name (English)
 */
export async function getCategories() {
    try {
        const supabase = await createClient();
        const categoryRepo = new CategoryRepository(supabase);
        const categoryService = new CategoryService(categoryRepo);

        const data = await categoryService.getAllCategories();
        return { data, error: null };
    } catch (error) {
        logger.error('Failed to get categories', { error });
        return { data: null, error: handleError(error) };
    }
}
