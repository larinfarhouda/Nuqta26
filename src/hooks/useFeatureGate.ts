import { type SubscriptionTier, SUBSCRIPTION_TIERS, normalizeTier } from '@/lib/constants/subscription';

/**
 * Feature gate hook — returns what a vendor can/can't do based on their tier.
 * Use this to conditionally render or lock UI features.
 */
export function useFeatureGate(vendorTier: string = 'free') {
    const normalizedTier = normalizeTier(vendorTier);
    const config = SUBSCRIPTION_TIERS[normalizedTier];

    return {
        // Feature access
        canUseDiscounts: normalizedTier !== 'free',
        canUseCustomerCRM: normalizedTier !== 'free',
        canUseAdvancedAnalytics: normalizedTier !== 'free',
        canUseMultipleTickets: normalizedTier !== 'free',
        canUseBulkDiscounts: normalizedTier !== 'free',
        canUseReviewRequests: normalizedTier !== 'free',

        // Limits
        maxGalleryPhotos: config.maxGalleryPhotos,
        maxActiveEvents: config.maxActiveEvents,
        maxTicketTypes: config.maxTicketTypes,

        // Badge
        hasBadge: config.badge !== null,
        badgeType: config.badge,

        // Priority
        hasPrioritySearch: normalizedTier !== 'free',

        // Tier info
        tier: normalizedTier,
        tierName: config.name,
        tierNameAr: config.nameAr,
        isPaid: normalizedTier !== 'free',
    };
}

export type FeatureGate = ReturnType<typeof useFeatureGate>;
