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

    const reloadReviews = (p = page) => {
        startTransition(async () => {
            const result = await getAdminFlaggedReviews(p, 20);
            setReviews(result);
        });
    };

    const handleUnflag = async (reviewId: string) => {
        setActionId(reviewId);
        await unflagReview(reviewId);
        setActionId(null);
        reloadReviews();
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Delete this review permanently?')) return;
        setActionId(reviewId);
        await deleteReview(reviewId);
        setActionId(null);
        reloadReviews();
    };

    const searchEvents = async () => {
        if (!eventQuery.trim()) return;
        setFeatureLoading(true);
        const results = await searchEventsForAdmin(eventQuery);
        setEventResults(results);
        setFeatureLoading(false);
    };

    const handleToggleFeature = async (eventId: string, featured: boolean) => {
        setFeatureLoading(true);
        await toggleFeatureEvent(eventId, !featured);
        await searchEvents(); // Refresh
        setFeatureLoading(false);
    };

    const flaggedReviews = reviews?.data || [];

    return (
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Moderation</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                    Review flagged content and feature events
                </p>
            </div>

            {/* Feature Event Tool */}
            <div
                style={{
                    background: '#fff', borderRadius: '16px', padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                    marginBottom: '24px',
                }}
            >
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} style={{ color: '#f59e0b' }} /> Feature Event
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                        placeholder="Search events by title…"
                        value={eventQuery}
                        onChange={(e) => setEventQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchEvents()}
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: '10px',
                            border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                        }}
                    />
                    <button
                        onClick={searchEvents}
                        disabled={featureLoading}
                        style={{
                            padding: '10px 16px', borderRadius: '10px',
                            background: '#8b5cf6', color: '#fff', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '14px',
                        }}
                    >
                        {featureLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        Search
                    </button>
                </div>
                {eventResults.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {eventResults.map(e => (
                            <div
                                key={e.id}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px', borderRadius: '10px', background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{e.title}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{(e.vendors as any)?.business_name}</div>
                                </div>
                                <button
                                    onClick={() => handleToggleFeature(e.id, e.is_featured)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '8px', border: 'none',
                                        background: e.is_featured ? '#fef3c7' : '#f1f5f9',
                                        color: e.is_featured ? '#92400e' : '#475569',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                    }}
                                >
                                    <Star size={12} fill={e.is_featured ? '#f59e0b' : 'none'} />
                                    {e.is_featured ? 'Unfeature' : 'Feature'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Flagged Reviews */}
            <div
                style={{
                    background: '#fff', borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Flag size={18} style={{ color: '#ef4444' }} /> Flagged Reviews
                    </h3>
                </div>
                {flaggedReviews.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No flagged reviews.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {flaggedReviews.map(r => (
                            <div key={r.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{r.reviewer_name || 'Anonymous'}</span>
                                            <span style={{ color: '#f59e0b', fontSize: '13px' }}>{'★'.repeat(r.rating)}</span>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                                                background: '#fecaca', color: '#991b1b', fontWeight: 600,
                                            }}>
                                                {r.flag_count} flag{r.flag_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                                            Event: {r.event_title || '—'} • {r.reviewer_email}
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>{r.comment || '(no comment)'}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button
                                            onClick={() => handleUnflag(r.id)}
                                            disabled={actionId === r.id}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                background: '#dbeafe', color: '#1e40af', fontSize: '12px',
                                                fontWeight: 600, cursor: 'pointer',
                                            }}
                                        >
                                            Unflag
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            disabled={actionId === r.id}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                background: '#fecaca', color: '#991b1b', fontSize: '12px',
                                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                            }}
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
