import { BaseRepository } from './base.repository';

/**
 * Analytics Repository
 * Handles all database operations for vendor analytics and reporting
 */
export class AnalyticsRepository extends BaseRepository {
    /**
     * Get vendor booking statistics (revenue, sales count)
     */
    async getVendorBookingStats(vendorId: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select('total_amount, status, created_at')
            .eq('vendor_id', vendorId)
            .eq('status', 'confirmed');

        if (error) this.handleError(error, 'AnalyticsRepository.getVendorBookingStats');

        const bookings = data || [];
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const totalSales = bookings.length;

        // Recent sales (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSales = bookings.filter(b => {
            if (!b.created_at) return false;
            return new Date(b.created_at) >= thirtyDaysAgo;
        }).length;

        return {
            totalRevenue,
            totalSales,
            recentSales,
            bookings
        };
    }

    /**
     * Get event type distribution (which types customers prefer)
     */
    async getEventTypeDistribution(vendorId: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select(`
                user_id,
                events (event_type)
            `)
            .eq('vendor_id', vendorId)
            .eq('status', 'confirmed');

        if (error) this.handleError(error, 'AnalyticsRepository.getEventTypeDistribution');

        const bookings = data || [];
        const typeCount: Record<string, number> = {};

        bookings.forEach((b: any) => {
            const type = b.events?.event_type || 'Unknown';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
    }

    /**
     * Get customer loyalty breakdown
     */
    async getCustomerLoyalty(vendorId: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select('user_id')
            .eq('vendor_id', vendorId)
            .eq('status', 'confirmed');

        if (error) this.handleError(error, 'AnalyticsRepository.getCustomerLoyalty');

        const bookings = data || [];
        const customerCounts: Record<string, number> = {};

        bookings.forEach((b: any) => {
            if (b.user_id) {
                customerCounts[b.user_id] = (customerCounts[b.user_id] || 0) + 1;
            }
        });

        let oneTime = 0;
        let repeat = 0;
        let loyal = 0;

        Object.values(customerCounts).forEach(count => {
            if (count === 1) oneTime++;
            else if (count <= 3) repeat++;
            else loyal++;
        });

        return [
            { name: 'One-time', value: oneTime },
            { name: 'Recurring', value: repeat },
            { name: 'Loyal', value: loyal }
        ];
    }

    /**
     * Get customer demographics (age and gender)
     */
    async getCustomerDemographics(vendorId: string) {
        // First get all customer IDs from bookings
        const { data: bookings, error: bookingsError } = await this.client
            .from('bookings')
            .select('user_id')
            .eq('vendor_id', vendorId)
            .eq('status', 'confirmed');

        if (bookingsError) this.handleError(bookingsError, 'AnalyticsRepository.getCustomerDemographics.bookings');

        const userIds = [...new Set((bookings || []).map((b: any) => b.user_id).filter(Boolean))];

        if (userIds.length === 0) {
            return {
                genderDistribution: [],
                ageDistribution: []
            };
        }

        // Get profile data for these users
        const { data: profiles, error: profilesError } = await this.client
            .from('profiles')
            .select('gender, age')
            .in('id', userIds);

        if (profilesError) this.handleError(profilesError, 'AnalyticsRepository.getCustomerDemographics.profiles');

        const profileData = profiles || [];

        // Gender distribution
        const genderCount: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
        profileData.forEach(p => {
            if (p.gender === 'Male') genderCount.Male++;
            else if (p.gender === 'Female') genderCount.Female++;
            else genderCount.Other++;
        });

        const genderDistribution = Object.entries(genderCount)
            .filter(([_, val]) => val > 0)
            .map(([name, value]) => ({ name, value }));

        // Age distribution
        const ageRanges: Record<string, number> = {
            '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0
        };

        profileData.forEach(p => {
            if (!p.age) return;
            const age = p.age;
            if (age < 18) ageRanges['<18']++;
            else if (age <= 24) ageRanges['18-24']++;
            else if (age <= 34) ageRanges['25-34']++;
            else if (age <= 44) ageRanges['35-44']++;
            else if (age <= 54) ageRanges['45-54']++;
            else ageRanges['55+']++;
        });

        const ageDistribution = Object.entries(ageRanges)
            .map(([name, value]) => ({ name, value }));

        return {
            genderDistribution,
            ageDistribution
        };
    }

    /**
     * Get events count for vendor
     */
    async getEventsCount(vendorId: string): Promise<number> {
        const { count, error } = await this.client
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendorId);

        if (error) this.handleError(error, 'AnalyticsRepository.getEventsCount');
        return count || 0;
    }
}
