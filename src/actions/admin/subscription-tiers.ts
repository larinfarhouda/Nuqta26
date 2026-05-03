'use server';

import { createAdminClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger/logger';
import { ServiceFactory } from '@/services/service-factory';

// Re-use the admin guard from the parent actions
async function requireAdmin() {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Forbidden: Admin access required');

    return { user, supabase };
}

/**
 * Get all subscription tiers for admin management
 */
export async function getAdminSubscriptionTiers() {
    try {
        await requireAdmin();
        const adminClient = createAdminClient();
        const factory = new ServiceFactory(adminClient);
        const service = factory.getSubscriptionTierService();
        return await service.getAllTiers();
    } catch (error) {
        logger.error('Failed to get subscription tiers', { error });
        return [];
    }
}

/**
 * Update a subscription tier's configuration
 */
export async function updateSubscriptionTier(
    tierId: string,
    updates: {
        name?: string;
        max_active_events?: number;
        regular_price?: number;
        badge?: string | null;
        features?: string[];
    }
) {
    try {
        const { user } = await requireAdmin();
        const adminClient = createAdminClient();
        const factory = new ServiceFactory(adminClient);
        const service = factory.getSubscriptionTierService();

        const updated = await service.updateTier(tierId, updates);

        // Log activity
        const adminService = factory.getAdminService();
        await adminService.logActivity({
            user_id: user.id,
            action: 'subscription_changed',
            entity_type: 'subscription_tier',
            entity_id: tierId,
            metadata: { updates },
        });

        return { success: true, tier: updated };
    } catch (error) {
        logger.error('Failed to update subscription tier', { error, tierId });
        return { error: 'Failed to update subscription tier' };
    }
}
