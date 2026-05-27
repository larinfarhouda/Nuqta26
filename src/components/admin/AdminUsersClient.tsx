'use client';

import { useState } from 'react';
import { getAdminUserActivity } from '@/actions/admin';
import { Users, Activity, TrendingUp, Eye, BarChart3, Clock, Search, Filter } from 'lucide-react';

// UI Components
import { AdminCard } from './ui/AdminCard';
import { AdminBadge } from './ui/AdminBadge';
import { AdminButton } from './ui/AdminButton';

interface ActivityLog {
    id: string;
    user_id: string;
    user_role: string;
    action: string;
    target_type: string | null;
    target_id: string | null;
    details: Record<string, any> | null;
    created_at: string;
    user_name: string | null;
    user_email: string | null;
}

interface EngagementStats {
    dau: number;
    wau: number;
    mau: number;
    totalLogs: number;
    actionBreakdown: { action: string; count: number }[];
}

interface ActiveUser {
    userId: string;
    fullName: string | null;
    email: string | null;
    actionCount: number;
    lastActive: string;
    role: string;
}

interface PaginatedActivity {
    data: ActivityLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface Props {
    initialActivity: PaginatedActivity | null;
    engagement: EngagementStats | null;
    activeUsers: ActiveUser[];
}

const ACTION_LABELS: Record<string, string> = {
    user_login: '🔑 Login',
    user_logout: '🚪 Logout',
    event_favorited: '❤️ Favorited Event',
    event_unfavorited: '💔 Unfavorited Event',
    profile_updated: '✏️ Profile Updated',
    payment_submitted: '💳 Payment Submitted',
    booking_deleted: '🗑️ Booking Deleted',
    event_created: '🎉 Event Created',
    event_updated: '📝 Event Updated',
    event_deleted: '🗑️ Event Deleted',
    booking_confirmed: '✅ Booking Confirmed',
    booking_cancelled: '❌ Booking Cancelled',
    booking_created: '🎫 Booking Created',
    review_submitted: '⭐ Review Submitted',
    review_flagged: '🚩 Review Flagged',
    interest_expressed: '🙋 Interest Expressed',
    event_viewed: '👁️ Event Viewed',
    vendor_viewed: '🏪 Vendor Viewed',
};

const ROLE_BADGE: Record<string, 'info' | 'default' | 'danger'> = {
    vendor: 'info',
    customer: 'default',
    admin: 'danger',
};

function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
}

export default function AdminUsersClient({ initialActivity, engagement, activeUsers }: Props) {
    const [activity, setActivity] = useState<PaginatedActivity | null>(initialActivity);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'feed' | 'engagement' | 'users'>('feed');
    const [filterAction, setFilterAction] = useState<string>('');
    const [filterRole, setFilterRole] = useState<string>('');

    const loadPage = async (page: number) => {
        setLoading(true);
        try {
            const filters: any = {};
            if (filterAction) filters.action = filterAction;
            if (filterRole) filters.userRole = filterRole;
            const result = await getAdminUserActivity(page, 20, Object.keys(filters).length > 0 ? filters : undefined);
            if (result) {
                setActivity(result as unknown as PaginatedActivity);
                setCurrentPage(page);
            }
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        loadPage(1);
    };

    const tabs = [
        { id: 'feed', label: 'Activity Feed', icon: Activity },
        { id: 'engagement', label: 'Engagement', icon: BarChart3 },
        { id: 'users', label: 'Most Active', icon: TrendingUp },
    ] as const;

    return (
        <div className="max-w-[1400px] pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-[#2CA58D]/10 text-[#2CA58D] rounded-xl">
                        <Users size={28} />
                    </div>
                    User Activity
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                    Monitor user and vendor engagement across the platform
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
                {tabs.map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} 
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                                active ? 'border-[#2CA58D] text-[#2CA58D]' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        >
                            <Icon size={18} />{t.label}
                        </button>
                    );
                })}
            </div>

            {/* Activity Feed Tab */}
            {activeTab === 'feed' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mr-2">
                            <Filter size={18} /> <span className="font-bold text-sm uppercase tracking-wider">Filters</span>
                        </div>
                        <select 
                            value={filterAction} 
                            onChange={(e) => setFilterAction(e.target.value)} 
                            className="h-10 px-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-700 dark:text-zinc-300 outline-none focus:border-[#2CA58D] flex-1 sm:max-w-xs"
                        >
                            <option value="">All Actions</option>
                            {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select 
                            value={filterRole} 
                            onChange={(e) => setFilterRole(e.target.value)} 
                            className="h-10 px-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-700 dark:text-zinc-300 outline-none focus:border-[#2CA58D] sm:w-40"
                        >
                            <option value="">All Roles</option>
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                        </select>
                        <AdminButton onClick={applyFilters}>
                            Apply
                        </AdminButton>
                    </div>

                    {/* Activity List */}
                    <AdminCard noPadding className="overflow-hidden">
                        {loading && (
                            <div className="p-12 text-center text-zinc-500">Loading activity...</div>
                        )}
                        {!loading && activity?.data?.length === 0 && (
                            <div className="p-16 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center">
                                <Activity size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No activity logs yet.</p>
                                <p className="text-sm">Activity will appear here once users interact with the platform.</p>
                            </div>
                        )}
                        {!loading && activity?.data?.map((log) => (
                            <div
                                key={log.id}
                                className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                                {/* Action icon */}
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-xl shadow-sm">
                                    {ACTION_LABELS[log.action]?.split(' ')[0] || '📋'}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                            {log.user_name || log.user_email || log.user_id?.substring(0, 8)}
                                        </span>
                                        <AdminBadge variant={ROLE_BADGE[log.user_role] || 'default'}>
                                            {log.user_role}
                                        </AdminBadge>
                                    </div>
                                    <div className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                        {ACTION_LABELS[log.action]?.split(' ').slice(1).join(' ') || log.action}
                                        {log.target_type && log.target_id && (
                                            <span className="text-zinc-400 dark:text-zinc-600"> · {log.target_type} {log.target_id.substring(0, 8)}…</span>
                                        )}
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="text-zinc-400 dark:text-zinc-500 text-xs font-bold shrink-0">
                                    {formatTimeAgo(log.created_at)}
                                </div>
                            </div>
                        ))}
                    </AdminCard>

                    {/* Pagination */}
                    {activity && activity.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <AdminButton
                                variant="outline"
                                onClick={() => loadPage(currentPage - 1)}
                                disabled={currentPage <= 1 || loading}
                            >
                                ← Previous
                            </AdminButton>
                            <span className="text-sm font-bold text-zinc-500">
                                Page {currentPage} of {activity.totalPages}
                            </span>
                            <AdminButton
                                variant="outline"
                                onClick={() => loadPage(currentPage + 1)}
                                disabled={currentPage >= activity.totalPages || loading}
                            >
                                Next →
                            </AdminButton>
                        </div>
                    )}
                </div>
            )}

            {/* Engagement Tab */}
            {activeTab === 'engagement' && engagement && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {[
                            { label: 'Daily Active', value: engagement.dau, icon: Eye, colorClass: 'text-[#2CA58D]', bgClass: 'bg-[#2CA58D]/10' },
                            { label: 'Weekly Active', value: engagement.wau, icon: Users, colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10' },
                            { label: 'Monthly Active', value: engagement.mau, icon: TrendingUp, colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10' },
                            { label: 'Total Events', value: engagement.totalLogs, icon: Activity, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
                        ].map(stat => {
                            const Icon = stat.icon;
                            return (
                                <AdminCard key={stat.label} hoverLift>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                                        <div className={`p-2 rounded-lg ${stat.bgClass} ${stat.colorClass}`}>
                                            <Icon size={18} />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                                        {stat.value.toLocaleString()}
                                    </div>
                                </AdminCard>
                            )
                        })}
                    </div>

                    {/* Action Breakdown */}
                    <AdminCard>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                            <BarChart3 className="text-[#2CA58D]" size={20} /> Action Breakdown (Last 30 Days)
                        </h3>
                        {engagement.actionBreakdown.length === 0 ? (
                            <p className="text-zinc-400 text-center py-12">No data yet</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {engagement.actionBreakdown.map(({ action, count }) => {
                                    const maxCount = engagement.actionBreakdown[0]?.count || 1;
                                    const pct = Math.round((count / maxCount) * 100);
                                    return (
                                        <div key={action} className="flex items-center gap-4">
                                            <span className="w-48 text-sm font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
                                                {ACTION_LABELS[action] || action}
                                            </span>
                                            <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-[#2CA58D] to-[#1e7866] rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${pct}%` }} 
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 w-12 text-right">
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </AdminCard>
                </div>
            )}

            {/* Most Active Users Tab */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdminCard noPadding>
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <TrendingUp className="text-[#2CA58D]" size={20} /> Most Active Users (Last 30 Days)
                            </h3>
                        </div>
                        {activeUsers.length === 0 ? (
                            <div className="p-16 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center">
                                <Users size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No user activity data yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        {activeUsers.map((user, idx) => (
                                            <tr key={user.userId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-zinc-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                                        {user.fullName || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs font-medium text-zinc-500">
                                                        {user.email || user.userId.substring(0, 12) + '…'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <AdminBadge variant={ROLE_BADGE[user.role] || 'default'}>
                                                        {user.role}
                                                    </AdminBadge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-[#2CA58D] font-extrabold text-base bg-[#2CA58D]/10 px-3 py-1.5 rounded-lg">
                                                        {user.actionCount}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-zinc-500">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Clock size={14} className="text-zinc-400" />
                                                        {formatTimeAgo(user.lastActive)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AdminCard>
                </div>
            )}
        </div>
    );
}
