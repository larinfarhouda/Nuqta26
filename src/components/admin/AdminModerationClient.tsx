'use client';

import { useState, useTransition } from 'react';
import { Flag, Trash2, Star, Search, Loader2 } from 'lucide-react';
import {
    getAdminFlaggedReviews,
    unflagReview,
    deleteReview,
    toggleFeatureEvent,
    searchEventsForAdmin,
} from '@/actions/admin';
import type { FlaggedReview, PaginatedResult } from '@/types/admin.types';
import { useToast } from '@/components/ui/Toast';

// UI Components
import { AdminCard } from './ui/AdminCard';
import { AdminButton } from './ui/AdminButton';
import { AdminInput } from './ui/AdminInput';
import { AdminBadge } from './ui/AdminBadge';
import { AdminConfirmDialog } from './ui/AdminConfirmDialog';

export default function AdminModerationClient({
    initialReviews,
}: {
    initialReviews: PaginatedResult<FlaggedReview> | null;
}) {
    const [reviews, setReviews] = useState(initialReviews);
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [actionId, setActionId] = useState<string | null>(null);

    // Feature event search
    const [eventQuery, setEventQuery] = useState('');
    const [eventResults, setEventResults] = useState<any[]>([]);
    const [featureLoading, setFeatureLoading] = useState(false);
    
    const { toast } = useToast();

    // Confirm Dialog State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDangerous = false) => {
        setConfirmState({ isOpen: true, title, message, onConfirm, isDangerous });
    };
    const closeConfirm = () => setConfirmState(p => ({ ...p, isOpen: false }));

    const reloadReviews = (p = page) => {
        startTransition(async () => {
            const result = await getAdminFlaggedReviews(p, 20);
            setReviews(result);
        });
    };

    const handleUnflag = async (reviewId: string) => {
        setActionId(reviewId);
        try {
            await unflagReview(reviewId);
            toast('success', 'Review unflagged');
        } catch {
            toast('error', 'Failed to unflag review');
        }
        setActionId(null);
        reloadReviews();
    };

    const handleDelete = async (reviewId: string) => {
        openConfirm('Delete Review', 'Are you sure you want to permanently delete this review? This action cannot be undone.', async () => {
            closeConfirm();
            setActionId(reviewId);
            try {
                await deleteReview(reviewId);
                toast('success', 'Review deleted successfully');
            } catch {
                toast('error', 'Failed to delete review');
            }
            setActionId(null);
            reloadReviews();
        }, true);
    };

    const searchEvents = async () => {
        if (!eventQuery.trim()) return;
        setFeatureLoading(true);
        try {
            const results = await searchEventsForAdmin(eventQuery);
            setEventResults(results);
        } catch {
            toast('error', 'Failed to search events');
        }
        setFeatureLoading(false);
    };

    const handleToggleFeature = async (eventId: string, featured: boolean) => {
        setFeatureLoading(true);
        try {
            await toggleFeatureEvent(eventId, !featured);
            await searchEvents(); // Refresh
            toast('success', featured ? 'Event unfeatured' : 'Event featured');
        } catch {
            toast('error', 'Failed to toggle event feature status');
        }
        setFeatureLoading(false);
    };

    const flaggedReviews = reviews?.data || [];

    return (
        <div className="max-w-[1400px] pb-12">
            <AdminConfirmDialog {...confirmState} onCancel={closeConfirm} />

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Moderation</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    Review flagged content and feature outstanding events
                </p>
            </div>

            {/* Feature Event Tool */}
            <AdminCard className="mb-8 border-2 border-amber-500/20 bg-amber-500/5">
                <h3 className="text-lg font-bold text-amber-600 mb-5 flex items-center gap-2">
                    <Star size={20} fill="currentColor" /> Feature an Event
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="flex-1">
                        <AdminInput
                            placeholder="Search events by title..."
                            value={eventQuery}
                            onChange={(e) => setEventQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchEvents()}
                            icon={<Search size={18} />}
                        />
                    </div>
                    <AdminButton
                        onClick={searchEvents}
                        isLoading={featureLoading}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        Search
                    </AdminButton>
                </div>
                
                {eventResults.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {eventResults.map(e => (
                            <div
                                key={e.id}
                                className="flex justify-between items-center p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors hover:border-amber-500/30 shadow-sm"
                            >
                                <div>
                                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{e.title}</div>
                                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{(e.vendors as any)?.business_name}</div>
                                </div>
                                <button
                                    onClick={() => handleToggleFeature(e.id, e.is_featured)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        e.is_featured 
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30' 
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    <Star size={14} fill={e.is_featured ? 'currentColor' : 'none'} />
                                    {e.is_featured ? 'Unfeature' : 'Feature'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </AdminCard>

            {/* Flagged Reviews */}
            <AdminCard noPadding>
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Flag size={20} className="text-red-500" /> Flagged Reviews
                    </h3>
                    <AdminBadge variant="danger">{flaggedReviews.length}</AdminBadge>
                </div>
                
                {flaggedReviews.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                            <Flag size={32} className="text-emerald-500/50" />
                        </div>
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No flagged reviews</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">The platform is looking good!</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {flaggedReviews.map(r => (
                            <div key={r.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{r.reviewer_name || 'Anonymous'}</span>
                                            <span className="text-amber-500 text-sm tracking-widest">{'★'.repeat(r.rating)}</span>
                                            <AdminBadge variant="danger" className="ml-2">
                                                {r.flag_count} flag{r.flag_count !== 1 ? 's' : ''}
                                            </AdminBadge>
                                        </div>
                                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                                            <span>Event: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{r.event_title || '—'}</span></span>
                                            <span>•</span>
                                            <span>{r.reviewer_email}</span>
                                        </div>
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                            {r.comment || '(no comment)'}
                                        </p>
                                    </div>
                                    <div className="flex sm:flex-col gap-2 shrink-0">
                                        <AdminButton
                                            variant="outline"
                                            onClick={() => handleUnflag(r.id)}
                                            disabled={actionId === r.id}
                                            isLoading={actionId === r.id}
                                        >
                                            Unflag
                                        </AdminButton>
                                        <AdminButton
                                            variant="danger"
                                            onClick={() => handleDelete(r.id)}
                                            disabled={actionId === r.id}
                                        >
                                            <Trash2 size={16} className="mr-1.5" /> Delete
                                        </AdminButton>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AdminCard>
        </div>
    );
}
