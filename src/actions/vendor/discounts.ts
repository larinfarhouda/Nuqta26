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
