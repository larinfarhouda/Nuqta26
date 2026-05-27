'use client';

import {
    Users,
    Store,
    ShoppingCart,
    Calendar,
    TrendingUp,
    TrendingDown,
    CreditCard,
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
} from 'recharts';
import { AdminCard } from './ui/AdminCard';

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

const COLORS = ['#2CA58D', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

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
        <AdminCard hoverLift noPadding={false}>
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-2">
                        {title}
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
                    <Icon size={24} />
                </div>
            </div>
            {growth !== undefined && (
                <div className="flex items-center gap-1.5 mt-4 text-sm">
                    {isPositive ? (
                        <TrendingUp size={16} className="text-emerald-500" />
                    ) : (
                        <TrendingDown size={16} className="text-red-500" />
                    )}
                    <span className={`font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{growth}%
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">vs last 30 days</span>
                </div>
            )}
        </AdminCard>
    );
}

function SubscriptionCard({ sub }: { sub: SubscriptionRevenue }) {
    const tiers = [
        { name: 'Free', count: sub.starterCount, color: '#9ca3af' }, // text-zinc-400
        { name: 'Pro', count: sub.growthCount, color: '#2CA58D' }, // Teal
        { name: 'Business', count: sub.professionalCount, color: '#f59e0b' },
    ];
    const total = sub.totalVendors || 1;

    return (
        <AdminCard>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
                Subscription Distribution
            </h3>
            <div className="flex flex-col gap-4">
                {tiers.map((tier) => (
                    <div key={tier.name}>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{tier.name}</span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{tier.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${(tier.count / total) * 100}%`,
                                    backgroundColor: tier.color,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </AdminCard>
    );
}

function EventStatusCard({ eventStatus }: { eventStatus: EventStatusCounts }) {
    const items = [
        { label: 'Published', value: eventStatus.published, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
        { label: 'Draft', value: eventStatus.draft, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10 border-amber-500/20' },
        { label: 'Cancelled', value: eventStatus.cancelled, colorClass: 'text-red-500', bgClass: 'bg-red-500/10 border-red-500/20' },
        { label: 'Featured', value: eventStatus.featured, colorClass: 'text-[#2CA58D]', bgClass: 'bg-[#2CA58D]/10 border-[#2CA58D]/20' },
    ];

    return (
        <AdminCard>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
                Event Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={`p-3 rounded-xl border ${item.bgClass}`}
                    >
                        <div className={`text-2xl font-bold ${item.colorClass}`}>{item.value}</div>
                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{item.label}</div>
                    </div>
                ))}
            </div>
        </AdminCard>
    );
}

export default function AdminDashboardClient({ data }: { data: DashboardData }) {
    const { stats, subscription, trend, categories, eventStatus } = data;

    return (
        <div className="max-w-[1400px] w-full pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Platform overview and key metrics
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                <StatCard title="Total Users" value={stats.totalUsers} growth={stats.userGrowth} icon={Users} color="#2CA58D" />
                <StatCard title="Vendors" value={stats.totalVendors} growth={stats.vendorGrowth} icon={Store} color="#06b6d4" />
                <StatCard title="Bookings" value={stats.totalBookings} growth={stats.bookingGrowth} icon={ShoppingCart} color="#10b981" />
                <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} color="#f59e0b" />
                <StatCard title="Booking Value" value={stats.totalBookingValue} icon={CreditCard} color="#6366f1" />
                <StatCard title="Pending Payments" value={stats.pendingPayments} icon={ArrowUpRight} color="#ef4444" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                {/* 30-day trend */}
                <AdminCard className="lg:col-span-2 flex flex-col">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                        Bookings — Last 30 Days
                    </h3>
                    <div className="flex-1 min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2CA58D" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#2CA58D" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#a1a1aa' }}
                                    tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                    interval="preserveStartEnd"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12, fill: '#a1a1aa' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e4e4e7',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        fontSize: '13px',
                                        fontWeight: 500
                                    }}
                                    labelFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'long', day: 'numeric' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="bookings"
                                    stroke="#2CA58D"
                                    strokeWidth={3}
                                    fill="url(#bookingGradient)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </AdminCard>

                {/* Subscription card */}
                <div className="flex flex-col gap-5">
                    <SubscriptionCard sub={subscription} />
                    <EventStatusCard eventStatus={eventStatus} />
                </div>
            </div>

            {/* Top Categories */}
            <AdminCard>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                    Top Event Categories
                </h3>
                {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 border-dashed">
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No event data yet.</p>
                    </div>
                ) : (
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categories} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 12, fill: '#a1a1aa' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12, fill: '#a1a1aa' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e4e4e7',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        fontSize: '13px',
                                        fontWeight: 500
                                    }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1500}>
                                    {categories.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </AdminCard>
        </div>
    );
}
