import { CategoryRepository } from '@/repositories/category.repository';
import { logger } from '@/lib/logger/logger';
import { Tables } from '@/types/database.types';

type Category = Tables<'categories'>;

/**
 * Category Service
 * Handles business logic for category operations
 */
export class CategoryService {
    constructor(private categoryRepo: CategoryRepository) { }

    /**
     * Get all categories
     */
    async getAllCategories(): Promise<Category[]> {
        logger.info('Fetching all categories');
        return this.categoryRepo.findAll();
    }

    /**
     * Get category by slug
     */
    async getCategoryBySlug(slug: string): Promise<Category | null> {
        logger.info('Fetching category by slug', { slug });
        return this.categoryRepo.findBySlug(slug);
    }

    /**
     * Get category by ID
     */
    async getCategoryById(id: string): Promise<Category | null> {
        logger.info('Fetching category by ID', { id });
        return this.categoryRepo.findById(id);
    }
}
