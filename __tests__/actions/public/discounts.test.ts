/**
 * Public Discounts Server Action Tests
 */

import { validateDiscountCode, getBulkDiscounts } from '@/actions/public/discounts';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Public Discount Actions', () => {
    let mockFrom: jest.Mock;
    let mockChain: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockChain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            order: jest.fn(),
        };
        mockFrom = jest.fn().mockReturnValue(mockChain);
        mockCreateClient.mockResolvedValue({ from: mockFrom } as any);
    });

    describe('validateDiscountCode', () => {
        it('should return error for invalid code', async () => {
            mockChain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
            const result = await validateDiscountCode('INVALID', 'v1', 'e1', 100);
            expect(result.error).toBe('invalid_code');
        });

        it('should return error for wrong event', async () => {
            mockChain.single.mockResolvedValue({
                data: { event_id: 'other-event', expiry_date: null, max_uses: null, used_count: 0, min_purchase_amount: 0 },
                error: null,
            });
            const result = await validateDiscountCode('CODE', 'v1', 'e1', 100);
            expect(result.error).toBe('invalid_for_event');
        });

        it('should return error for expired code', async () => {
            mockChain.single.mockResolvedValue({
                data: { event_id: null, expiry_date: '2020-01-01', max_uses: null, used_count: 0, min_purchase_amount: 0 },
                error: null,
            });
            const result = await validateDiscountCode('CODE', 'v1', 'e1', 100);
            expect(result.error).toBe('code_expired');
        });

        it('should return error for exhausted uses', async () => {
            mockChain.single.mockResolvedValue({
                data: { event_id: null, expiry_date: null, max_uses: 5, used_count: 5, min_purchase_amount: 0 },
                error: null,
            });
            const result = await validateDiscountCode('CODE', 'v1', 'e1', 100);
            expect(result.error).toBe('code_usage_limit');
        });

        it('should return error for min purchase not met', async () => {
            mockChain.single.mockResolvedValue({
                data: { event_id: null, expiry_date: null, max_uses: null, used_count: 0, min_purchase_amount: 200 },
                error: null,
            });
            const result = await validateDiscountCode('CODE', 'v1', 'e1', 100);
            expect(result.error).toBe('min_purchase_not_met');
        });

        it('should calculate percentage discount', async () => {
            mockChain.single.mockResolvedValue({
                data: {
                    id: 'd1', event_id: null, expiry_date: null, max_uses: null, used_count: 0,
                    min_purchase_amount: 0, discount_type: 'percentage', discount_value: 10,
                },
                error: null,
            });
            const result = await validateDiscountCode('CODE', 'v1', 'e1', 200);
            expect(result.success).toBe(true);
            expect(result.discountAmount).toBe(20);
        });

        it('should calculate fixed discount', async () => {
            mockChain.single.mockResolvedValue({
                data: {
                    id: 'd1', event_id: null, expiry_date: null, max_uses: null, used_count: 0,
                    min_purchase_amount: 0, discount_type: 'fixed', discount_value: 30,
                },
                error: null,
            });
            const result = await validateDiscountCode('CODE', 'v1', 'e1', 100);
            expect(result.success).toBe(true);
            expect(result.discountAmount).toBe(30);
        });

        it('should cap discount at total amount', async () => {
            mockChain.single.mockResolvedValue({
                data: {
                    id: 'd1', event_id: null, expiry_date: null, max_uses: null, used_count: 0,
                    min_purchase_amount: 0, discount_type: 'fixed', discount_value: 500,
                },
                error: null,
            });
            const result = await validateDiscountCode('CODE', 'v1', 'e1', 100);
            expect(result.discountAmount).toBe(100);
        });
    });

    describe('getBulkDiscounts', () => {
        it('should return bulk discounts', async () => {
            const discounts = [{ id: 'bd1', min_quantity: 5 }];
            mockChain.order.mockResolvedValue({ data: discounts, error: null });
            const result = await getBulkDiscounts('e1');
            expect(result).toEqual(discounts);
        });

        it('should return empty array on error', async () => {
            mockChain.order.mockResolvedValue({ data: null, error: { message: 'fail' } });
            const result = await getBulkDiscounts('e1');
            expect(result).toEqual([]);
        });
    });
});
