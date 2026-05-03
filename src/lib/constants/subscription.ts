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

/**
 * Type for tier IDs
 */
export type SubscriptionTier = 'free' | 'pro' | 'business';
export type BillingPeriod = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';
export type BadgeType = 'verified' | 'premium' | null;

/**
 * Shape of a subscription tier config (matches the DB schema)
 */
export interface SubscriptionTierConfig {
    id: string;
    name: string;
    nameAr: string;
    maxActiveEvents: number; // Infinity for unlimited
    maxTicketTypes: number;  // Per event
    maxGalleryPhotos: number; // Per event
    monthlyPrice: number;
    annualPrice: number;
    badge: BadgeType;
    features: string[];
    featuresAr: string[];
}

/**
 * Hardcoded fallback tiers — used as defaults and for client-side rendering.
 * The admin dashboard can override these values in the database.
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
    free: {
        id: 'free',
        name: 'Free',
        nameAr: 'مجاني',
        maxActiveEvents: 3,
        maxTicketTypes: 1,
        maxGalleryPhotos: 5,
        monthlyPrice: 0,
        annualPrice: 0,
        badge: null,
        features: [
            '✅ 3 active events',
            '🌐 Custom vendor landing page',
            '📧 Bilingual email notifications',
            '💳 Accept & confirm bookings',
            '📍 Public event page with map',
            '📷 Photo gallery (up to 5 photos)',
            '📊 Basic dashboard',
            '📱 Instagram event import',
            '🔗 One-tap social share cards',
        ],
        featuresAr: [
            '✅ 3 فعاليات نشطة',
            '🌐 صفحة هبوط خاصة بك',
            '📧 إشعارات بريدية بالعربية والإنجليزية',
            '💳 استقبال وتأكيد الحجوزات',
            '📍 صفحة فعالية عامة مع خريطة',
            '📷 معرض صور (حتى 5 صور)',
            '📊 لوحة تحكم أساسية',
            '📱 استيراد من انستغرام',
            '🔗 بطاقات مشاركة اجتماعية',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        nameAr: 'برو',
        maxActiveEvents: Infinity,
        maxTicketTypes: Infinity,
        maxGalleryPhotos: Infinity,
        monthlyPrice: 299,
        annualPrice: 2990,
        badge: 'verified' as const,
        features: [
            '🚀 Unlimited active events',
            '✅ Verified badge',
            '🎫 Multiple ticket types per event',
            '💰 Discount codes & coupons',
            '📦 Bulk discounts',
            '👥 Customer management CRM',
            '📈 Advanced analytics (gender, age, loyalty)',
            '⭐ Automated review request emails',
            '📷 Unlimited photo gallery',
            '🌟 Priority in search results',
            '🔔 Event sold-out notifications',
        ],
        featuresAr: [
            '🚀 فعاليات نشطة بلا حدود',
            '✅ شارة موثق',
            '🎫 أنواع تذاكر متعددة لكل فعالية',
            '💰 أكواد خصم وكوبونات',
            '📦 خصومات جماعية',
            '👥 إدارة العملاء CRM',
            '📈 تحليلات متقدمة (جنس، عمر، ولاء)',
            '⭐ إيميلات طلب تقييم تلقائية',
            '📷 معرض صور بلا حدود',
            '🌟 أولوية في نتائج البحث',
            '🔔 إشعارات عند نفاذ التذاكر',
        ],
    },
    business: {
        id: 'business',
        name: 'Business',
        nameAr: 'الأعمال',
        maxActiveEvents: Infinity,
        maxTicketTypes: Infinity,
        maxGalleryPhotos: Infinity,
        monthlyPrice: 499,
        annualPrice: 4990,
        badge: 'premium' as const,
        features: [
            '⭐ Premium partner badge',
            '✅ Everything in Pro',
            '👨‍💼 Dedicated account manager',
            '💬 24/7 WhatsApp support',
            '📞 Free marketing consultations',
            '🎨 Custom email branding (coming soon)',
            '📱 WhatsApp API notifications (coming soon)',
            '🔧 API access for integrations (coming soon)',
        ],
        featuresAr: [
            '⭐ شارة شريك متميز',
            '✅ كل مزايا برو',
            '👨‍💼 مدير حساب مخصص',
            '💬 دعم واتساب 24/7',
            '📞 استشارات تسويقية مجانية',
            '🎨 تخصيص البريد الإلكتروني (قريبًا)',
            '📱 إشعارات واتساب API (قريبًا)',
            '🔧 واجهة API للتكامل (قريبًا)',
        ],
    },
};

/**
 * Get the subscription price for a vendor
 * Takes into account billing period (monthly vs annual)
 */
export function getSubscriptionPrice(
    tier: SubscriptionTier,
    period: BillingPeriod = 'monthly'
): number {
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    return period === 'annual' ? tierConfig.annualPrice : tierConfig.monthlyPrice;
}

/**
 * Get the effective monthly price (for display purposes)
 * Annual price divided by 12
 */
export function getEffectiveMonthlyPrice(
    tier: SubscriptionTier,
    period: BillingPeriod = 'monthly'
): number {
    if (period === 'monthly') return SUBSCRIPTION_TIERS[tier].monthlyPrice;
    return Math.round(SUBSCRIPTION_TIERS[tier].annualPrice / 12);
}

/**
 * Get annual savings amount
 */
export function getAnnualSavings(tier: SubscriptionTier): number {
    const config = SUBSCRIPTION_TIERS[tier];
    return (config.monthlyPrice * 12) - config.annualPrice;
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
    if (currentTier === 'free') return 'pro';
    if (currentTier === 'pro') return 'business';
    return null; // Already on highest tier
}

// Server-side DB-backed helpers are in ./subscription-server.ts
// to avoid pulling next/headers into client component bundles.
