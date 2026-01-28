import { AnalyticsRepository } from '@/repositories/analytics.repository';
import { logger } from '@/lib/logger/logger';

/**
 * Analytics Service
 * Handles business logic for vendor analytics and reporting
 */
export class AnalyticsService {
    constructor(
        private analyticsRepo: AnalyticsRepository
    ) { }

    /**
     * Get vendor analytics overview
     */
    async getVendorAnalytics(vendorId: string) {
        logger.info('AnalyticsService: Fetching vendor analytics', { vendorId });

        // Get booking stats and events count in parallel
        const [bookingStats, eventsCount] = await Promise.all([
            this.analyticsRepo.getVendorBookingStats(vendorId),
            this.analyticsRepo.getEventsCount(vendorId)
        ]);

        return {
            revenue: bookingStats.totalRevenue,
            sales: bookingStats.totalSales,
            events: eventsCount,
            recentSales: bookingStats.recentSales
        };
    }

    /**
     * Get customer segmentation data
     */
    async getSegmentationData(vendorId: string) {
        logger.info('AnalyticsService: Fetching segmentation data', { vendorId });

        // Fetch all segmentation data in parallel for better performance
        const [typeDistribution, customerLoyalty, demographics] = await Promise.all([
            this.analyticsRepo.getEventTypeDistribution(vendorId),
            this.analyticsRepo.getCustomerLoyalty(vendorId),
            this.analyticsRepo.getCustomerDemographics(vendorId)
        ]);

        return {
            typeDistribution,
            customerLoyalty,
            genderDistribution: demographics.genderDistribution,
            ageDistribution: demographics.ageDistribution
        };
    }
}
