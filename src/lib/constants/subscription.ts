/**
 * Subscription tier configuration and limits
 * Supports founder pricing (50% off locked in forever) for early adopters
 */

// Launch period end date - founder pricing available until this date
export const LAUNCH_END_DATE = new Date('2026-05-01'); // 3 months from Feb 1 launch

export const SUBSCRIPTION_TIERS = {
    starter: {
        maxActiveEvents: 1,
        name: 'Starter',
        regularPrice: 0,
        founderPrice: 0,
        badge: null,
        features: [
            '✅ 1 active event',
            '📧 Email notifications to customers',
            '📊 Basic dashboard',
            '💳 Accept & confirm bookings',
            '📍 Public event page',
            '📷 Photo gallery (up to 5 photos)',
            '💬 Email support',
        ],
    },
    growth: {
        maxActiveEvents: 3,
        name: 'Growth',
        regularPrice: 999,
        founderPrice: 499, // 50% off locked in forever
        badge: 'verified' as const,
        features: [
            '✨ 3 active events simultaneously',
            '✅ Verified account badge',
            '📊 Advanced analytics (gender, age, sales)',
            '👥 Customer & booking management',
            '📧 Automated bilingual email notifications',
            '💰 Discount codes & special offers',
            '🎫 Multiple tickets & bulk discounts',
            '📷 Unlimited photo gallery',
            '⚡ Priority support',
            '🌟 Featured in search results',
        ],
    },
    professional: {
        maxActiveEvents: Infinity,
        name: 'Professional',
        regularPrice: 1999,
        founderPrice: 999, // 50% off locked in forever
        badge: 'premium' as const,
        features: [
            '🚀 Unlimited events',
            '⭐ Premium partner badge',
            '📈 Comprehensive analytics & custom reports',
            '👨‍💼 Dedicated account manager',
            '📧 Custom email template branding',
            '🎯 Top priority in search results',
            '💳 Payment gateway integration (coming soon)',
            '📱 WhatsApp API notifications (coming soon)',
            '🔧 API for system integration',
            '🎨 Full brand customization',
            '💬 24/7 WhatsApp support',
            '📞 Free marketing consultations',
        ],
    },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';
export type BadgeType = 'verified' | 'premium' | null;

/**
 * Determine if a vendor is eligible for founder pricing
 * based on when they signed up to the platform
 */
export function isEligibleForFounderPricing(signupDate: Date): boolean {
    return signupDate < LAUNCH_END_DATE;
}

/**
 * Get the subscription price for a vendor
 * Takes into account founder pricing status
 */
export function getSubscriptionPrice(
    tier: SubscriptionTier,
    isFounder: boolean
): number {
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    return isFounder ? tierConfig.founderPrice : tierConfig.regularPrice;
}

/**
 * Get the event limit for a subscription tier
 */
export function getEventLimit(tier: SubscriptionTier): number {
    return SUBSCRIPTION_TIERS[tier].maxActiveEvents;
}

/**
 * Get badge type for a subscription tier
 */
export function getBadgeType(tier: SubscriptionTier): BadgeType {
    return SUBSCRIPTION_TIERS[tier].badge;
}

/**
 * Check if a vendor can create more events based on their tier
 */
export function canCreateEvent(
    tier: SubscriptionTier,
    currentActiveEvents: number
): boolean {
    const limit = getEventLimit(tier);
    return currentActiveEvents < limit;
}

/**
 * Get the required upgrade tier when limit is reached
 */
export function getRequiredUpgradeTier(
    currentTier: SubscriptionTier
): SubscriptionTier | null {
    if (currentTier === 'starter') return 'growth';
    if (currentTier === 'growth') return 'professional';
    return null; // Already on highest tier
}
