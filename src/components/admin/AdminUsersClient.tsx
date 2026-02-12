'use client';

import { useState } from 'react';
import { getAdminUserActivity } from '@/actions/admin';
import { Users, Activity, TrendingUp, Eye, BarChart3, Clock } from 'lucide-react';

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

const ROLE_COLORS: Record<string, string> = {
    vendor: '#8B5CF6',
    customer: '#3B82F6',
    admin: '#EF4444',
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

    return (
        <div style={{ padding: '32px', maxWidth: 1200 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Users size={28} /> User Activity
                </h1>
                <p style={{ color: '#94A3B8', marginTop: 4, fontSize: 14 }}>
                    Monitor user and vendor engagement across the platform
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1E293B', borderRadius: 10, padding: 4 }}>
                {(['feed', 'engagement', 'users'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            background: activeTab === tab ? '#7C3AED' : 'transparent',
                            color: activeTab === tab ? '#fff' : '#94A3B8',
                            transition: 'all 0.2s',
                            flex: 1,
                        }}
                    >
                        {tab === 'feed' && <><Activity size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Activity Feed</>}
                        {tab === 'engagement' && <><BarChart3 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Engagement</>}
                        {tab === 'users' && <><TrendingUp size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Most Active</>}
                    </button>
                ))}
            </div>

            {/* Activity Feed Tab */}
            {activeTab === 'feed' && (
                <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            style={{
                                padding: '8px 12px', borderRadius: 8, border: '1px solid #334155',
                                background: '#1E293B', color: '#E2E8F0', fontSize: 13,
                            }}
                        >
                            <option value="">All Actions</option>
                            {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            style={{
                                padding: '8px 12px', borderRadius: 8, border: '1px solid #334155',
                                background: '#1E293B', color: '#E2E8F0', fontSize: 13,
                            }}
                        >
                            <option value="">All Roles</option>
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                        </select>
                        <button
                            onClick={applyFilters}
                            style={{
                                padding: '8px 16px', borderRadius: 8, border: 'none',
                                background: '#7C3AED', color: '#fff', fontSize: 13, cursor: 'pointer',
                            }}
                        >
                            Apply
                        </button>
                    </div>

                    {/* Activity List */}
                    <div style={{ background: '#1E293B', borderRadius: 12, overflow: 'hidden' }}>
                        {loading && (
                            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
                        )}
                        {!loading && activity?.data?.length === 0 && (
                            <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
                                <Activity size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                                <p style={{ margin: 0 }}>No activity logs yet. Activity will appear here once users start interacting with the platform.</p>
                            </div>
                        )}
                        {!loading && activity?.data?.map((log) => (
                            <div
                                key={log.id}
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid #334155',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    transition: 'background 0.15s',
                                }}
                            >
                                {/* Action icon */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#0F172A', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0, fontSize: 16,
                                }}>
                                    {ACTION_LABELS[log.action]?.split(' ')[0] || '📋'}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 600, color: '#E2E8F0', fontSize: 14 }}>
                                            {log.user_name || log.user_email || log.user_id?.substring(0, 8)}
                                        </span>
                                        <span style={{
                                            fontSize: 11, padding: '2px 8px', borderRadius: 9999,
                                            background: `${ROLE_COLORS[log.user_role] || '#64748B'}22`,
                                            color: ROLE_COLORS[log.user_role] || '#64748B',
                                            fontWeight: 500,
                                        }}>
                                            {log.user_role}
                                        </span>
                                    </div>
                                    <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
                                        {ACTION_LABELS[log.action]?.split(' ').slice(1).join(' ') || log.action}
                                        {log.target_type && log.target_id && (
                                            <span style={{ color: '#64748B' }}> · {log.target_type} {log.target_id.substring(0, 8)}…</span>
                                        )}
                                    </div>
                                </div>

                                {/* Time */}
                                <div style={{ color: '#64748B', fontSize: 12, flexShrink: 0 }}>
                                    {formatTimeAgo(log.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {activity && activity.totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                            <button
                                onClick={() => loadPage(currentPage - 1)}
                                disabled={currentPage <= 1 || loading}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, border: '1px solid #334155',
                                    background: '#1E293B', color: currentPage <= 1 ? '#475569' : '#E2E8F0',
                                    cursor: currentPage <= 1 ? 'default' : 'pointer', fontSize: 13,
                                }}
                            >
                                ← Previous
                            </button>
                            <span style={{ padding: '8px 12px', color: '#94A3B8', fontSize: 13 }}>
                                Page {currentPage} of {activity.totalPages}
                            </span>
                            <button
                                onClick={() => loadPage(currentPage + 1)}
                                disabled={currentPage >= activity.totalPages || loading}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, border: '1px solid #334155',
                                    background: '#1E293B', color: currentPage >= activity.totalPages ? '#475569' : '#E2E8F0',
                                    cursor: currentPage >= activity.totalPages ? 'default' : 'pointer', fontSize: 13,
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Engagement Tab */}
            {activeTab === 'engagement' && engagement && (
                <div>
                    {/* Stat Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                        {[
                            { label: 'Daily Active', value: engagement.dau, icon: <Eye size={20} />, color: '#22C55E' },
                            { label: 'Weekly Active', value: engagement.wau, icon: <Users size={20} />, color: '#3B82F6' },
                            { label: 'Monthly Active', value: engagement.mau, icon: <TrendingUp size={20} />, color: '#8B5CF6' },
                            { label: 'Total Events', value: engagement.totalLogs, icon: <Activity size={20} />, color: '#F59E0B' },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                background: '#1E293B', borderRadius: 12, padding: '20px 24px',
                                border: '1px solid #334155',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 500 }}>{stat.label}</span>
                                    <div style={{ color: stat.color }}>{stat.icon}</div>
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
                                    {stat.value.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Breakdown */}
                    <div style={{ background: '#1E293B', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
                        <h3 style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
                            Action Breakdown (Last 30 Days)
                        </h3>
                        {engagement.actionBreakdown.length === 0 ? (
                            <p style={{ color: '#64748B', textAlign: 'center', padding: 24 }}>No data yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {engagement.actionBreakdown.map(({ action, count }) => {
                                    const maxCount = engagement.actionBreakdown[0]?.count || 1;
                                    const pct = Math.round((count / maxCount) * 100);
                                    return (
                                        <div key={action} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ width: 180, fontSize: 13, color: '#94A3B8', flexShrink: 0 }}>
                                                {ACTION_LABELS[action] || action}
                                            </span>
                                            <div style={{ flex: 1, height: 8, background: '#0F172A', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${pct}%`, height: '100%',
                                                    background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                                                    borderRadius: 4, transition: 'width 0.3s',
                                                }} />
                                            </div>
                                            <span style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600, width: 48, textAlign: 'right' }}>
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Most Active Users Tab */}
            {activeTab === 'users' && (
                <div style={{ background: '#1E293B', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
                        <h3 style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 600, margin: 0 }}>
                            Most Active Users (Last 30 Days)
                        </h3>
                    </div>
                    {activeUsers.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
                            <Users size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                            <p style={{ margin: 0 }}>No user activity data yet</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '10px 20px', textAlign: 'left', color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>#</th>
                                    <th style={{ padding: '10px 20px', textAlign: 'left', color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>User</th>
                                    <th style={{ padding: '10px 20px', textAlign: 'left', color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>Role</th>
                                    <th style={{ padding: '10px 20px', textAlign: 'right', color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>Actions</th>
                                    <th style={{ padding: '10px 20px', textAlign: 'right', color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeUsers.map((user, idx) => (
                                    <tr key={user.userId} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '12px 20px', color: '#64748B', fontSize: 13, fontWeight: 600 }}>
                                            {idx + 1}
                                        </td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <div style={{ fontWeight: 600, color: '#E2E8F0', fontSize: 14 }}>
                                                {user.fullName || 'Unknown'}
                                            </div>
                                            <div style={{ color: '#64748B', fontSize: 12 }}>
                                                {user.email || user.userId.substring(0, 12) + '…'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <span style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 9999,
                                                background: `${ROLE_COLORS[user.role] || '#64748B'}22`,
                                                color: ROLE_COLORS[user.role] || '#64748B',
                                                fontWeight: 500,
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                                            <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: 16 }}>
                                                {user.actionCount}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px', textAlign: 'right', color: '#64748B', fontSize: 12 }}>
                                            <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                            {formatTimeAgo(user.lastActive)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
