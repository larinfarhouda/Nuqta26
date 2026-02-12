'use client';

import {
    Users,
    Store,
    ShoppingCart,
    Calendar,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Star,
    ArrowUpRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
} from 'recharts';

import type {
    PlatformStats,
    SubscriptionRevenue,
    TrendDataPoint,
    CategoryStat,
    EventStatusCounts,
} from '@/types/admin.types';

interface DashboardData {
    stats: PlatformStats;
    subscription: SubscriptionRevenue;
    trend: TrendDataPoint[];
    categories: CategoryStat[];
    eventStatus: EventStatusCounts;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

function StatCard({
    title,
    value,
    growth,
    icon: Icon,
    color,
    prefix,
}: {
    title: string;
    value: number;
    growth?: number;
    icon: any;
    color: string;
    prefix?: string;
}) {
    const isPositive = (growth ?? 0) >= 0;
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                        {title}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                </div>
                <div
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon size={22} style={{ color }} />
                </div>
            </div>
            {growth !== undefined && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '12px',
                        fontSize: '13px',
                    }}
                >
                    {isPositive ? (
                        <TrendingUp size={14} style={{ color: '#10b981' }} />
                    ) : (
                        <TrendingDown size={14} style={{ color: '#ef4444' }} />
                    )}
                    <span style={{ color: isPositive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {isPositive ? '+' : ''}{growth}%
                    </span>
                    <span style={{ color: '#94a3b8' }}>vs last 30 days</span>
                </div>
            )}
        </div>
    );
}

function SubscriptionCard({ sub }: { sub: SubscriptionRevenue }) {
    const tiers = [
        { name: 'Starter', count: sub.starterCount, color: '#94a3b8' },
        { name: 'Growth', count: sub.growthCount, color: '#8b5cf6' },
        { name: 'Professional', count: sub.professionalCount, color: '#f59e0b' },
    ];
    const total = sub.totalVendors || 1;

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
            }}
        >
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                Subscription Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tiers.map((tier) => (
                    <div key={tier.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#475569' }}>{tier.name}</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{tier.count}</span>
                        </div>
                        <div
                            style={{
                                height: '6px',
                                borderRadius: '3px',
                                background: '#f1f5f9',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${(tier.count / total) * 100}%`,
                                    background: tier.color,
                                    borderRadius: '3px',
                                    transition: 'width 0.3s',
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EventStatusCard({ eventStatus }: { eventStatus: EventStatusCounts }) {
    const items = [
        { label: 'Published', value: eventStatus.published, color: '#10b981' },
        { label: 'Draft', value: eventStatus.draft, color: '#f59e0b' },
        { label: 'Cancelled', value: eventStatus.cancelled, color: '#ef4444' },
        { label: 'Featured', value: eventStatus.featured, color: '#8b5cf6' },
    ];

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
            }}
        >
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                Event Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {items.map((item) => (
                    <div
                        key={item.label}
                        style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: `${item.color}08`,
                            border: `1px solid ${item.color}20`,
                        }}
                    >
                        <div style={{ fontSize: '22px', fontWeight: 700, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminDashboardClient({ data }: { data: DashboardData }) {
    const { stats, subscription, trend, categories, eventStatus } = data;

    return (
        <div style={{ maxWidth: '1400px' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                    Platform overview and key metrics
                </p>
            </div>

            {/* Stat Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                }}
            >
                <StatCard title="Total Users" value={stats.totalUsers} growth={stats.userGrowth} icon={Users} color="#8b5cf6" />
                <StatCard title="Vendors" value={stats.totalVendors} growth={stats.vendorGrowth} icon={Store} color="#06b6d4" />
                <StatCard title="Bookings" value={stats.totalBookings} growth={stats.bookingGrowth} icon={ShoppingCart} color="#10b981" />
                <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} color="#f59e0b" />
                <StatCard title="Booking Value" value={stats.totalBookingValue} icon={CreditCard} color="#6366f1" prefix="₺" />
                <StatCard title="Pending Payments" value={stats.pendingPayments} icon={ArrowUpRight} color="#ef4444" />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* 30-day trend */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        border: '1px solid #e2e8f0',
                    }}
                >
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '20px' }}>
                        Bookings — Last 30 Days
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={trend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    fontSize: '13px',
                                }}
                                labelFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'long', day: 'numeric' })}
                            />
                            <Area
                                type="monotone"
                                dataKey="bookings"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="url(#bookingGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Subscription card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <SubscriptionCard sub={subscription} />
                    <EventStatusCard eventStatus={eventStatus} />
                </div>
            </div>

            {/* Top Categories */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                }}
            >
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '20px' }}>
                    Top Event Categories
                </h3>
                {categories.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>No event data yet.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={categories} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '13px',
                                }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {categories.map((_, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
