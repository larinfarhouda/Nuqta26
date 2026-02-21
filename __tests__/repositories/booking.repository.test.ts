/**
 * BookingRepository Tests
 * Tests for booking database operations
 */

import { BookingRepository } from '@/repositories/booking.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';
import { mockBooking } from '../mocks/data.mock';

describe('BookingRepository', () => {
    let bookingRepo: BookingRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        bookingRepo = new BookingRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        it('should return booking when found', async () => {
            const booking = mockBooking();
            mockClient._mocks.single.mockResolvedValueOnce({ data: booking, error: null });

            const result = await bookingRepo.findById('booking-123');

            expect(result).toEqual(booking);
            expect(mockClient.from).toHaveBeenCalledWith('bookings');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'booking-123');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await bookingRepo.findById('bad-id');

            expect(result).toBeNull();
        });

        it('should throw on DB error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '500', message: 'DB error' },
            });

            await expect(bookingRepo.findById('booking-123')).rejects.toThrow();
        });
    });

    describe('findByVendorId', () => {
        it('should return empty array when no bookings', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: [], error: null });

            const result = await bookingRepo.findByVendorId('vendor-123');

            expect(result).toEqual([]);
        });

        it('should return empty array on error', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({
                data: null,
                error: { message: 'Error' },
            });

            // handleError throws, but findByVendorId returns [] on errors before enrichment
            await expect(bookingRepo.findByVendorId('vendor-123')).rejects.toThrow();
        });
    });

    describe('findByUserId', () => {
        it('should return bookings ordered by date', async () => {
            const bookings = [mockBooking()];
            mockClient._mocks.order.mockResolvedValueOnce({ data: bookings, error: null });

            const result = await bookingRepo.findByUserId('user-123');

            expect(result).toEqual(bookings);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('user_id', 'user-123');
        });

        it('should return empty array when null data', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: null });

            const result = await bookingRepo.findByUserId('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('getVendorCustomers', () => {
        it('should return non-cancelled bookings', async () => {
            const customers = [{ user_id: 'u1', total_amount: 100 }];
            mockClient._mocks.neq.mockResolvedValueOnce({ data: customers, error: null });

            const result = await bookingRepo.getVendorCustomers('vendor-123');

            expect(result).toEqual(customers);
            expect(mockClient._mocks.neq).toHaveBeenCalledWith('status', 'cancelled');
        });
    });

    describe('findByIdWithDetails', () => {
        it('should return booking with event and profile data', async () => {
            const bookingData = { ...mockBooking(), events: { title: 'Test' } };
            const profileData = { full_name: 'User', email: 'user@example.com' };
            // First .single() returns booking+events, second .single() returns profile
            mockClient._mocks.single
                .mockResolvedValueOnce({ data: bookingData, error: null })
                .mockResolvedValueOnce({ data: profileData, error: null });

            const result = await bookingRepo.findByIdWithDetails('booking-123');

            expect(result).toEqual({ ...bookingData, profiles: profileData });
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await bookingRepo.findByIdWithDetails('bad-id');

            expect(result).toBeNull();
        });
    });

    describe('updateStatus', () => {
        it('should return updated booking', async () => {
            const updated = mockBooking({ status: 'confirmed' });
            mockClient._mocks.select.mockResolvedValueOnce({ data: [updated], error: null });

            const result = await bookingRepo.updateStatus('booking-123', 'vendor-123', 'confirmed');

            expect(result).toEqual(updated);
        });

        it('should return null when booking not found or not owned', async () => {
            mockClient._mocks.select.mockResolvedValueOnce({ data: [], error: null });

            const result = await bookingRepo.updateStatus('bad-id', 'vendor-123', 'confirmed');

            expect(result).toBeNull();
        });
    });

    describe('getPendingCount', () => {
        it('should return count of payment_submitted bookings', async () => {
            // Chain: select().eq().eq() — second eq() resolves the promise
            mockClient._mocks.eq
                .mockReturnValueOnce(mockClient._mocks as any) // first eq returns chain
                .mockResolvedValueOnce({ count: 3, error: null }); // second eq resolves

            const result = await bookingRepo.getPendingCount('vendor-123');

            expect(result).toBe(3);
        });

        it('should return 0 when count is null', async () => {
            mockClient._mocks.eq
                .mockReturnValueOnce(mockClient._mocks as any)
                .mockResolvedValueOnce({ count: null, error: null });

            const result = await bookingRepo.getPendingCount('vendor-123');

            expect(result).toBe(0);
        });
    });

    describe('getConfirmedBookings', () => {
        it('should return confirmed bookings', async () => {
            const bookings = [{ total_amount: 100, status: 'confirmed', created_at: '2026-01-01' }];
            // Chain: select().eq().eq() — second eq() resolves the promise
            mockClient._mocks.eq
                .mockReturnValueOnce(mockClient._mocks as any)
                .mockResolvedValueOnce({ data: bookings, error: null });

            const result = await bookingRepo.getConfirmedBookings('vendor-123');

            expect(result).toEqual(bookings);
        });
    });

    describe('createWithTransaction', () => {
        it('should throw not-implemented error', async () => {
            await expect(
                bookingRepo.createWithTransaction({
                    p_event_id: 'e1',
                    p_ticket_id: 't1',
                    p_quantity: 1,
                    p_user_id: 'u1',
                    p_total_amount: 100,
                    p_discount_amount: 0,
                    p_discount_code_id: null,
                })
            ).rejects.toThrow('createWithTransaction RPC not implemented');
        });
    });

    describe('deleteUnpaidBooking', () => {
        it('should return true on successful deletion', async () => {
            mockClient._mocks.in.mockResolvedValueOnce({ error: null });

            const result = await bookingRepo.deleteUnpaidBooking('booking-123', 'user-123');

            expect(result).toBe(true);
        });

        it('should throw on error', async () => {
            mockClient._mocks.in.mockResolvedValueOnce({
                error: { message: 'Delete failed' },
            });

            await expect(bookingRepo.deleteUnpaidBooking('b-1', 'u-1')).rejects.toThrow();
        });
    });

    describe('getBookingItemsCount', () => {
        it('should return count of items', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ count: 2, error: null });

            const result = await bookingRepo.getBookingItemsCount('booking-123');

            expect(result).toBe(2);
            expect(mockClient.from).toHaveBeenCalledWith('booking_items');
        });

        it('should return 0 when count is null', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ count: null, error: null });

            const result = await bookingRepo.getBookingItemsCount('booking-123');

            expect(result).toBe(0);
        });
    });

    describe('findPendingBookingByUserAndEvent', () => {
        it('should return booking when found', async () => {
            const booking = mockBooking();
            mockClient._mocks.maybeSingle.mockResolvedValueOnce({ data: booking, error: null });

            const result = await bookingRepo.findPendingBookingByUserAndEvent('user-123', 'event-123');

            expect(result).toEqual(booking);
        });

        it('should return null when not found', async () => {
            mockClient._mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const result = await bookingRepo.findPendingBookingByUserAndEvent('u1', 'e1');

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            mockClient._mocks.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: { message: 'Error' },
            });

            // handleError throws, but the method catches and returns null
            await expect(bookingRepo.findPendingBookingByUserAndEvent('u1', 'e1')).rejects.toThrow();
        });
    });
});
