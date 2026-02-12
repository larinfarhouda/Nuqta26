'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger/logger';

/**
 * Express interest in a prospect event.
 * User must be logged in.
 */
export async function expressInterest(eventId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'You must be logged in to express interest.' };
        }

        let adminClient;
        try {
            adminClient = createAdminClient();
        } catch {
            return { error: 'Admin features not available in this environment.' };
        }

        // Verify the event is actually a prospect event
        const { data: event } = await adminClient
            .from('events')
            .select('id, prospect_vendor_id')
            .eq('id', eventId)
            .single();

        if (!event || !event.prospect_vendor_id) {
            return { error: 'This is not a prospect event.' };
        }

        // Insert interest (unique constraint will prevent duplicates)
        const { error } = await adminClient
            .from('event_interests')
            .insert({
                event_id: eventId,
                user_id: user.id,
            });

        if (error) {
            if (error.code === '23505') {
                // Unique constraint violation — already interested
                return { success: true, alreadyInterested: true };
            }
            logger.error('Failed to express interest', { error });
            return { error: 'Failed to express interest.' };
        }

        return { success: true };
    } catch (error) {
        logger.error('expressInterest failed', { error });
        return { error: 'An unexpected error occurred.' };
    }
}

/**
 * Check if current user has already expressed interest in an event.
 */
export async function hasExpressedInterest(eventId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        let adminClient;
        try {
            adminClient = createAdminClient();
        } catch {
            return false;
        }
        const { data } = await adminClient
            .from('event_interests')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .maybeSingle();

        return !!data;
    } catch {
        return false;
    }
}

/**
 * Get interest count for an event.
 */
export async function getEventInterestCount(eventId: string): Promise<number> {
    try {
        let adminClient;
        try {
            adminClient = createAdminClient();
        } catch {
            return 0;
        }
        const { count } = await adminClient
            .from('event_interests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

        return count || 0;
    } catch {
        return 0;
    }
}
