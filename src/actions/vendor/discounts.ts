'use server';

import { createClient } from '@/utils/supabase/server';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { revalidatePath } from 'next/cache';
import { UnauthorizedError } from '@/lib/errors/app-error';

/**
 * Create discount code
 */
export async function createDiscountCode(data: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    event_id?: string;
    min_purchase_amount?: number;
    max_uses?: number;
    expiry_date?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const discountService = factory.getDiscountService();

        await discountService.createDiscount({
            vendorId: user.id,
            code: data.code,
            discountType: data.discount_type,
            discountValue: data.discount_value,
            eventId: data.event_id,
            minPurchaseAmount: data.min_purchase_amount,
            maxUses: data.max_uses,
            expiryDate: data.expiry_date
        });

        revalidatePath('/dashboard/vendor');
        logger.info('Discount code created', { vendorId: user.id, code: data.code });

        return { success: true };
    } catch (error) {
        logger.error('Failed to create discount code', { error, code: data.code });
        return { error: error instanceof Error ? error.message : 'Failed to create discount code' };
    }
}

/**
 * Get vendor discount codes with event details
 */
export async function getVendorDiscountCodes() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const factory = new ServiceFactory(supabase);
        const discountService = factory.getDiscountService();

        const codes = await discountService.getVendorDiscounts(user.id);

        // Fetch event titles for event-specific discounts
        const codesWithEvents = await Promise.all(
            codes.map(async (code) => {
                if (code.event_id) {
                    const { data: event } = await supabase
                        .from('events')
                        .select('title')
                        .eq('id', code.event_id)
                        .single();

                    return {
                        ...code,
                        events: event ? { title: event.title } : null
                    };
                }
                return { ...code, events: null };
            })
        );

        logger.info('Vendor discount codes fetched', { vendorId: user.id, count: codes.length });
        return codesWithEvents;
    } catch (error) {
        logger.error('Failed to get vendor discount codes', { error });
        return [];
    }
}

/**
 * Delete discount code
 */
export async function deleteDiscountCode(id: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const discountService = factory.getDiscountService();

        await discountService.deleteDiscount(id, user.id);

        revalidatePath('/dashboard/vendor');
        logger.info('Discount code deleted', { vendorId: user.id, discountId: id });

        return { success: true };
    } catch (error) {
        logger.error('Failed to delete discount code', { error, discountId: id });
        return { error: error instanceof Error ? error.message : 'Failed to delete discount code' };
    }
}

/**
 * Toggle discount code active status
 */
export async function toggleDiscountCode(id: string, isActive: boolean) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const discountService = factory.getDiscountService();

        await discountService.updateDiscount(id, user.id, { isActive });

        revalidatePath('/dashboard/vendor');
        logger.info('Discount code toggled', { vendorId: user.id, discountId: id, isActive });

        return { success: true };
    } catch (error) {
        logger.error('Failed to toggle discount code', { error, discountId: id });
        return { error: error instanceof Error ? error.message : 'Failed to toggle discount code' };
    }
}
