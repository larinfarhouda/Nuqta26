/**
 * Public Vendors Server Action Tests
 */

import { getPublicVendor, getAllVendorSlugsForSitemap } from '@/actions/public/vendors';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));
jest.mock('@/repositories/vendor.repository', () => ({ VendorRepository: jest.fn() }));
jest.mock('@/repositories/ticket.repository', () => ({ TicketRepository: jest.fn() }));
jest.mock('@/repositories/category.repository', () => ({ CategoryRepository: jest.fn() }));
jest.mock('@/repositories/review.repository', () => ({
    ReviewRepository: jest.fn().mockImplementation(() => ({
        getVendorRatingSummary: jest.fn().mockResolvedValue({ average: 4.5, count: 10 }),
        getVendorReviews: jest.fn().mockResolvedValue([]),
        findByVendorId: jest.fn().mockResolvedValue([]),
    })),
}));

const mockGetPublicVendor = jest.fn();

jest.mock('@/services/vendor.service', () => ({
    VendorService: jest.fn().mockImplementation(() => ({
        getPublicVendor: mockGetPublicVendor,
    })),
}));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Public Vendor Actions', () => {
    let mockFrom: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({ data: [], error: null }),
        });
        mockCreateClient.mockResolvedValue({ from: mockFrom } as any);
    });

    describe('getPublicVendor', () => {
        it('should return vendor profile', async () => {
            const vendor = { id: 'v1', business_name: 'Test' };
            mockGetPublicVendor.mockResolvedValue(vendor);
            const result = await getPublicVendor('test-vendor');
            expect(result).toEqual(expect.objectContaining({ id: 'v1', business_name: 'Test' }));
        });

        it('should return null on error', async () => {
            mockGetPublicVendor.mockRejectedValue(new Error('Not found'));
            const result = await getPublicVendor('missing');
            expect(result).toBeNull();
        });
    });

    describe('getAllVendorSlugsForSitemap', () => {
        it('should return vendor slugs', async () => {
            const slugs = [{ slug: 'vendor-1', updated_at: '2026-01-01' }];
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: slugs, error: null }),
            });
            const result = await getAllVendorSlugsForSitemap();
            expect(result).toEqual(slugs);
        });

        it('should return empty array on error', async () => {
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
            });
            const result = await getAllVendorSlugsForSitemap();
            expect(result).toEqual([]);
        });
    });
});
