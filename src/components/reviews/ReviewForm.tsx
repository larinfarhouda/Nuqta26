'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import StarRating from './StarRating';
import { submitReview, updateReview } from '@/actions/public/reviews';
import { Loader2 } from 'lucide-react';

type ReviewFormProps = {
    eventId: string;
    existingReview?: {
        id: string;
        rating: number;
        comment?: string;
    };
    onSuccess?: () => void;
    onCancel?: () => void;
};

export default function ReviewForm({
    eventId,
    existingReview,
    onSuccess,
    onCancel
}: ReviewFormProps) {
    const t = useTranslations('Reviews');
    const router = useRouter();

    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!existingReview;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setError(t('error_rating_required'));
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const result = isEditing
                ? await updateReview(existingReview.id, rating, comment)
                : await submitReview(eventId, rating, comment);

            if (result.success) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.refresh();
                }
            } else {
                setError(result.error || t('generic_error'));
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError(t('generic_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-xl">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-6">
                {isEditing ? t('edit_review') : t('write_review')}
            </h3>

            {/* Rating Selection */}
            <div className="mb-6">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    {t('your_rating')}
                </label>
                <StarRating
                    rating={rating}
                    interactive
                    onChange={setRating}
                    size="xl"
                    className="justify-center md:justify-start"
                />
            </div>

            {/* Comment */}
            <div className="mb-6">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    {t('your_review')} <span className="text-gray-300 normal-case">({t('optional')})</span>
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('review_placeholder')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium text-gray-900 placeholder:text-gray-400"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? t('update_review') : t('submit_review')}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {t('cancel')}
                    </button>
                )}
            </div>
        </form>
    );
}
