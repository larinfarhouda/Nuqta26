import { type SubscriptionTier, SUBSCRIPTION_TIERS } from '@/lib/constants/subscription';

/**
 * Feature gate hook — returns what a vendor can/can't do based on their tier.
 * Use this to conditionally render or lock UI features.
 */
export function useFeatureGate(vendorTier: SubscriptionTier = 'free') {
    const config = SUBSCRIPTION_TIERS[vendorTier];

    return {
        // Feature access
        canUseDiscounts: vendorTier !== 'free',
        canUseCustomerCRM: vendorTier !== 'free',
        canUseAdvancedAnalytics: vendorTier !== 'free',
        canUseMultipleTickets: vendorTier !== 'free',
        canUseBulkDiscounts: vendorTier !== 'free',
        canUseReviewRequests: vendorTier !== 'free',

        // Limits
        maxGalleryPhotos: config.maxGalleryPhotos,
        maxActiveEvents: config.maxActiveEvents,
        maxTicketTypes: config.maxTicketTypes,

        // Badge
        hasBadge: config.badge !== null,
        badgeType: config.badge,

        // Priority
        hasPrioritySearch: vendorTier !== 'free',

        // Tier info
        tier: vendorTier,
        tierName: config.name,
        tierNameAr: config.nameAr,
        isPaid: vendorTier !== 'free',
    };
}

export type FeatureGate = ReturnType<typeof useFeatureGate>;
