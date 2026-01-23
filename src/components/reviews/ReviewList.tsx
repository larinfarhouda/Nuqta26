'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReviewCard from './ReviewCard';
import { getEventReviews } from '@/actions/public/reviews';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

type ReviewListProps = {
    eventId: string;
    currentUserId?: string;
    onEditReview?: (reviewId: string) => void;
};

export default function ReviewList({
    eventId,
    currentUserId,
    onEditReview
}: ReviewListProps) {
    const t = useTranslations('Reviews');

    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'helpful'>('newest');

    useEffect(() => {
        loadReviews();
    }, [eventId, page, sortBy]);

    const loadReviews = async () => {
        setLoading(true);
        const result = await getEventReviews(eventId, page, 10, sortBy);

        if (result.success) {
            setReviews(result.data || []);
            setTotalPages(result.totalPages || 1);
        }

        setLoading(false);
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-12 rounded-[2rem] text-center">
                <p className="text-gray-500 font-bold">{t('no_reviews')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sort Options */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">{t('all_reviews')}</h3>
                <select
                    value={sortBy}
                    onChange={(e) => {
                        setSortBy(e.target.value as any);
                        setPage(1);
                    }}
                    className="px-4 py-2 bg-white/60 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="newest">{t('sort_newest')}</option>
                    <option value="highest">{t('sort_highest')}</option>
                    <option value="helpful">{t('sort_helpful')}</option>
                </select>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <ReviewCard
                        key={review.id}
                        review={review}
                        isOwner={review.user_id === currentUserId}
                        currentUserId={currentUserId}
                        onEdit={() => onEditReview?.(review.id)}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="p-2 bg-white/60 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>

                    <span className="text-sm font-black text-gray-700" dir="ltr">
                        {page} / {totalPages}
                    </span>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="p-2 bg-white/60 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </div>
            )}
        </div>
    );
}
