'use client';

import { useState, useTransition } from 'react';
import { Activity, User, Calendar, Store, ShoppingCart, Flag, UserPlus, Star } from 'lucide-react';
import { getAdminActivity } from '@/actions/admin';
import type { ActivityLog, PaginatedResult } from '@/types/admin.types';

const ACTION_MAP: Record<string, { label: string; icon: any; color: string }> = {
    vendor_approved: { label: 'Vendor Approved', icon: Store, color: '#10b981' },
    vendor_suspended: { label: 'Vendor Suspended', icon: Store, color: '#ef4444' },
    payment_confirmed: { label: 'Payment Confirmed', icon: ShoppingCart, color: '#10b981' },
    payment_rejected: { label: 'Payment Rejected', icon: ShoppingCart, color: '#ef4444' },
    review_deleted: { label: 'Review Deleted', icon: Flag, color: '#f59e0b' },
    prospect_created: { label: 'Prospect Created', icon: UserPlus, color: '#8b5cf6' },
    prospect_contacted: { label: 'Prospect Contacted', icon: UserPlus, color: '#06b6d4' },
    prospect_converted: { label: 'Prospect Converted', icon: UserPlus, color: '#10b981' },
    event_featured: { label: 'Event Featured', icon: Star, color: '#f59e0b' },
};

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminActivityClient({
    initialData,
}: {
    initialData: PaginatedResult<ActivityLog> | null;
}) {
    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();

    const reload = (p: number) => {
        startTransition(async () => {
            const result = await getAdminActivity(p, 50);
            setData(result);
        });
    };

    const logs = data?.data || [];

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Activity Log</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                    Real-time audit trail of admin actions
                </p>
            </div>

            <div
                style={{
                    background: '#fff', borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                }}
            >
                {logs.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <Activity size={40} style={{ color: '#e2e8f0', margin: '0 auto 12px' }} />
                        <div style={{ color: '#94a3b8', fontSize: '14px' }}>No activity logged yet.</div>
                    </div>
                ) : (
                    <div style={{ padding: '8px 0' }}>
                        {logs.map((log, i) => {
                            const info = ACTION_MAP[log.action] || { label: log.action, icon: Activity, color: '#94a3b8' };
                            const Icon = info.icon;

                            return (
                                <div
                                    key={log.id}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                                        padding: '14px 24px',
                                        borderBottom: i < logs.length - 1 ? '1px solid #f8fafc' : 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: `${info.color}12`, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}
                                    >
                                        <Icon size={16} style={{ color: info.color }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                                                {info.label}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                {formatTime(log.created_at || new Date().toISOString())}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                            by {log.user_name || log.user_email || 'System'}
                                            {log.entity_type && (
                                                <span style={{ color: '#94a3b8' }}>
                                                    {' '} • {log.entity_type}
                                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                        <span> • {JSON.stringify(log.metadata)}</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Load More */}
            {data && data.totalPages > page && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button
                        onClick={() => { const np = page + 1; setPage(np); reload(np); }}
                        disabled={isPending}
                        style={{
                            padding: '10px 24px', borderRadius: '10px',
                            background: '#f1f5f9', border: '1px solid #e2e8f0',
                            color: '#475569', fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {isPending ? 'Loading…' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
}
