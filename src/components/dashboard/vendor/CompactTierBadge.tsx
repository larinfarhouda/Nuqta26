'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    SUBSCRIPTION_TIERS,
    normalizeTier,
    type SubscriptionTier
} from '@/lib/constants/subscription';
import { Crown, CheckCircle2 } from 'lucide-react';

interface CompactTierBadgeProps {
    vendorId: string;
    demoMode?: boolean;
}

export default function CompactTierBadge({ vendorId, demoMode = false }: CompactTierBadgeProps) {
    const supabase = createClient();
    const [tier, setTier] = useState<SubscriptionTier>(demoMode ? 'business' : 'free');
    const [loading, setLoading] = useState(!demoMode);

    useEffect(() => {
        if (demoMode) {
            setLoading(false);
            return;
        }

        async function fetchSubscriptionInfo() {
            const { data } = await supabase
                .from('vendors')
                .select('subscription_tier')
                .eq('id', vendorId)
                .single();

            if (data) {
                setTier(normalizeTier(data.subscription_tier));
            }
            setLoading(false);
        }

        fetchSubscriptionInfo();
    }, [vendorId, demoMode]);

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-100 h-7 w-24 rounded-lg" />
        );
    }

    // Don't show anything for free tier
    if (tier === 'free') return null;

    const tierConfig = SUBSCRIPTION_TIERS[tier];

    const tierStyles = {
        pro: {
            bg: 'bg-[#2CA58D]/10',
            border: 'border-[#2CA58D]/30',
            text: 'text-[#2CA58D]',
            icon: CheckCircle2,
            iconColor: 'text-[#2CA58D]',
            label: 'موثق'
        },
        business: {
            bg: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10',
            border: 'border-purple-300/50',
            text: 'text-purple-600',
            icon: Crown,
            iconColor: 'text-purple-600',
            label: 'متميز'
        }
    };

    const style = tierStyles[tier as 'pro' | 'business'];
    const Icon = style.icon;

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${style.bg} ${style.border} border rounded-lg`}>
            <Icon className={`w-3.5 h-3.5 ${style.iconColor} fill-current`} />
            <span className={`text-xs font-black ${style.text} uppercase tracking-wide`}>
                {style.label}
            </span>
        </div>
    );
}
