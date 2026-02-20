/**
 * AnalyticsService Tests
 * Tests for vendor analytics and reporting business logic
 */

import { AnalyticsService } from '@/services/analytics.service';
import { AnalyticsRepository } from '@/repositories/analytics.repository';

describe('AnalyticsService', () => {
    let analyticsService: AnalyticsService;
    let mockAnalyticsRepo: jest.Mocked<AnalyticsRepository>;

    beforeEach(() => {
        mockAnalyticsRepo = {
            getVendorBookingStats: jest.fn(),
            getEventsCount: jest.fn(),
            getEventTypeDistribution: jest.fn(),
            getCustomerLoyalty: jest.fn(),
            getCustomerDemographics: jest.fn(),
        } as any;

        analyticsService = new AnalyticsService(mockAnalyticsRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getVendorAnalytics', () => {
        it('should aggregate booking stats and event count', async () => {
            mockAnalyticsRepo.getVendorBookingStats.mockResolvedValue({
                totalRevenue: 5000,
                totalSales: 50,
                recentSales: [
                    { date: '2026-01-15', amount: 200 },
                    { date: '2026-01-16', amount: 300 },
                ],
            });
            mockAnalyticsRepo.getEventsCount.mockResolvedValue(10);

            const result = await analyticsService.getVendorAnalytics('vendor-123');

            expect(result.revenue).toBe(5000);
            expect(result.sales).toBe(50);
            expect(result.events).toBe(10);
            expect(result.recentSales).toHaveLength(2);
        });

        it('should return zero values when no data exists', async () => {
            mockAnalyticsRepo.getVendorBookingStats.mockResolvedValue({
                totalRevenue: 0,
                totalSales: 0,
                recentSales: [],
            });
            mockAnalyticsRepo.getEventsCount.mockResolvedValue(0);

            const result = await analyticsService.getVendorAnalytics('vendor-123');

            expect(result.revenue).toBe(0);
            expect(result.sales).toBe(0);
            expect(result.events).toBe(0);
            expect(result.recentSales).toHaveLength(0);
        });

        it('should call both repo methods in parallel', async () => {
            mockAnalyticsRepo.getVendorBookingStats.mockResolvedValue({
                totalRevenue: 0, totalSales: 0, recentSales: [],
            });
            mockAnalyticsRepo.getEventsCount.mockResolvedValue(0);

            await analyticsService.getVendorAnalytics('vendor-123');

            expect(mockAnalyticsRepo.getVendorBookingStats).toHaveBeenCalledWith('vendor-123');
            expect(mockAnalyticsRepo.getEventsCount).toHaveBeenCalledWith('vendor-123');
        });
    });

    describe('getSegmentationData', () => {
        it('should aggregate all segmentation data', async () => {
            const typeDist = [{ type: 'concert', count: 5 }];
            const loyalty = [{ segment: 'returning', count: 20 }];
            const demographics = {
                genderDistribution: [{ gender: 'male', count: 30 }],
                ageDistribution: [{ range: '18-24', count: 15 }],
            };

            mockAnalyticsRepo.getEventTypeDistribution.mockResolvedValue(typeDist);
            mockAnalyticsRepo.getCustomerLoyalty.mockResolvedValue(loyalty);
            mockAnalyticsRepo.getCustomerDemographics.mockResolvedValue(demographics);

            const result = await analyticsService.getSegmentationData('vendor-123');

            expect(result.typeDistribution).toEqual(typeDist);
            expect(result.customerLoyalty).toEqual(loyalty);
            expect(result.genderDistribution).toEqual(demographics.genderDistribution);
            expect(result.ageDistribution).toEqual(demographics.ageDistribution);
        });

        it('should handle empty segmentation data', async () => {
            mockAnalyticsRepo.getEventTypeDistribution.mockResolvedValue([]);
            mockAnalyticsRepo.getCustomerLoyalty.mockResolvedValue([]);
            mockAnalyticsRepo.getCustomerDemographics.mockResolvedValue({
                genderDistribution: [],
                ageDistribution: [],
            });

            const result = await analyticsService.getSegmentationData('vendor-123');

            expect(result.typeDistribution).toHaveLength(0);
            expect(result.customerLoyalty).toHaveLength(0);
            expect(result.genderDistribution).toHaveLength(0);
            expect(result.ageDistribution).toHaveLength(0);
        });
    });
});
