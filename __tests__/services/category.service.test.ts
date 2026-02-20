/**
 * CategoryService Tests
 * Tests for category lookup business logic
 */

import { CategoryService } from '@/services/category.service';
import { CategoryRepository } from '@/repositories/category.repository';
import { mockCategory } from '../mocks/data.mock';

describe('CategoryService', () => {
    let categoryService: CategoryService;
    let mockCategoryRepo: jest.Mocked<CategoryRepository>;

    beforeEach(() => {
        mockCategoryRepo = {
            findAll: jest.fn(),
            findBySlug: jest.fn(),
            findById: jest.fn(),
        } as any;

        categoryService = new CategoryService(mockCategoryRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllCategories', () => {
        it('should return all categories', async () => {
            const categories = [
                mockCategory(),
                mockCategory({ id: 'category-456', name_en: 'Sports', slug: 'sports' }),
            ];
            mockCategoryRepo.findAll.mockResolvedValue(categories);

            const result = await categoryService.getAllCategories();

            expect(result).toHaveLength(2);
            expect(mockCategoryRepo.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no categories exist', async () => {
            mockCategoryRepo.findAll.mockResolvedValue([]);

            const result = await categoryService.getAllCategories();

            expect(result).toHaveLength(0);
        });
    });

    describe('getCategoryBySlug', () => {
        it('should return category when found', async () => {
            const category = mockCategory();
            mockCategoryRepo.findBySlug.mockResolvedValue(category);

            const result = await categoryService.getCategoryBySlug('music');

            expect(result).toEqual(category);
            expect(mockCategoryRepo.findBySlug).toHaveBeenCalledWith('music');
        });

        it('should return null when category not found', async () => {
            mockCategoryRepo.findBySlug.mockResolvedValue(null);

            const result = await categoryService.getCategoryBySlug('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('getCategoryById', () => {
        it('should return category when found by ID', async () => {
            const category = mockCategory();
            mockCategoryRepo.findById.mockResolvedValue(category);

            const result = await categoryService.getCategoryById('category-123');

            expect(result).toEqual(category);
            expect(mockCategoryRepo.findById).toHaveBeenCalledWith('category-123');
        });

        it('should return null when category ID not found', async () => {
            mockCategoryRepo.findById.mockResolvedValue(null);

            const result = await categoryService.getCategoryById('bad-id');

            expect(result).toBeNull();
        });
    });
});
