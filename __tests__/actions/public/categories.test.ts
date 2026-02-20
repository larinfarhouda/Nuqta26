/**
 * Public Categories Server Action Tests
 */

import { getCategories } from '@/actions/public/categories';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('@/repositories/category.repository', () => ({
    CategoryRepository: jest.fn(),
}));

const mockGetAllCategories = jest.fn();

jest.mock('@/services/category.service', () => ({
    CategoryService: jest.fn().mockImplementation(() => ({
        getAllCategories: mockGetAllCategories,
    })),
}));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Public Category Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateClient.mockResolvedValue({} as any);
    });

    it('should return categories', async () => {
        const categories = [{ id: 'c1', name_en: 'Music' }];
        mockGetAllCategories.mockResolvedValue(categories);

        const result = await getCategories();
        expect(result.data).toEqual(categories);
        expect(result.error).toBeNull();
    });

    it('should return error on failure', async () => {
        mockGetAllCategories.mockRejectedValue(new Error('DB fail'));

        const result = await getCategories();
        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
    });
});
