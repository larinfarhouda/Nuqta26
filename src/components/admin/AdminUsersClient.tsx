'use client';

import { useState } from 'react';
import { getAdminUserActivity } from '@/actions/admin';
import { Users, Activity, TrendingUp, Eye, BarChart3, Clock } from 'lucide-react';
import {
    colors, cardStyle, cardShell, font, cellStyle,
    tabStyle, badgeStyle, paginationBtn, btnPrimary,
} from './admin-tokens';

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

const ROLE_BADGE: Record<string, 'info' | 'neutral' | 'danger'> = {
    vendor: 'info',
    customer: 'neutral',
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

    const selectStyle: React.CSSProperties = {
        padding: '8px 12px', borderRadius: '8px',
        border: `1px solid ${colors.border}`, background: colors.card,
        color: colors.text.primary, fontSize: '13px',
    };

    return (
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ ...font.pageTitle, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={26} /> User Activity
                </h1>
                <p style={font.pageSubtitle}>
                    Monitor user and vendor engagement across the platform
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: '0', marginBottom: '24px',
                borderBottom: `1px solid ${colors.border}`,
            }}>
                {(['feed', 'engagement', 'users'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={tabStyle(activeTab === tab)}
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
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={selectStyle}>
                            <option value="">All Actions</option>
                            {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={selectStyle}>
                            <option value="">All Roles</option>
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                        </select>
                        <button onClick={applyFilters} style={btnPrimary}>
                            Apply
                        </button>
                    </div>

                    {/* Activity List */}
                    <div style={cardShell}>
                        {loading && (
                            <div style={{ padding: '24px', textAlign: 'center', color: colors.text.faint }}>Loading...</div>
                        )}
                        {!loading && activity?.data?.length === 0 && (
                            <div style={{ padding: '48px', textAlign: 'center', color: colors.text.muted }}>
                                <Activity size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                                <p style={{ margin: 0 }}>No activity logs yet. Activity will appear here once users start interacting with the platform.</p>
                            </div>
                        )}
                        {!loading && activity?.data?.map((log) => (
                            <div
                                key={log.id}
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: `1px solid ${colors.borderLight}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                {/* Action icon */}
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: colors.cardAlt, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0, fontSize: '16px',
                                }}>
                                    {ACTION_LABELS[log.action]?.split(' ')[0] || '📋'}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 600, color: colors.text.primary, fontSize: '14px' }}>
                                            {log.user_name || log.user_email || log.user_id?.substring(0, 8)}
                                        </span>
                                        <span style={badgeStyle(ROLE_BADGE[log.user_role] || 'neutral')}>
                                            {log.user_role}
                                        </span>
                                    </div>
                                    <div style={{ color: colors.text.faint, fontSize: '13px', marginTop: '2px' }}>
                                        {ACTION_LABELS[log.action]?.split(' ').slice(1).join(' ') || log.action}
                                        {log.target_type && log.target_id && (
                                            <span style={{ color: colors.text.muted }}> · {log.target_type} {log.target_id.substring(0, 8)}…</span>
                                        )}
                                    </div>
                                </div>

                                {/* Time */}
                                <div style={{ color: colors.text.muted, fontSize: '12px', flexShrink: 0 }}>
                                    {formatTimeAgo(log.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {activity && activity.totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                            <button
                                onClick={() => loadPage(currentPage - 1)}
                                disabled={currentPage <= 1 || loading}
                                style={paginationBtn(false)}
                            >
                                ← Previous
                            </button>
                            <span style={{ padding: '8px 12px', color: colors.text.faint, fontSize: '13px' }}>
                                Page {currentPage} of {activity.totalPages}
                            </span>
                            <button
                                onClick={() => loadPage(currentPage + 1)}
                                disabled={currentPage >= activity.totalPages || loading}
                                style={paginationBtn(false)}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Daily Active', value: engagement.dau, icon: <Eye size={20} />, color: colors.success.accent },
                            { label: 'Weekly Active', value: engagement.wau, icon: <Users size={20} />, color: colors.info.accent },
                            { label: 'Monthly Active', value: engagement.mau, icon: <TrendingUp size={20} />, color: colors.accent },
                            { label: 'Total Events', value: engagement.totalLogs, icon: <Activity size={20} />, color: colors.warning.accent },
                        ].map(stat => (
                            <div key={stat.label} style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ color: colors.text.muted, fontSize: '13px', fontWeight: 500 }}>{stat.label}</span>
                                    <div style={{ color: stat.color }}>{stat.icon}</div>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.text.primary }}>
                                    {stat.value.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Breakdown */}
                    <div style={cardStyle}>
                        <h3 style={{ ...font.sectionTitle, margin: '0 0 16px' }}>
                            Action Breakdown (Last 30 Days)
                        </h3>
                        {engagement.actionBreakdown.length === 0 ? (
                            <p style={{ color: colors.text.muted, textAlign: 'center', padding: '24px' }}>No data yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {engagement.actionBreakdown.map(({ action, count }) => {
                                    const maxCount = engagement.actionBreakdown[0]?.count || 1;
                                    const pct = Math.round((count / maxCount) * 100);
                                    return (
                                        <div key={action} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ width: '180px', fontSize: '13px', color: colors.text.faint, flexShrink: 0 }}>
                                                {ACTION_LABELS[action] || action}
                                            </span>
                                            <div style={{ flex: 1, height: '8px', background: colors.cardAlt, borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${pct}%`, height: '100%',
                                                    background: `linear-gradient(90deg, ${colors.accentDark}, ${colors.accent})`,
                                                    borderRadius: '4px', transition: 'width 0.3s',
                                                }} />
                                            </div>
                                            <span style={{ color: colors.text.primary, fontSize: '13px', fontWeight: 600, width: '48px', textAlign: 'right' }}>
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
                <div style={cardShell}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
                        <h3 style={{ ...font.sectionTitle, margin: 0 }}>
                            Most Active Users (Last 30 Days)
                        </h3>
                    </div>
                    {activeUsers.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: colors.text.muted }}>
                            <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                            <p style={{ margin: 0 }}>No user activity data yet</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                    <th style={font.tableHeader}>#</th>
                                    <th style={font.tableHeader}>User</th>
                                    <th style={font.tableHeader}>Role</th>
                                    <th style={{ ...font.tableHeader, textAlign: 'right' }}>Actions</th>
                                    <th style={{ ...font.tableHeader, textAlign: 'right' }}>Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeUsers.map((user, idx) => (
                                    <tr key={user.userId} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                                        <td style={{ ...cellStyle, color: colors.text.muted, fontSize: '13px', fontWeight: 600 }}>
                                            {idx + 1}
                                        </td>
                                        <td style={cellStyle}>
                                            <div style={{ fontWeight: 600, color: colors.text.primary, fontSize: '14px' }}>
                                                {user.fullName || 'Unknown'}
                                            </div>
                                            <div style={{ color: colors.text.muted, fontSize: '12px' }}>
                                                {user.email || user.userId.substring(0, 12) + '…'}
                                            </div>
                                        </td>
                                        <td style={cellStyle}>
                                            <span style={badgeStyle(ROLE_BADGE[user.role] || 'neutral')}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ ...cellStyle, textAlign: 'right' }}>
                                            <span style={{ color: colors.accent, fontWeight: 700, fontSize: '16px' }}>
                                                {user.actionCount}
                                            </span>
                                        </td>
                                        <td style={{ ...cellStyle, textAlign: 'right', color: colors.text.muted, fontSize: '12px' }}>
                                            <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
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
