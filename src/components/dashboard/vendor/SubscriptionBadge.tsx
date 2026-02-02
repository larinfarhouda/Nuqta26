'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    SUBSCRIPTION_TIERS,
    getSubscriptionPrice,
    getEventLimit,
    type SubscriptionTier
} from '@/lib/constants/subscription';
import { Crown, Sparkles, Check, TrendingUp } from 'lucide-react';

interface SubscriptionBadgeProps {
    vendorId: string;
    activeEventsCount?: number;
    demoMode?: boolean;
}

export default function SubscriptionBadge({ vendorId, activeEventsCount = 0, demoMode = false }: SubscriptionBadgeProps) {
    const supabase = createClient();
    const [tier, setTier] = useState<SubscriptionTier>(demoMode ? 'professional' : 'starter');
    const [isFounder, setIsFounder] = useState(false);
    const [loading, setLoading] = useState(!demoMode);

    useEffect(() => {
        // Skip database fetch in demo mode
        if (demoMode) {
            setLoading(false);
            return;
        }

        async function fetchSubscriptionInfo() {
            const { data } = await supabase
                .from('vendors')
                .select('subscription_tier, is_founder_pricing')
                .eq('id', vendorId)
                .single();

            if (data) {
                setTier((data.subscription_tier || 'starter') as SubscriptionTier);
                setIsFounder(data.is_founder_pricing || false);
            }
            setLoading(false);
        }

        fetchSubscriptionInfo();
    }, [vendorId, demoMode]);

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-100 h-24 rounded-2xl" />
        );
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier];
    const price = getSubscriptionPrice(tier, isFounder);
    const limit = getEventLimit(tier);
    const limitReached = activeEventsCount >= limit;

    // Tier-specific styling - Using brand colors
    const tierStyles = {
        starter: {
            bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
            border: 'border-gray-200',
            text: 'text-gray-700',
            badge: 'bg-gray-500',
            icon: Sparkles,
            iconColor: 'text-gray-500',
            accentBg: 'bg-gray-100'
        },
        growth: {
            bg: 'bg-gradient-to-br from-[#2CA58D]/5 to-[#2CA58D]/10',
            border: 'border-[#2CA58D]/30',
            text: 'text-[#2CA58D]',
            badge: 'bg-[#2CA58D]',
            icon: TrendingUp,
            iconColor: 'text-[#2CA58D]',
            accentBg: 'bg-[#2CA58D]/10'
        },
        professional: {
            bg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50',
            border: 'border-purple-300',
            text: 'text-purple-900',
            badge: 'bg-gradient-to-r from-purple-500 to-pink-500',
            icon: Crown,
            iconColor: 'text-purple-600',
            accentBg: 'bg-purple-100'
        }
    };

    const style = tierStyles[tier];
    const Icon = style.icon;

    return (
        <div className={`${style.bg} ${style.border} border-2 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${style.accentBg} ${style.iconColor} shadow-sm`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`text-lg font-black ${style.text}`}>
                                {tierConfig.name === 'Starter' ? 'باقة مجانية' :
                                    tierConfig.name === 'Growth' ? 'باقة النمو' :
                                        'باقة احترافية'}
                            </h3>
                            {tierConfig.badge && (
                                <span className={`${style.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm`}>
                                    {tierConfig.badge === 'verified' ? '✓ موثق' : '⭐ متميز'}
                                </span>
                            )}
                        </div>
                        {isFounder && tier !== 'starter' && (
                            <div className="flex items-center gap-1 mt-1">
                                <Sparkles className="w-3 h-3 text-[#2CA58D]" />
                                <span className="text-xs font-bold text-[#2CA58D]">تسعير المؤسسين</span>
                            </div>
                        )}
                    </div>
                </div>

                {price > 0 && (
                    <div className="text-left">
                        <div className={`text-2xl font-black ${style.text}`}>
                            {price.toLocaleString()} ₺
                        </div>
                        <div className="text-xs text-gray-500 font-medium">/ شهرياً</div>
                        {isFounder && (
                            <div className="text-xs text-gray-400 font-bold line-through opacity-60">
                                {tierConfig.regularPrice.toLocaleString()} ₺
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Event Limit Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-700">الفعاليات النشطة</span>
                    <span className={`font-black ${limitReached ? 'text-red-600' : style.text}`}>
                        {activeEventsCount} / {limit === Infinity ? '∞' : limit}
                    </span>
                </div>

                {limit !== Infinity && (
                    <div className="relative h-2 bg-white/60 rounded-full overflow-hidden">
                        <div
                            className={`absolute inset-y-0 right-0 ${limitReached ? 'bg-red-500' : style.badge} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min((activeEventsCount / limit) * 100, 100)}%` }}
                        />
                    </div>
                )}

                {limitReached && tier !== 'professional' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs font-bold text-red-700 text-center">
                            ⚠️ وصلت للحد الأقصى - قم بالترقية لإنشاء المزيد من الفعاليات
                        </p>
                    </div>
                )}
            </div>

            {/* Features List */}
            <div className="mt-4 pt-4 border-t border-white/50">
                <div className="space-y-2">
                    {tierConfig.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 font-medium leading-tight">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upgrade CTA */}
            {tier === 'starter' && (
                <button className="mt-4 w-full py-3 bg-[#2CA58D] hover:bg-[#258f7a] text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                    ترقية إلى باقة النمو ←
                </button>
            )}
            {tier === 'growth' && (
                <button className="mt-4 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                    ترقية إلى الباقة الاحترافية ←
                </button>
            )}
        </div>
    );
}
