'use client';

import { useTranslations } from 'next-intl';
import StarRating from './StarRating';

type ReviewStatsProps = {
    averageRating: number;
    reviewCount: number;
    ratingDistribution?: {
        rating_1_count: number;
        rating_2_count: number;
        rating_3_count: number;
        rating_4_count: number;
        rating_5_count: number;
    };
    compact?: boolean;
};

export default function ReviewStats({
    averageRating,
    reviewCount,
    ratingDistribution,
    compact = false
}: ReviewStatsProps) {
    const t = useTranslations('Reviews');

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <StarRating rating={averageRating} size="sm" showValue />
                <span className="text-xs text-gray-500 font-bold">
                    ({reviewCount})
                </span>
            </div>
        );
    }

    const distribution = ratingDistribution || {
        rating_1_count: 0,
        rating_2_count: 0,
        rating_3_count: 0,
        rating_4_count: 0,
        rating_5_count: 0
    };

    const total = reviewCount || 1; // Avoid division by zero

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-xl">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Average Rating */}
                <div className="flex flex-col items-center justify-center min-w-[120px]">
                    <div className="text-5xl md:text-6xl font-black text-gray-900 mb-2" dir="ltr">
                        {averageRating.toFixed(1)}
                    </div>
                    <StarRating rating={averageRating} size="lg" />
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-3">
                        {t('reviews_count', { count: reviewCount })}
                    </p>
                </div>

                {/* Rating Distribution */}
                {reviewCount > 0 && (
                    <div className="flex-1 w-full space-y-2">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                            {t('rating_distribution')}
                        </p>
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = distribution[`rating_${rating}_count` as keyof typeof distribution] || 0;
                            const percentage = (count / total) * 100;

                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-16" dir="ltr">
                                        <span className="text-xs font-black text-gray-700">{rating}</span>
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 w-12 text-right" dir="ltr">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Add missing import
import { Star } from 'lucide-react';
