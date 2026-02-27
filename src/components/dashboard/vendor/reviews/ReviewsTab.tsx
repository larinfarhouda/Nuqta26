'use client';

import { useState, useEffect, useMemo } from 'react';
import { Star, Loader2, Filter, Calendar } from 'lucide-react';
import { getVendorAllReviews } from '@/actions/vendor/reviews';
import { useTranslations, useLocale } from 'next-intl';
import StarRating from '@/components/reviews/StarRating';

export default function ReviewsTab({ demoMode = false }: { demoMode?: boolean }) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [filterEvent, setFilterEvent] = useState<string>('all');
    const t = useTranslations('Dashboard.vendor.reviews');
    const locale = useLocale();

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        setLoading(true);
        const data = await getVendorAllReviews();
        setReviews(data.reviews);
        setRating(data.rating);
        setLoading(false);
    };

    // Get unique event names for filter
    const eventNames = useMemo(() => {
        const names = new Map<string, string>();
        reviews.forEach((r) => {
            if (r.events?.title) names.set(r.events.title, r.events.title);
        });
        return Array.from(names.values());
    }, [reviews]);

    const filteredReviews = useMemo(() => {
        if (filterEvent === 'all') return reviews;
        return reviews.filter((r) => r.events?.title === filterEvent);
    }, [reviews, filterEvent]);

    // Compute distribution
    const dist = useMemo(() => {
        const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r) => {
            const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
            if (d[rounded] !== undefined) d[rounded]++;
        });
        return d;
    }, [reviews]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-gray-900">{t('title')}</h3>
                <p className="text-sm text-gray-500">{t('subtitle')}</p>
            </div>

            {rating.count > 0 ? (
                <>
                    {/* Rating Summary Card */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex flex-row gap-4 md:gap-8 items-center">
                            {/* Average */}
                            <div className="flex flex-col items-center justify-center shrink-0">
                                <div className="text-3xl md:text-5xl font-black text-gray-900 mb-1" dir="ltr">
                                    {rating.average.toFixed(1)}
                                </div>
                                <StarRating rating={rating.average} size="sm" />
                                <p className="text-[9px] md:text-xs font-black text-gray-500 uppercase tracking-widest mt-1 md:mt-2">
                                    {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
                                </p>
                            </div>

                            {/* Distribution */}
                            <div className="flex-1 space-y-1 md:space-y-1.5">
                                {[5, 4, 3, 2, 1].map((r) => {
                                    const count = dist[r as keyof typeof dist] || 0;
                                    const percentage = rating.count > 0 ? (count / rating.count) * 100 : 0;
                                    return (
                                        <div key={r} className="flex items-center gap-1.5 md:gap-3">
                                            <div className="flex items-center gap-0.5 w-8 md:w-12 justify-end" dir="ltr">
                                                <span className="text-[10px] md:text-xs font-black text-gray-700">{r}</span>
                                                <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-400 fill-amber-400" />
                                            </div>
                                            <div className="flex-1 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] md:text-xs font-bold text-gray-500 w-5 md:w-8 text-left" dir="ltr">
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    {eventNames.length > 1 && (
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterEvent}
                                onChange={(e) => setFilterEvent(e.target.value)}
                                className="text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                            >
                                <option value="all">{t('filter_all')}</option>
                                {eventNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Review Cards */}
                    <div className="space-y-3">
                        {filteredReviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-black text-primary">
                                            {(review.profiles?.full_name || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-bold text-sm text-gray-900 truncate">
                                                {review.profiles?.full_name || 'Anonymous'}
                                            </p>
                                            <span className="text-[10px] md:text-xs text-gray-400 shrink-0">
                                                {new Date(review.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="mt-0.5">
                                            <StarRating rating={review.rating} size="sm" />
                                        </div>
                                    </div>
                                </div>

                                {review.comment && (
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium mb-2">
                                        {review.comment}
                                    </p>
                                )}

                                {review.events?.title && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span className="text-[10px] md:text-xs font-bold text-gray-400 truncate">{review.events.title}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="py-16 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold text-gray-500">{t('no_reviews')}</p>
                </div>
            )}
        </div>
    );
}
