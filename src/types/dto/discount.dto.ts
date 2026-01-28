import { Tables } from '@/types/database.types';

// Base types
export type DiscountCode = Tables<'discount_codes'>;
export type BulkDiscount = Tables<'bulk_discounts'>;

/**
 * Discount Code Input for Creation
 */
export interface CreateDiscountCodeInput {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    event_id?: string;
    min_purchase_amount?: number;
    max_uses?: number;
    expiry_date?: string;
}

/**
 * Discount Code with Event Details (for vendor list)
 */
export interface DiscountCodeWithEvent extends DiscountCode {
    events?: {
        title: string;
    } | null;
}

/**
 * Bulk Discount Input
 */
export interface BulkDiscountInput {
    min_quantity: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
}

/**
 * Discount Validation Result
 */
export interface DiscountValidationResult {
    isValid: boolean;
    discountAmount: number;
    finalAmount: number;
    error?: string;
}
