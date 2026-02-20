/**
 * Vendor Analytics Server Action Tests
 */

import { getVendorAnalytics, getSegmentationData } from '@/actions/vendor/analytics';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockGetAnalyticsService = jest.fn();

jest.mock('@/services/service-factory', () => ({
    ServiceFactory: jest.fn().mockImplementation(() => ({
        getAnalyticsService: mockGetAnalyticsService,
    })),
}));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Vendor Analytics Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateClient.mockResolvedValue({
            auth: { getUser: mockGetUser },
        } as any);
    });

    describe('getVendorAnalytics', () => {
        it('should return analytics for authenticated vendor', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            const analytics = { totalBookings: 10, revenue: 5000 };
            mockGetAnalyticsService.mockReturnValue({
                getVendorAnalytics: jest.fn().mockResolvedValue(analytics),
            });

            const result = await getVendorAnalytics();
            expect(result).toEqual(analytics);
        });

        it('should return null when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getVendorAnalytics();
            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetAnalyticsService.mockReturnValue({
                getVendorAnalytics: jest.fn().mockRejectedValue(new Error('fail')),
            });
            const result = await getVendorAnalytics();
            expect(result).toBeNull();
        });
    });

    describe('getSegmentationData', () => {
        it('should return segmentation data', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            const data = { segments: [] };
            mockGetAnalyticsService.mockReturnValue({
                getSegmentationData: jest.fn().mockResolvedValue(data),
            });

            const result = await getSegmentationData();
            expect(result).toEqual(data);
        });

        it('should return null when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getSegmentationData();
            expect(result).toBeNull();
        });
    });
});
