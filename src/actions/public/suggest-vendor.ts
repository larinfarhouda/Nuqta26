'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger/logger';
import { trackActivity } from '@/lib/track-activity';

/**
 * Submit a vendor suggestion from a public user.
 * Creates a prospect_vendor entry with status 'prospect' and notes indicating it was user-suggested.
 */
export async function suggestVendor(data: {
    business_name: string;
    instagram?: string;
    website?: string;
    reason?: string;
}) {
    try {
        if (!data.business_name?.trim()) {
            return { error: 'Business name is required.' };
        }

        let adminClient;
        try {
            adminClient = await createAdminClient();
        } catch {
            return { error: 'Service unavailable.' };
        }

        // Check for duplicate by business name (case-insensitive)
        const { data: existing } = await adminClient
            .from('prospect_vendors')
            .select('id')
            .ilike('business_name', data.business_name.trim())
            .maybeSingle();

        if (existing) {
            return { success: true, alreadyExists: true };
        }

        // Get current user (optional — anonymous suggestions allowed)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await adminClient
            .from('prospect_vendors')
            .insert({
                business_name: data.business_name.trim(),
                instagram: data.instagram?.trim() || null,
                website: data.website?.trim() || null,
                notes: `[User Suggestion] ${data.reason?.trim() || 'No reason provided'}${user ? ` — by ${user.email}` : ' — anonymous'}`,
                status: 'lead',
                created_by: user?.id || null,
            });

        if (error) {
            logger.error('Failed to create suggested vendor', { error });
            return { error: 'Failed to submit suggestion.' };
        }

        if (user) {
            trackActivity({
                userId: user.id,
                action: 'vendor_suggested',
                details: { business_name: data.business_name },
            });
        }

        return { success: true };
    } catch (error) {
        logger.error('suggestVendor failed', { error });
        return { error: 'An unexpected error occurred.' };
    }
}
