/**
 * DiscountService Tests
 * Tests for discount code validation and application
 */

import { DiscountService } from '@/services/discount.service';
import { DiscountRepository } from '@/repositories/discount.repository';
import { EventRepository } from '@/repositories/event.repository';
import { ValidationError, NotFoundError } from '@/lib/errors/app-error';

describe('DiscountService', () => {
    let discountService: DiscountService;
    let mockDiscountRepo: jest.Mocked<DiscountRepository>;
    let mockEventRepo: jest.Mocked<EventRepository>;

    beforeEach(() => {
        mockDiscountRepo = {
            findByCode: jest.fn(),
            findBulkDiscountsByEventId: jest.fn(),
            findById: jest.fn(),
            findByVendorId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;

        mockEventRepo = {
            findById: jest.fn(),
        } as any;

        discountService = new DiscountService(mockDiscountRepo, mockEventRepo);
    });

    describe('validateDiscountCode', () => {
        it('should validate active discount code successfully', async () => {
            const discount = {
                id: 'discount-123',
                code: 'SAVE20',
                discount_type: 'percentage',
                discount_value: 20,
                is_active: true,
                expiry_date: '2026-12-31T23:59:59Z',
                max_uses: 100,
                used_count: 50,
                event_id: null,
                min_purchase_amount: null,
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            const result = await discountService.validateDiscountCode('SAVE20', 'event-123', 100);

            expect(result).toEqual(discount);
        });

        it('should throw error when code not found', async () => {
            mockDiscountRepo.findByCode.mockResolvedValue(null);

            await expect(
                discountService.validateDiscountCode('NOTFOUND', 'event-123', 100)
            ).rejects.toThrow(ValidationError);
        });

        it('should throw error when code is inactive', async () => {
            const discount = {
                id: 'discount-123',
                code: 'INACTIVE',
                is_active: false,
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            await expect(
                discountService.validateDiscountCode('INACTIVE', 'event-123', 100)
            ).rejects.toThrow('no longer active');
        });

        it('should throw error when code has expired', async () => {
            const discount = {
                id: 'discount-123',
                code: 'EXPIRED',
                is_active: true,
                expiry_date: '2025-01-01T00:00:00Z',
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            await expect(
                discountService.validateDiscountCode('EXPIRED', 'event-123', 100)
            ).rejects.toThrow('expired');
        });

        it('should throw error when usage limit reached', async () => {
            const discount = {
                id: 'discount-123',
                code: 'LIMITED',
                is_active: true,
                max_uses: 10,
                used_count: 10,
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            await expect(
                discountService.validateDiscountCode('LIMITED', 'event-123', 100)
            ).rejects.toThrow('usage limit');
        });

        it('should throw error for wrong event', async () => {
            const discount = {
                id: 'discount-123',
                code: 'EVENT20',
                is_active: true,
                event_id: 'event-456',
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            await expect(
                discountService.validateDiscountCode('EVENT20', 'event-123', 100)
            ).rejects.toThrow('not valid for this event');
        });

        it('should throw error when minimum purchase not met', async () => {
            const discount = {
                id: 'discount-123',
                code: 'MIN50',
                is_active: true,
                min_purchase_amount: 50,
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            await expect(
                discountService.validateDiscountCode('MIN50', 'event-123', 30)
            ).rejects.toThrow('Minimum purchase');
        });
    });

    describe('calculateDiscountAmount', () => {
        it('should calculate percentage discount correctly', () => {
            const result = discountService.calculateDiscountAmount('percentage', 20, 100);
            expect(result).toBe(20);
        });

        it('should calculate fixed discount correctly', () => {
            const result = discountService.calculateDiscountAmount('fixed', 25, 100);
            expect(result).toBe(25);
        });

        it('should not exceed total amount for fixed discount', () => {
            const result = discountService.calculateDiscountAmount('fixed', 150, 100);
            expect(result).toBe(100);
        });

        it('should return 0 for invalid discount type', () => {
            const result = discountService.calculateDiscountAmount('invalid', 20, 100);
            expect(result).toBe(0);
        });
    });

    describe('applyDiscount', () => {
        it('should apply percentage discount successfully', async () => {
            const discount = {
                id: 'discount-123',
                code: 'SAVE20',
                discount_type: 'percentage',
                discount_value: 20,
                is_active: true,
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            const result = await discountService.applyDiscount('SAVE20', 'event-123', 100);

            expect(result.discountAmount).toBe(20);
            expect(result.finalAmount).toBe(80);
            expect(result.discountId).toBe('discount-123');
        });

        it('should apply fixed discount successfully', async () => {
            const discount = {
                id: 'discount-456',
                code: 'FLAT25',
                discount_type: 'fixed',
                discount_value: 25,
                is_active: true,
            };

            mockDiscountRepo.findByCode.mockResolvedValue(discount as any);

            const result = await discountService.applyDiscount('FLAT25', 'event-123', 100);

            expect(result.discountAmount).toBe(25);
            expect(result.finalAmount).toBe(75);
        });
    });

    describe('checkBulkDiscount', () => {
        it('should apply bulk disount for qualifying quantity', async () => {
            const bulkDiscounts = [
                {
                    min_quantity: 5,
                    discount_type: 'percentage',
                    discount_value: 10,
                },
                {
                    min_quantity: 10,
                    discount_type: 'percentage',
                    discount_value: 20,
                },
            ];

            mockDiscountRepo.findBulkDiscountsByEventId.mockResolvedValue(bulkDiscounts as any);

            const result = await discountService.checkBulkDiscount('event-123', 15, 50);

            expect(result?.discountAmount).toBe(150); // 15 * 50 * 0.2
            expect(result?.minQuantity).toBe(10);
        });

        it('should return null when no bulk discounts available', async () => {
            mockDiscountRepo.findBulkDiscountsByEventId.mockResolvedValue([]);

            const result = await discountService.checkBulkDiscount('event-123', 10, 50);

            expect(result).toBeNull();
        });

        it('should return null when quantity too low', async () => {
            const bulkDiscounts = [
                { min_quantity: 10, discount_type: 'percentage', discount_value: 10 },
            ];

            mockDiscountRepo.findBulkDiscountsByEventId.mockResolvedValue(bulkDiscounts as any);

            const result = await discountService.checkBulkDiscount('event-123', 5, 50);

            expect(result).toBeNull();
        });
    });

    describe('createDiscount', () => {
        it('should create discount successfully', async () => {
            const params = {
                vendorId: 'vendor-123',
                code: 'NEW20',
                discountType: 'percentage',
                discountValue: 20,
            };

            const createdDiscount = {
                id: 'discount-789',
                ...params,
                code: 'NEW20',
            };

            mockDiscountRepo.create.mockResolvedValue(createdDiscount as any);

            const result = await discountService.createDiscount(params);

            expect(result.id).toBe('discount-789');
            expect(mockDiscountRepo.create).toHaveBeenCalled();
        });

        it('should throw error for short code', async () => {
            await expect(
                discountService.createDiscount({
                    vendorId: 'vendor-123',
                    code: 'AB',
                    discountType: 'percentage',
                    discountValue: 20,
                })
            ).rejects.toThrow('at least 3 characters');
        });

        it('should throw error for negative discount value', async () => {
            await expect(
                discountService.createDiscount({
                    vendorId: 'vendor-123',
                    code: 'NEGATIVE',
                    discountType: 'percentage',
                    discountValue: -10,
                })
            ).rejects.toThrow('must be positive');
        });

        it('should throw error for percentage over 100', async () => {
            await expect(
                discountService.createDiscount({
                    vendorId: 'vendor-123',
                    code: 'OVER100',
                    discountType: 'percentage',
                    discountValue: 150,
                })
            ).rejects.toThrow('cannot exceed 100%');
        });

        it('should validate event ownership when event-specific', async () => {
            const event = {
                id: 'event-123',
                vendor_id: 'other-vendor',
            };

            mockEventRepo.findById.mockResolvedValue(event as any);

            await expect(
                discountService.createDiscount({
                    vendorId: 'vendor-123',
                    code: 'EVENT20',
                    discountType: 'percentage',
                    discountValue: 20,
                    eventId: 'event-123',
                })
            ).rejects.toThrow('does not belong to this vendor');
        });
    });

    describe('getVendorDiscounts', () => {
        it('should return vendor discounts', async () => {
            const discounts = [
                { id: 'discount-1', code: 'SAVE10' },
                { id: 'discount-2', code: 'SAVE20' },
            ];

            mockDiscountRepo.findByVendorId.mockResolvedValue(discounts as any);

            const result = await discountService.getVendorDiscounts('vendor-123');

            expect(result).toHaveLength(2);
        });
    });
});
