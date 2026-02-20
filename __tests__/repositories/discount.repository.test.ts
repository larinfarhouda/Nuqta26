/**
 * DiscountRepository Tests
 * Tests for discount code and bulk discount database operations
 */

import { DiscountRepository } from '@/repositories/discount.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';
import { mockDiscount, mockBulkDiscount } from '../mocks/data.mock';

describe('DiscountRepository', () => {
    let discountRepo: DiscountRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        discountRepo = new DiscountRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ─── Discount Codes ─────────────────────────────────────────────────

    describe('findByCode', () => {
        it('should return discount when found (case-insensitive)', async () => {
            const discount = mockDiscount();
            mockClient._mocks.single.mockResolvedValueOnce({ data: discount, error: null });

            const result = await discountRepo.findByCode('test10');

            expect(result).toEqual(discount);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('code', 'TEST10');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await discountRepo.findByCode('NONEXIST');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return discount when found', async () => {
            const discount = mockDiscount();
            mockClient._mocks.single.mockResolvedValueOnce({ data: discount, error: null });

            const result = await discountRepo.findById('discount-123');

            expect(result).toEqual(discount);
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await discountRepo.findById('bad-id');

            expect(result).toBeNull();
        });
    });

    describe('findByVendorId', () => {
        it('should return discounts ordered by date', async () => {
            const discounts = [mockDiscount()];
            mockClient._mocks.order.mockResolvedValueOnce({ data: discounts, error: null });

            const result = await discountRepo.findByVendorId('vendor-123');

            expect(result).toEqual(discounts);
            expect(mockClient.from).toHaveBeenCalledWith('discount_codes');
        });

        it('should return empty array when none exist', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: null });

            const result = await discountRepo.findByVendorId('vendor-123');

            expect(result).toEqual([]);
        });
    });

    describe('findByEventId', () => {
        it('should return event-specific discounts', async () => {
            const discounts = [mockDiscount({ event_id: 'event-123' })];
            mockClient._mocks.order.mockResolvedValueOnce({ data: discounts, error: null });

            const result = await discountRepo.findByEventId('event-123');

            expect(result).toEqual(discounts);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('event_id', 'event-123');
        });
    });

    describe('create', () => {
        it('should insert and return discount', async () => {
            const discount = mockDiscount();
            mockClient._mocks.single.mockResolvedValueOnce({ data: discount, error: null });

            const result = await discountRepo.create(discount as any);

            expect(result).toEqual(discount);
            expect(mockClient._mocks.insert).toHaveBeenCalled();
        });

        it('should throw on error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Insert failed' },
            });

            await expect(discountRepo.create({} as any)).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('should update and return discount', async () => {
            const updated = mockDiscount({ discount_value: 20 });
            mockClient._mocks.single.mockResolvedValueOnce({ data: updated, error: null });

            const result = await discountRepo.update('discount-123', 'vendor-123', { discount_value: 20 } as any);

            expect(result.discount_value).toBe(20);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'discount-123');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('vendor_id', 'vendor-123');
        });
    });

    describe('delete', () => {
        it('should delete discount', async () => {
            // Chain: delete().eq().eq() — second eq resolves
            mockClient._mocks.eq
                .mockReturnValueOnce(mockClient._mocks as any)
                .mockResolvedValueOnce({ error: null });

            await expect(discountRepo.delete('discount-123', 'vendor-123')).resolves.not.toThrow();
            expect(mockClient._mocks.delete).toHaveBeenCalled();
        });
    });

    describe('incrementUsage', () => {
        it('should increment and return new count', async () => {
            // incrementUsage does two Supabase calls:
            // 1. from('discount_codes').select('used_count').eq('id', id).single()
            // 2. from('discount_codes').update({ used_count: newCount }).eq('id', id)
            //
            // The mock chain flows: from() -> queryBuilder, .select() -> queryBuilder,
            // .eq() -> queryBuilder (by default), .single() resolves.
            // Since the default mock already chains properly, we just need single() mock.
            // For the second call, the .eq() at the end resolves

            // Mock the first chain's single() result  
            mockClient._mocks.single.mockResolvedValueOnce({ data: { used_count: 5 }, error: null });

            // After the first chain completes, the second chain starts:
            // from().update().eq() — the last eq returns queryBuilder by default.
            // update() does not throw since we don't call handleError when there's no error.
            // No extra mock needed since the default .eq() returns the query builder.

            const result = await discountRepo.incrementUsage('discount-123');

            expect(result).toBe(6);
        });

        it('should handle null used_count (treat as 0)', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({ data: { used_count: null }, error: null });

            const result = await discountRepo.incrementUsage('discount-123');

            expect(result).toBe(1);
        });
    });

    // ─── Bulk Discounts ─────────────────────────────────────────────────

    describe('findBulkDiscountsByEventId', () => {
        it('should return bulk discounts sorted by quantity desc', async () => {
            const bulks = [mockBulkDiscount()];
            mockClient._mocks.order.mockResolvedValueOnce({ data: bulks, error: null });

            const result = await discountRepo.findBulkDiscountsByEventId('event-123');

            expect(result).toEqual(bulks);
            expect(mockClient.from).toHaveBeenCalledWith('bulk_discounts');
        });

        it('should return empty array when none exist', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: null });

            const result = await discountRepo.findBulkDiscountsByEventId('event-123');

            expect(result).toEqual([]);
        });
    });

    describe('createBulkDiscount', () => {
        it('should create and return bulk discount', async () => {
            const bulk = mockBulkDiscount();
            mockClient._mocks.single.mockResolvedValueOnce({ data: bulk, error: null });

            const result = await discountRepo.createBulkDiscount(bulk as any);

            expect(result).toEqual(bulk);
        });
    });

    describe('deleteBulkDiscount', () => {
        it('should delete by id', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ error: null });

            await expect(discountRepo.deleteBulkDiscount('bulk-123')).resolves.not.toThrow();
        });
    });

    describe('deleteBulkDiscountsByEventId', () => {
        it('should delete all for an event', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ error: null });

            await expect(discountRepo.deleteBulkDiscountsByEventId('event-123')).resolves.not.toThrow();
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('event_id', 'event-123');
        });
    });
});
