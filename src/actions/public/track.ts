'use server';

import { createClient } from '@/utils/supabase/server';
import { trackActivity } from '@/lib/track-activity';

/**
 * Track a page view. Fire-and-forget — never blocks rendering.
 */
export async function trackPageView(
    targetType: string,
    targetId: string,
    details?: Record<string, any>
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Only track authenticated users
        if (!user) return;

        trackActivity({
            userId: user.id,
            action: `${targetType}_viewed`,
            targetType,
            targetId,
            details,
        });
    } catch {
        // Never throw from page view tracking
    }
}
