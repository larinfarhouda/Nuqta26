/**
 * Category Repository Tests
 */

import { CategoryRepository } from '@/repositories/category.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';

describe('CategoryRepository', () => {
    let repo: CategoryRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        repo = new CategoryRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all categories ordered by name', async () => {
            const categories = [{ id: 'c1', name_en: 'Art' }, { id: 'c2', name_en: 'Music' }];
            mockClient._mocks.order.mockResolvedValueOnce({ data: categories, error: null });

            const result = await repo.findAll();
            expect(result).toEqual(categories);
            expect(mockClient.from).toHaveBeenCalledWith('categories');
        });

        it('should return empty array when no categories', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: null });
            const result = await repo.findAll();
            expect(result).toEqual([]);
        });

        it('should throw on error', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
            await expect(repo.findAll()).rejects.toThrow();
        });
    });

    describe('findById', () => {
        it('should return category when found', async () => {
            const category = { id: 'c1', name_en: 'Music' };
            mockClient._mocks.single.mockResolvedValueOnce({ data: category, error: null });

            const result = await repo.findById('c1');
            expect(result).toEqual(category);
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'not found' },
            });
            const result = await repo.findById('missing');
            expect(result).toBeNull();
        });

        it('should throw on other errors', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '500', message: 'DB error' },
            });
            await expect(repo.findById('c1')).rejects.toThrow();
        });
    });

    describe('findBySlug', () => {
        it('should return category when found', async () => {
            const category = { id: 'c1', slug: 'music' };
            mockClient._mocks.single.mockResolvedValueOnce({ data: category, error: null });

            const result = await repo.findBySlug('music');
            expect(result).toEqual(category);
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'not found' },
            });
            const result = await repo.findBySlug('missing');
            expect(result).toBeNull();
        });
    });

    describe('findByIds', () => {
        it('should return categories matching IDs', async () => {
            const categories = [{ id: 'c1' }, { id: 'c2' }];
            mockClient._mocks.in.mockResolvedValueOnce({ data: categories, error: null });

            const result = await repo.findByIds(['c1', 'c2']);
            expect(result).toEqual(categories);
        });

        it('should return empty array for empty input', async () => {
            const result = await repo.findByIds([]);
            expect(result).toEqual([]);
        });

        it('should throw on error', async () => {
            mockClient._mocks.in.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
            await expect(repo.findByIds(['c1'])).rejects.toThrow();
        });
    });
});
