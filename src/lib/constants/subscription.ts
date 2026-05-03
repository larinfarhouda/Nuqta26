/**
 * Subscription tier configuration and limits
 * 
 * Source of truth is the `subscription_tiers` database table,
 * managed via the admin dashboard.
 * 
 * This file provides:
 * - TypeScript types
 * - Synchronous fallback constants (used when DB is unavailable or on client-side)
 * - Async DB-backed helpers for server-side enforcement
 */

// Launch period end date - founder pricing available until this date
export const LAUNCH_END_DATE = new Date('2026-05-01'); // 3 months from Feb 1 launch

/**
 * Type for tier IDs
 */
export type SubscriptionTier = 'starter' | 'growth' | 'professional';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';
export type BadgeType = 'verified' | 'premium' | null;

/**
 * Shape of a subscription tier config (matches the DB schema)
 */
export interface SubscriptionTierConfig {
    id: string;
    name: string;
    maxActiveEvents: number; // Infinity for unlimited
    regularPrice: number;
    founderPrice: number;
    badge: BadgeType;
    features: string[];
}

/**
 * Hardcoded fallback tiers — used as defaults and for client-side rendering.
 * The admin dashboard can override these values in the database.
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
    starter: {
        id: 'starter',
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
        id: 'growth',
        maxActiveEvents: 3,
        name: 'Growth',
        regularPrice: 999,
        founderPrice: 499,
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
        id: 'professional',
        maxActiveEvents: Infinity,
        name: 'Professional',
        regularPrice: 1999,
        founderPrice: 999,
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
};

/**
 * Determine if a vendor is eligible for founder pricing
 * based on when they signed up to the platform
 */
export function isEligibleForFounderPricing(signupDate: Date): boolean {
    return signupDate < LAUNCH_END_DATE;
}

/**
 * Get the subscription price for a vendor (synchronous fallback)
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
 * Get the event limit for a subscription tier (synchronous fallback)
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
 * Check if a vendor can create more events based on their tier (synchronous fallback)
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

// Server-side DB-backed helpers are in ./subscription-server.ts
// to avoid pulling next/headers into client component bundles.
