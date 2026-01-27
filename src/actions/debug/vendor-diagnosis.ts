'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Diagnostic tool to check vendor-event relationships
 * Run this as a server action to debug the issue
 */
export async function diagnoseVendorEventRelationship(eventSlug: string) {
    const supabase = await createClient();

    // Get the event with vendor info
    const { data: event, error } = await supabase
        .from('events')
        .select('*, tickets(*), vendors(id, business_name, company_logo, whatsapp_number, slug, bank_name, bank_account_name, bank_iban), bulk_discounts(*)')
        .eq('slug', eventSlug)
        .eq('status', 'published')
        .single();

    if (error) {
        return { error: error.message };
    }

    return {
        event_id: event.id,
        event_title: event.title,
        event_vendor_id: event.vendor_id,
        vendor_from_join: event.vendor,
        has_bank_info: {
            bank_name: !!event.vendor?.bank_name,
            bank_account_name: !!event.vendor?.bank_account_name,
            bank_iban: !!event.vendor?.bank_iban
        }
    };
}
