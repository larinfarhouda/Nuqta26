'use client';

import { useState, useTransition } from 'react';
import { Activity, User, Calendar, Store, ShoppingCart, Flag, UserPlus, Star, Loader2 } from 'lucide-react';
import { getAdminActivity } from '@/actions/admin';
import type { ActivityLog, PaginatedResult } from '@/types/admin.types';

// UI Components
import { AdminCard } from './ui/AdminCard';
import { AdminButton } from './ui/AdminButton';

const ACTION_MAP: Record<string, { label: string; icon: React.ElementType; colorClass: string; bgClass: string }> = {
    vendor_approved: { label: 'Vendor Approved', icon: Store, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10' },
    vendor_suspended: { label: 'Vendor Suspended', icon: Store, colorClass: 'text-red-500', bgClass: 'bg-red-50 dark:bg-red-500/10' },
    payment_confirmed: { label: 'Payment Confirmed', icon: ShoppingCart, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10' },
    payment_rejected: { label: 'Payment Rejected', icon: ShoppingCart, colorClass: 'text-red-500', bgClass: 'bg-red-50 dark:bg-red-500/10' },
    review_deleted: { label: 'Review Deleted', icon: Flag, colorClass: 'text-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-500/10' },
    prospect_created: { label: 'Prospect Created', icon: UserPlus, colorClass: 'text-purple-500', bgClass: 'bg-purple-50 dark:bg-purple-500/10' },
    prospect_contacted: { label: 'Prospect Contacted', icon: UserPlus, colorClass: 'text-cyan-500', bgClass: 'bg-cyan-50 dark:bg-cyan-500/10' },
    prospect_converted: { label: 'Prospect Converted', icon: UserPlus, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10' },
    event_featured: { label: 'Event Featured', icon: Star, colorClass: 'text-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-500/10' },
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
        <div className="max-w-[1000px] pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-[#2CA58D]/10 text-[#2CA58D] rounded-xl">
                        <Activity size={28} />
                    </div>
                    Activity Log
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                    Real-time audit trail of admin actions
                </p>
            </div>

            <AdminCard noPadding className="overflow-hidden">
                {logs.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <Activity size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No activity logged yet.</p>
                        <p className="text-sm text-zinc-500">Actions will appear here as they occur.</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {logs.map((log) => {
                            const info = ACTION_MAP[log.action] || { label: log.action, icon: Activity, colorClass: 'text-zinc-400', bgClass: 'bg-zinc-100 dark:bg-zinc-800' };
                            const Icon = info.icon;

                            return (
                                <div
                                    key={log.id}
                                    className="p-5 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${info.bgClass} ${info.colorClass} shadow-sm group-hover:scale-105 transition-transform`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1">
                                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                                {info.label}
                                            </span>
                                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">
                                                {formatTime(log.created_at || new Date().toISOString())}
                                            </span>
                                        </div>
                                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                            by <span className="font-bold text-zinc-700 dark:text-zinc-300">{log.user_name || log.user_email || 'System'}</span>
                                            {log.entity_type && (
                                                <span className="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-700 text-zinc-400">
                                                    {log.entity_type}
                                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                        <span className="ml-1 text-zinc-300 dark:text-zinc-600 font-mono text-[10px]">
                                                            {JSON.stringify(log.metadata)}
                                                        </span>
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
            </AdminCard>

            {/* Load More */}
            {data && data.totalPages > page && (
                <div className="flex justify-center mt-8">
                    <AdminButton
                        variant="outline"
                        onClick={() => { const np = page + 1; setPage(np); reload(np); }}
                        disabled={isPending}
                        isLoading={isPending}
                        className="min-w-[120px]"
                    >
                        Load More
                    </AdminButton>
                </div>
            )}
        </div>
    );
}
