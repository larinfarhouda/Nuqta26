import { createAdminClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger/logger';

interface TrackActivityInput {
    userId: string;
    userRole?: 'customer' | 'vendor';
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, any>;
}

/**
 * Fire-and-forget activity tracker.
 * Logs user/vendor actions to `user_activity_logs` without blocking the caller.
 * Never throws — errors are silently logged.
 */
export function trackActivity(input: TrackActivityInput): void {
    // Fire and forget — don't await
    _doTrack(input).catch(() => { });
}

async function _doTrack(input: TrackActivityInput): Promise<void> {
    try {
        const adminClient = createAdminClient();
        await adminClient.from('user_activity_logs').insert({
            user_id: input.userId,
            user_role: input.userRole || 'customer',
            action: input.action,
            target_type: input.targetType || null,
            target_id: input.targetId || null,
            details: input.details || {},
        });
    } catch (err) {
        // Silent fail — tracking should never break the main flow
        logger.warn('Activity tracking failed', { action: input.action, error: err });
    }
}
