'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createDiscountCode(data: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    event_id?: string;
    min_purchase_amount?: number;
    max_uses?: number;
    expiry_date?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Validation
    if (!data.code || data.code.trim().length === 0) {
        return { error: 'Discount code is required' };
    }

    if (data.discount_value < 0) {
        return { error: 'Discount value cannot be negative' };
    }

    if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return { error: 'Percentage discount cannot exceed 100%' };
    }

    if (data.min_purchase_amount !== undefined && data.min_purchase_amount < 0) {
        return { error: 'Minimum purchase amount cannot be negative' };
    }

    if (data.max_uses !== undefined && data.max_uses < 1) {
        return { error: 'Maximum uses must be at least 1' };
    }

    if (data.expiry_date) {
        const expiry = new Date(data.expiry_date);
        if (isNaN(expiry.getTime())) {
            return { error: 'Invalid expiry date' };
        }
        if (expiry < new Date()) {
            return { error: 'Expiry date must be in the future' };
        }
    }

    const { error } = await (supabase.from('discount_codes' as any) as any).insert({
        vendor_id: user.id,
        ...data,
        code: data.code.toUpperCase().trim()
    });

    if (error) return { error: error.message };

    revalidatePath('/dashboard/vendor');
    return { success: true };
}

export async function getVendorDiscountCodes() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await (supabase.from('discount_codes' as any) as any)
        .select(`
            *,
            events (title)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching discount codes:', error);
        return [];
    }

    return data;
}

export async function deleteDiscountCode(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await (supabase.from('discount_codes' as any) as any)
        .delete()
        .eq('id', id)
        .eq('vendor_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/vendor');
    return { success: true };
}

export async function toggleDiscountCode(id: string, isActive: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await (supabase.from('discount_codes' as any) as any)
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('vendor_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/vendor');
    return { success: true };
}
