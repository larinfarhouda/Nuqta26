'use server';

import { createClient } from '@/utils/supabase/server';

export async function validateDiscountCode(
    code: string,
    vendorId: string,
    eventId: string,
    totalAmount: number
) {
    const supabase = await createClient();

    const { data: discount, error } = await (supabase.from('discount_codes' as any) as any)
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

    if (error || !discount) {
        return { error: 'Invalid discount code' };
    }

    // Check if it belongs to this event (if event_id is set)
    if (discount.event_id && discount.event_id !== eventId) {
        return { error: 'This code is not valid for this event' };
    }

    // Check expiry
    if (discount.expiry_date && new Date(discount.expiry_date) < new Date()) {
        return { error: 'Discount code has expired' };
    }

    // Check max uses
    if (discount.max_uses && discount.used_count >= discount.max_uses) {
        return { error: 'Discount code has reached its maximum uses' };
    }

    // Check min purchase amount
    if (totalAmount < discount.min_purchase_amount) {
        return { error: `Minimum purchase of ${discount.min_purchase_amount} ₺ required` };
    }

    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
        discountAmount = (totalAmount * discount.discount_value) / 100;
    } else {
        discountAmount = discount.discount_value;
    }

    return {
        success: true,
        discountId: discount.id,
        discountAmount: Math.min(discountAmount, totalAmount)
    };
}

export async function getBulkDiscounts(eventId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase.from('bulk_discounts' as any) as any)
        .select('*')
        .eq('event_id', eventId)
        .order('min_quantity', { ascending: true });

    if (error) return [];
    return data;
}
