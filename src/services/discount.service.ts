import { DiscountRepository } from '@/repositories/discount.repository';
import { EventRepository } from '@/repositories/event.repository';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger/logger';

/**
 * Discount Service
 * Handles business logic for discount codes and validation
 */
export class DiscountService {
    constructor(
        private discountRepo: DiscountRepository,
        private eventRepo: EventRepository
    ) { }

    /**
     * Validate discount code for an event
     */
    async validateDiscountCode(code: string, eventId: string, totalAmount: number) {
        logger.info('DiscountService: Validating discount code', { code, eventId });

        const discount = await this.discountRepo.findByCode(code);

        if (!discount) {
            throw new ValidationError('Invalid discount code', 'code');
        }

        // Check if active
        if (!discount.is_active) {
            throw new ValidationError('This discount code is no longer active', 'code');
        }

        // Check expiry
        if (discount.expiry_date) {
            const expiryDate = new Date(discount.expiry_date);
            if (expiryDate < new Date()) {
                throw new ValidationError('This discount code has expired', 'code');
            }
        }

        // Check max uses
        if (discount.max_uses && discount.used_count) {
            if (discount.used_count >= discount.max_uses) {
                throw new ValidationError('This discount code has reached its usage limit', 'code');
            }
        }

        // Check event-specific
        if (discount.event_id && discount.event_id !== eventId) {
            throw new ValidationError('This discount code is not valid for this event', 'code');
        }

        // Check minimum purchase amount
        if (discount.min_purchase_amount && totalAmount < discount.min_purchase_amount) {
            throw new ValidationError(
                `Minimum purchase amount of ${discount.min_purchase_amount} required`,
                'code'
            );
        }

        logger.info('Discount code validated successfully', { code, discountId: discount.id });
        return discount;
    }

    /**
     * Calculate discount amount
     */
    calculateDiscountAmount(
        discountType: string,
        discountValue: number,
        totalAmount: number
    ): number {
        if (discountType === 'percentage') {
            return (totalAmount * discountValue) / 100;
        } else if (discountType === 'fixed') {
            return Math.min(discountValue, totalAmount); // Don't discount more than total
        }
        return 0;
    }

    /**
     * Apply discount code
     */
    async applyDiscount(code: string, eventId: string, totalAmount: number) {
        const discount = await this.validateDiscountCode(code, eventId, totalAmount);

        const discountAmount = this.calculateDiscountAmount(
            discount.discount_type,
            discount.discount_value,
            totalAmount
        );

        return {
            discountId: discount.id,
            discountAmount,
            finalAmount: totalAmount - discountAmount
        };
    }

    /**
     * Check and apply bulk discount
     */
    async checkBulkDiscount(eventId: string, quantity: number, ticketPrice: number) {
        logger.info('DiscountService: Checking bulk discount', { eventId, quantity });

        const bulkDiscounts = await this.discountRepo.findBulkDiscountsByEventId(eventId);

        if (!bulkDiscounts || bulkDiscounts.length === 0) {
            return null;
        }

        // Find applicable discount (highest min_quantity that user meets)
        const applicableDiscount = bulkDiscounts
            .filter(d => quantity >= d.min_quantity)
            .sort((a, b) => b.min_quantity - a.min_quantity)[0];

        if (!applicableDiscount) {
            return null;
        }

        const totalBeforeDiscount = ticketPrice * quantity;
        const discountAmount = this.calculateDiscountAmount(
            applicableDiscount.discount_type,
            applicableDiscount.discount_value,
            totalBeforeDiscount
        );

        logger.info('Bulk discount applied', {
            eventId,
            quantity,
            discountAmount
        });

        return {
            discountAmount,
            discountType: applicableDiscount.discount_type,
            discountValue: applicableDiscount.discount_value,
            minQuantity: applicableDiscount.min_quantity
        };
    }

    /**
     * Get vendor discount codes
     */
    async getVendorDiscounts(vendorId: string) {
        logger.info('DiscountService: Fetching vendor discounts', { vendorId });
        return await this.discountRepo.findByVendorId(vendorId);
    }

    /**
     * Create discount code
     */
    async createDiscount(params: {
        vendorId: string;
        code: string;
        discountType: string;
        discountValue: number;
        eventId?: string;
        expiryDate?: string;
        maxUses?: number;
        minPurchaseAmount?: number;
    }) {
        logger.info('DiscountService: Creating discount', {
            vendorId: params.vendorId,
            code: params.code
        });

        // Validation
        if (params.code.length < 3) {
            throw new ValidationError('Code must be at least 3 characters', 'code');
        }

        if (params.discountValue <= 0) {
            throw new ValidationError('Discount value must be positive', 'discountValue');
        }

        if (params.discountType === 'percentage' && params.discountValue > 100) {
            throw new ValidationError('Percentage discount cannot exceed 100%', 'discountValue');
        }

        // Check if event exists (if event-specific)
        if (params.eventId) {
            const event = await this.eventRepo.findById(params.eventId);
            if (!event) {
                throw new NotFoundError('Event');
            }
            if (event.vendor_id !== params.vendorId) {
                throw new ValidationError('Event does not belong to this vendor');
            }
        }

        const discount = await this.discountRepo.create({
            vendor_id: params.vendorId,
            code: params.code.toUpperCase(),
            discount_type: params.discountType,
            discount_value: params.discountValue,
            event_id: params.eventId || null,
            expiry_date: params.expiryDate || null,
            max_uses: params.maxUses || null,
            min_purchase_amount: params.minPurchaseAmount || null,
            is_active: true,
            used_count: 0
        });

        logger.info('Discount created successfully', { discountId: discount.id });
        return discount;
    }

    /**
     * Update discount code
     */
    async updateDiscount(
        discountId: string,
        vendorId: string,
        updates: {
            isActive?: boolean;
            expiryDate?: string;
            maxUses?: number;
        }
    ) {
        logger.info('DiscountService: Updating discount', { discountId, vendorId });

        const discount = await this.discountRepo.update(discountId, vendorId, {
            is_active: updates.isActive,
            expiry_date: updates.expiryDate,
            max_uses: updates.maxUses
        });

        logger.info('Discount updated successfully', { discountId });
        return discount;
    }

    /**
     * Deactivate discount code
     */
    async deactivateDiscount(discountId: string, vendorId: string) {
        logger.info('DiscountService: Deactivating discount', { discountId, vendorId });

        return await this.discountRepo.update(discountId, vendorId, {
            is_active: false
        });
    }

    /**
     * Delete discount code
     */
    async deleteDiscount(discountId: string, vendorId: string) {
        logger.info('DiscountService: Deleting discount', { discountId, vendorId });

        await this.discountRepo.delete(discountId, vendorId);
        logger.info('Discount deleted successfully', { discountId });
    }
}
