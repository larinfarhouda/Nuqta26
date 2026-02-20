/**
 * Vendor Bookings Server Action Tests
 * Tests for vendor booking management actions
 */

import { getVendorBookings, getVendorCustomers, updateBookingStatus, getPendingBookingsCount } from '@/actions/vendor/bookings';

// Mock all external dependencies
jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/lib/track-activity', () => ({
    trackActivity: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockGetBookingService = jest.fn();
const mockGetNotificationService = jest.fn();

jest.mock('@/services/service-factory', () => ({
    ServiceFactory: jest.fn().mockImplementation(() => ({
        getBookingService: mockGetBookingService,
        getNotificationService: mockGetNotificationService,
    })),
}));

import { createClient } from '@/utils/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Vendor Booking Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateClient.mockResolvedValue({
            auth: { getUser: mockGetUser },
        } as any);
    });

    describe('getVendorBookings', () => {
        it('should return bookings when user is authenticated', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'vendor-user-1' } },
            });
            const mockBookings = [{ id: 'b1' }, { id: 'b2' }];
            mockGetBookingService.mockReturnValue({
                getVendorBookings: jest.fn().mockResolvedValue(mockBookings),
            });

            const result = await getVendorBookings();

            expect(result).toEqual(mockBookings);
        });

        it('should return empty array when user is not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await getVendorBookings();

            expect(result).toEqual([]);
        });

        it('should return empty array on service error', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'vendor-user-1' } },
            });
            mockGetBookingService.mockReturnValue({
                getVendorBookings: jest.fn().mockRejectedValue(new Error('DB error')),
            });

            const result = await getVendorBookings();

            expect(result).toEqual([]);
        });
    });

    describe('getVendorCustomers', () => {
        it('should return customers when authenticated', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'vendor-user-1' } },
            });
            const mockCustomers = [{ user_id: 'u1' }];
            mockGetBookingService.mockReturnValue({
                getVendorCustomers: jest.fn().mockResolvedValue(mockCustomers),
            });

            const result = await getVendorCustomers();

            expect(result).toEqual(mockCustomers);
        });

        it('should return empty array when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await getVendorCustomers();

            expect(result).toEqual([]);
        });
    });

    describe('updateBookingStatus', () => {
        it('should update status and return success', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'vendor-user-1' } },
            });
            const mockUpdateStatus = jest.fn().mockResolvedValue(undefined);
            const mockGetDetails = jest.fn().mockResolvedValue({
                profiles: { email: 'user@example.com', full_name: 'John' },
                events: { title: 'Concert' },
            });
            mockGetBookingService.mockReturnValue({
                updateBookingStatus: mockUpdateStatus,
                getBookingDetails: mockGetDetails,
            });
            mockGetNotificationService.mockReturnValue({
                sendBookingStatusUpdate: jest.fn().mockResolvedValue(undefined),
            });

            const result = await updateBookingStatus('booking-123', 'confirmed');

            expect(result).toEqual({ success: true });
            expect(mockUpdateStatus).toHaveBeenCalledWith('booking-123', 'vendor-user-1', 'confirmed');
        });

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await updateBookingStatus('booking-123', 'confirmed');

            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should return error message on service failure', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'vendor-user-1' } },
            });
            mockGetBookingService.mockReturnValue({
                updateBookingStatus: jest.fn().mockRejectedValue(new Error('Not found')),
            });

            const result = await updateBookingStatus('booking-123', 'confirmed');

            expect(result).toEqual({ error: 'Not found' });
        });
    });

    describe('getPendingBookingsCount', () => {
        it('should return pending count', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'vendor-user-1' } },
            });
            mockGetBookingService.mockReturnValue({
                getPendingCount: jest.fn().mockResolvedValue(5),
            });

            const result = await getPendingBookingsCount();

            expect(result).toBe(5);
        });

        it('should return 0 when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await getPendingBookingsCount();

            expect(result).toBe(0);
        });

        it('should return 0 on error', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'vendor-user-1' } },
            });
            mockGetBookingService.mockReturnValue({
                getPendingCount: jest.fn().mockRejectedValue(new Error('fail')),
            });

            const result = await getPendingBookingsCount();

            expect(result).toBe(0);
        });
    });
});
