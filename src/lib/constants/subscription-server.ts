'use server';

/**
 * Server-side DB-backed subscription helpers
 * Kept separate from the shared constants to avoid pulling
 * `next/headers` into client component bundles.
 */

import { SUBSCRIPTION_TIERS, type SubscriptionTierConfig, type BadgeType } from './subscription';

/**
 * Load tiers from the database. Server-side only.
 * Returns a map of tier ID → config, falling back to hardcoded values on error.
 */
export async function loadTiersFromDB(): Promise<Record<string, SubscriptionTierConfig>> {
    try {
        const { createAdminClient } = await import('@/utils/supabase/server');
        const client = createAdminClient();
        const { data, error } = await (client as any)
            .from('subscription_tiers')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            return SUBSCRIPTION_TIERS;
        }

        const result: Record<string, SubscriptionTierConfig> = {};
        for (const row of data) {
            result[row.id] = {
                id: row.id,
                name: row.name,
                maxActiveEvents: row.max_active_events === -1 ? Infinity : row.max_active_events,
                regularPrice: Number(row.regular_price),
                founderPrice: Number(row.founder_price),
                badge: (row.badge as BadgeType) || null,
                features: Array.isArray(row.features) ? row.features : [],
            };
        }
        return result;
    } catch {
        // Fallback to hardcoded constants
        return SUBSCRIPTION_TIERS;
    }
}

/**
 * Server-side: get event limit for a tier from the DB
 */
export async function getEventLimitFromDB(tierId: string): Promise<number> {
    const tiers = await loadTiersFromDB();
    const tier = tiers[tierId];
    return tier ? tier.maxActiveEvents : 1;
}

/**
 * Server-side: check if a vendor can create more events (DB-backed)
 */
export async function canCreateEventFromDB(
    tierId: string,
    currentActiveEvents: number
): Promise<boolean> {
    const limit = await getEventLimitFromDB(tierId);
    return currentActiveEvents < limit;
}

/**
 * Server-side: get required upgrade tier (DB-backed)
 */
export async function getRequiredUpgradeTierFromDB(
    currentTierId: string
): Promise<string | null> {
    const tiers = await loadTiersFromDB();
    const tierIds = Object.keys(tiers);
    const sorted = tierIds.sort((a, b) => {
        const aOrder = tiers[a]?.maxActiveEvents ?? 0;
        const bOrder = tiers[b]?.maxActiveEvents ?? 0;
        return aOrder - bOrder;
    });
    const currentIndex = sorted.indexOf(currentTierId);
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return sorted[currentIndex + 1];
}
