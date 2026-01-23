'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import Image from 'next/image';
import StarRating from './StarRating';
import { deleteReview, markReviewHelpful, flagReview } from '@/actions/public/reviews';
import { ThumbsUp, Flag, Edit2, Trash2, MoreVertical } from 'lucide-react';

type ReviewCardProps = {
    review: {
        id: string;
        rating: number;
        comment?: string;
        created_at: string;
        profiles?: {
            full_name?: string;
            avatar_url?: string;
        };
        helpful_count?: number;
        not_helpful_count?: number;
        user_voted?: boolean;
    };
    isOwner?: boolean;
    currentUserId?: string;
    onEdit?: () => void;
};

export default function ReviewCard({
    review,
    isOwner = false,
    currentUserId,
    onEdit
}: ReviewCardProps) {
    const t = useTranslations('Reviews');
    const router = useRouter();

    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFlagging, setIsFlagging] = useState(false);
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
    const [hasVoted, setHasVoted] = useState(review.user_voted || false);

    const handleDelete = async () => {
        if (!confirm(t('delete_confirm'))) return;

        setIsDeleting(true);
        const result = await deleteReview(review.id);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.error);
            setIsDeleting(false);
        }
    };

    const handleHelpful = async () => {
        if (!currentUserId) {
            router.push('/login');
            return;
        }

        const result = await markReviewHelpful(review.id, true);

        if (result.success) {
            setHasVoted(!hasVoted);
            setHelpfulCount(prev => hasVoted ? prev - 1 : prev + 1);
        }
    };

    const handleFlag = async () => {
        if (!currentUserId) {
            router.push('/login');
            return;
        }

        if (!confirm(t('flag_confirm'))) return;

        setIsFlagging(true);
        const result = await flagReview(review.id);

        if (result.success) {
            alert(t('flagged_success'));
        } else {
            alert(result.error);
        }
        setIsFlagging(false);
    };

    const reviewDate = new Date(review.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        {review.profiles?.avatar_url ? (
                            <Image
                                src={review.profiles.avatar_url}
                                alt={review.profiles.full_name || 'User'}
                                width={48}
                                height={48}
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-lg font-black text-primary">
                                {(review.profiles?.full_name || 'U')[0].toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* User Info */}
                    <div>
                        <p className="font-black text-sm text-gray-900">
                            {review.profiles?.full_name || t('anonymous_user')}
                        </p>
                        <p className="text-xs text-gray-500 font-bold">{reviewDate}</p>
                    </div>
                </div>

                {/* Actions Menu */}
                {(isOwner || currentUserId) && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10 min-w-[150px]">
                                {isOwner ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onEdit?.();
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            {t('edit_review')}
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {t('delete_review')}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleFlag}
                                        disabled={isFlagging}
                                        className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Flag className="w-4 h-4" />
                                        {t('flag')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rating */}
            <div className="mb-3">
                <StarRating rating={review.rating} size="md" />
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-sm text-gray-700 leading-relaxed mb-4 font-medium">
                    {review.comment}
                </p>
            )}

            {/* Helpful Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                    onClick={handleHelpful}
                    disabled={isOwner}
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-wide transition-colors ${hasVoted
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-primary'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-primary' : ''}`} />
                    <span>{t('helpful')}</span>
                    {helpfulCount > 0 && (
                        <span className="text-gray-400">({helpfulCount})</span>
                    )}
                </button>
            </div>

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    );
}
