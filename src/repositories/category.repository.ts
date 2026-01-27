import { BaseRepository } from './base.repository';
import { Tables } from '@/types/database.types';

type Category = Tables<'categories'>;

/**
 * Category Repository
 * Handles all database operations for categories
 */
export class CategoryRepository extends BaseRepository {
    /**
     * Get all categories ordered by name
     */
    async findAll(): Promise<Category[]> {
        const { data, error } = await this.client
            .from('categories')
            .select('*')
            .order('name_en', { ascending: true });

        if (error) this.handleError(error, 'CategoryRepository.findAll');
        return data || [];
    }

    /**
     * Find category by ID
     */
    async findById(id: string): Promise<Category | null> {
        const { data, error } = await this.client
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'CategoryRepository.findById');
        }

        return data;
    }

    /**
     * Find category by slug
     */
    async findBySlug(slug: string): Promise<Category | null> {
        const { data, error } = await this.client
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'CategoryRepository.findBySlug');
        }

        return data;
    }

    /**
     * Find multiple categories by IDs
     */
    async findByIds(ids: string[]): Promise<Category[]> {
        if (ids.length === 0) return [];

        const { data, error } = await this.client
            .from('categories')
            .select('*')
            .in('id', ids);

        if (error) this.handleError(error, 'CategoryRepository.findByIds');
        return data || [];
    }
}
