/**
 * Vendor Discounts Server Action Tests
 */

import { createDiscountCode, getVendorDiscountCodes, deleteDiscountCode, toggleDiscountCode } from '@/actions/vendor/discounts';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockGetUser = jest.fn();
const mockGetDiscountService = jest.fn();

jest.mock('@/services/service-factory', () => ({
    ServiceFactory: jest.fn().mockImplementation(() => ({
        getDiscountService: mockGetDiscountService,
    })),
}));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Vendor Discount Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateClient.mockResolvedValue({
            auth: { getUser: mockGetUser },
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { title: 'Test Event' }, error: null }),
            }),
        } as any);
    });

    describe('createDiscountCode', () => {
        it('should create discount and return success', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetDiscountService.mockReturnValue({
                createDiscount: jest.fn().mockResolvedValue(undefined),
            });

            const result = await createDiscountCode({
                code: 'SAVE10',
                discount_type: 'percentage',
                discount_value: 10,
            });
            expect(result).toEqual({ success: true });
        });

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await createDiscountCode({
                code: 'SAVE10',
                discount_type: 'percentage',
                discount_value: 10,
            });
            expect(result.error).toBeDefined();
        });

        it('should return error on service failure', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetDiscountService.mockReturnValue({
                createDiscount: jest.fn().mockRejectedValue(new Error('Duplicate code')),
            });

            const result = await createDiscountCode({
                code: 'SAVE10',
                discount_type: 'percentage',
                discount_value: 10,
            });
            expect(result.error).toBe('Duplicate code');
        });
    });

    describe('getVendorDiscountCodes', () => {
        it('should return discount codes for authenticated vendor', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            const codes = [{ id: 'd1', code: 'SAVE10', event_id: null }];
            mockGetDiscountService.mockReturnValue({
                getVendorDiscounts: jest.fn().mockResolvedValue(codes),
            });

            const result = await getVendorDiscountCodes();
            expect(result).toHaveLength(1);
            expect(result[0].events).toBeNull();
        });

        it('should enrich codes with event titles', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            const codes = [{ id: 'd1', code: 'SAVE10', event_id: 'e1' }];
            mockGetDiscountService.mockReturnValue({
                getVendorDiscounts: jest.fn().mockResolvedValue(codes),
            });

            const result = await getVendorDiscountCodes();
            expect(result[0].events).toEqual({ title: 'Test Event' });
        });

        it('should return empty array when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getVendorDiscountCodes();
            expect(result).toEqual([]);
        });
    });

    describe('deleteDiscountCode', () => {
        it('should delete and return success', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetDiscountService.mockReturnValue({
                deleteDiscount: jest.fn().mockResolvedValue(undefined),
            });

            const result = await deleteDiscountCode('d1');
            expect(result).toEqual({ success: true });
        });

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await deleteDiscountCode('d1');
            expect(result.error).toBeDefined();
        });
    });

    describe('toggleDiscountCode', () => {
        it('should toggle and return success', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetDiscountService.mockReturnValue({
                updateDiscount: jest.fn().mockResolvedValue(undefined),
            });

            const result = await toggleDiscountCode('d1', true);
            expect(result).toEqual({ success: true });
        });

        it('should return error on failure', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetDiscountService.mockReturnValue({
                updateDiscount: jest.fn().mockRejectedValue(new Error('Not found')),
            });

            const result = await toggleDiscountCode('d1', true);
            expect(result.error).toBe('Not found');
        });
    });
});
