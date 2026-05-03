import { BaseRepository } from '../base.repository';
import type {
    PlatformStats,
    SubscriptionRevenue,
    TrendDataPoint,
    CategoryStat,
    EventStatusCounts,
} from '@/types/admin.types';

/**
 * Admin Dashboard Repository
 * Data access for platform-wide statistics and analytics.
 * Uses service role key (bypasses RLS) — must only be used server-side.
 */
export class AdminDashboardRepository extends BaseRepository {

    async getPlatformStats(): Promise<PlatformStats> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
        const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

        const [users, vendors, bookings, events, recentUsers, prevUsers, recentVendors, prevVendors, recentBookings, prevBookings, pendingPayments] = await Promise.all([
            this.client.from('profiles').select('*', { count: 'exact', head: true }),
            this.client.from('vendors').select('*', { count: 'exact', head: true }),
            this.client.from('bookings').select('total_amount').eq('status', 'confirmed'),
            this.client.from('events').select('*', { count: 'exact', head: true }),
            // Recent 30 days counts
            this.client.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoISO),
            this.client.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgoISO).lt('created_at', thirtyDaysAgoISO),
            this.client.from('vendors').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoISO),
            this.client.from('vendors').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgoISO).lt('created_at', thirtyDaysAgoISO),
            this.client.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoISO).eq('status', 'confirmed'),
            this.client.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgoISO).lt('created_at', thirtyDaysAgoISO).eq('status', 'confirmed'),
            this.client.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['pending_payment', 'payment_submitted']),
        ]);

        const totalBookingValue = (bookings.data || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const calcGrowth = (recent: number, prev: number) =>
            prev === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prev) / prev) * 100);

        return {
            totalUsers: users.count || 0,
            totalVendors: vendors.count || 0,
            totalBookings: (bookings.data || []).length,
            totalEvents: events.count || 0,
            totalBookingValue,
            pendingPayments: pendingPayments.count || 0,
            userGrowth: calcGrowth(recentUsers.count || 0, prevUsers.count || 0),
            vendorGrowth: calcGrowth(recentVendors.count || 0, prevVendors.count || 0),
            bookingGrowth: calcGrowth(recentBookings.count || 0, prevBookings.count || 0),
        };
    }

    async getSubscriptionRevenue(): Promise<SubscriptionRevenue> {
        const { data, error } = await this.client
            .from('vendors')
            .select('subscription_tier');

        if (error) this.handleError(error, 'AdminDashboardRepository.getSubscriptionRevenue');

        const vendors = data || [];
        return {
            starterCount: vendors.filter(v => v.subscription_tier === 'starter').length,
            growthCount: vendors.filter(v => v.subscription_tier === 'growth').length,
            professionalCount: vendors.filter(v => v.subscription_tier === 'professional').length,
            totalVendors: vendors.length,
        };
    }

    async get30DayTrend(): Promise<TrendDataPoint[]> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await this.client
            .from('bookings')
            .select('created_at, total_amount, status')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .eq('status', 'confirmed');

        if (error) this.handleError(error, 'AdminDashboardRepository.get30DayTrend');

        // Group by day
        const dayMap: Record<string, { bookings: number; revenue: number }> = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const key = d.toISOString().split('T')[0];
            dayMap[key] = { bookings: 0, revenue: 0 };
        }

        (data || []).forEach(b => {
            const key = b.created_at?.split('T')[0];
            if (key && dayMap[key]) {
                dayMap[key].bookings++;
                dayMap[key].revenue += b.total_amount || 0;
            }
        });

        return Object.entries(dayMap).map(([date, vals]) => ({
            date,
            ...vals,
        }));
    }

    async getTopCategories(limit = 5): Promise<CategoryStat[]> {
        const { data, error } = await this.client
            .from('events')
            .select('event_type')
            .eq('status', 'published');

        if (error) this.handleError(error, 'AdminDashboardRepository.getTopCategories');

        const counts: Record<string, number> = {};
        (data || []).forEach(e => {
            const type = e.event_type || 'Other';
            counts[type] = (counts[type] || 0) + 1;
        });

        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([name, value]) => ({ name, value }));
    }

    async getEventStatusCounts(): Promise<EventStatusCounts> {
        const [published, draft, cancelled, featured] = await Promise.all([
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('is_featured', true),
        ]);

        return {
            published: published.count || 0,
            draft: draft.count || 0,
            cancelled: cancelled.count || 0,
            featured: featured.count || 0,
        };
    }
}
