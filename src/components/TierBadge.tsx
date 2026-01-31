'use client';

import { CheckCircle2, Crown } from 'lucide-react';
import type { SubscriptionTier } from '@/lib/constants/subscription';

interface TierBadgeProps {
    tier: SubscriptionTier | null | undefined;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function TierBadge({ tier, size = 'sm', showLabel = true }: TierBadgeProps) {
    if (!tier || tier === 'starter') return null;

    const sizeClasses = {
        sm: 'text-[10px] px-2 py-1 gap-1',
        md: 'text-xs px-2.5 py-1.5 gap-1.5',
        lg: 'text-sm px-3 py-2 gap-2'
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4'
    };

    if (tier === 'growth') {
        return (
            <div className={`inline-flex items-center ${sizeClasses[size]} bg-[#2CA58D]/10 text-[#2CA58D] rounded-lg font-black uppercase tracking-wider`}>
                <CheckCircle2 className={`${iconSizes[size]} fill-current`} />
                {showLabel && <span>Verified</span>}
            </div>
        );
    }

    if (tier === 'professional') {
        return (
            <div className={`inline-flex items-center ${sizeClasses[size]} bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 rounded-lg font-black uppercase tracking-wider border border-purple-200/50`}>
                <Crown className={`${iconSizes[size]} fill-current`} />
                {showLabel && <span>Premium</span>}
            </div>
        );
    }

    return null;
}
