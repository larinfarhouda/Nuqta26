/**
 * BookingService Tests
 * Tests for booking management business logic
 */

import { BookingService } from '@/services/booking.service';
import { BookingRepository } from '@/repositories/booking.repository';
import { EventRepository } from '@/repositories/event.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { UserRepository } from '@/repositories/user.repository';
import { VendorRepository } from '@/repositories/vendor.repository';
import { NotFoundError } from '@/lib/errors/app-error';

describe('BookingService', () => {
    let bookingService: BookingService;
    let mockBookingRepo: jest.Mocked<BookingRepository>;
    let mockEventRepo: jest.Mocked<EventRepository>;
    let mockTicketRepo: jest.Mocked<TicketRepository>;
    let mockUserRepo: jest.Mocked<UserRepository>;
    let mockVendorRepo: jest.Mocked<VendorRepository>;

    beforeEach(() => {
        mockBookingRepo = {
            findByVendorId: jest.fn(),
            findByUserId: jest.fn(),
            findByIdWithDetails: jest.fn(),
            getVendorCustomers: jest.fn(),
            updateStatus: jest.fn(),
            getPendingCount: jest.fn(),
            getConfirmedBookings: jest.fn(),
        } as any;

        mockEventRepo = {
            findById: jest.fn(),
        } as any;

        mockTicketRepo = {
            findById: jest.fn(),
        } as any;

        mockUserRepo = {
            findByIds: jest.fn(),
        } as any;

        mockVendorRepo = {} as any;

        bookingService = new BookingService(
            mockBookingRepo,
            mockEventRepo,
            mockTicketRepo,
            mockUserRepo,
            mockVendorRepo
        );
    });

    describe('getVendorBookings', () => {
        it('should return bookings for vendor', async () => {
            const vendorId = 'vendor-123';
            const bookings = [
                {
                    id: 'booking-1',
                    event_id: 'event-1',
                    status: 'pending',
                },
                {
                    id: 'booking-2',
                    event_id: 'event-2',
                    status: 'confirmed',
                },
            ];

            mockBookingRepo.findByVendorId.mockResolvedValue(bookings as any);

            const result = await bookingService.getVendorBookings(vendorId);

            expect(result).toHaveLength(2);
            expect(mockBookingRepo.findByVendorId).toHaveBeenCalledWith(vendorId);
        });

        it('should return empty array when vendor has no bookings', async () => {
            mockBookingRepo.findByVendorId.mockResolvedValue([]);

            const result = await bookingService.getVendorBookings('vendor-123');

            expect(result).toHaveLength(0);
        });
    });

    describe('getUserBookings', () => {
        it('should return bookings for user', async () => {
            const userId = 'user-123';
            const bookings = [
                {
                    id: 'booking-1',
                    user_id: userId,
                    status: 'confirmed',
                },
            ];

            mockBookingRepo.findByUserId.mockResolvedValue(bookings as any);

            const result = await bookingService.getUserBookings(userId);

            expect(result).toHaveLength(1);
            expect(mockBookingRepo.findByUserId).toHaveBeenCalledWith(userId);
        });

        it('should return empty array when user has no bookings', async () => {
            mockBookingRepo.findByUserId.mockResolvedValue([]);

            const result = await bookingService.getUserBookings('user-123');

            expect(result).toHaveLength(0);
        });
    });

    describe('getBookingDetails', () => {
        it('should return booking details when found', async () => {
            const booking = {
                id: 'booking-123',
                event_id: 'event-123',
                total_amount: 100,
            };

            mockBookingRepo.findByIdWithDetails.mockResolvedValue(booking as any);

            const result = await bookingService.getBookingDetails('booking-123');

            expect(result).toEqual(booking);
            expect(mockBookingRepo.findByIdWithDetails).toHaveBeenCalledWith('booking-123');
        });

        it('should throw error when booking not found', async () => {
            mockBookingRepo.findByIdWithDetails.mockResolvedValue(null);

            await expect(
                bookingService.getBookingDetails('non-existent')
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateBookingStatus', () => {
        it('should update booking status to confirmed', async () => {
            const bookingId = 'booking-123';
            const vendorId = 'vendor-123';
            const updatedBooking = {
                id: bookingId,
                status: 'confirmed',
            };

            mockBookingRepo.updateStatus.mockResolvedValue(updatedBooking as any);

            const result = await bookingService.updateBookingStatus(
                bookingId,
                vendorId,
                'confirmed'
            );

            expect(result.status).toBe('confirmed');
            expect(mockBookingRepo.updateStatus).toHaveBeenCalledWith(
                bookingId,
                vendorId,
                'confirmed'
            );
        });

        it('should update booking status to cancelled', async () => {
            const bookingId = 'booking-123';
            const vendorId = 'vendor-123';
            const updatedBooking = {
                id: bookingId,
                status: 'cancelled',
            };

            mockBookingRepo.updateStatus.mockResolvedValue(updatedBooking as any);

            const result = await bookingService.updateBookingStatus(
                bookingId,
                vendorId,
                'cancelled'
            );

            expect(result.status).toBe('cancelled');
        });

        it('should throw error when booking not found', async () => {
            mockBookingRepo.updateStatus.mockResolvedValue(null);

            await expect(
                bookingService.updateBookingStatus('booking-123', 'vendor-123', 'confirmed')
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('getPendingCount', () => {
        it('should return pending bookings count', async () => {
            mockBookingRepo.getPendingCount.mockResolvedValue(5);

            const result = await bookingService.getPendingCount('vendor-123');

            expect(result).toBe(5);
        });

        it('should return 0 when no pending bookings', async () => {
            mockBookingRepo.getPendingCount.mockResolvedValue(0);

            const result = await bookingService.getPendingCount('vendor-123');

            expect(result).toBe(0);
        });
    });

    describe('getConfirmedBookings', () => {
        it('should return confirmed bookings', async () => {
            const bookings = [
                { id: 'booking-1', status: 'confirmed' },
                { id: 'booking-2', status: 'confirmed' },
            ];

            mockBookingRepo.getConfirmedBookings.mockResolvedValue(bookings as any);

            const result = await bookingService.getConfirmedBookings('vendor-123');

            expect(result).toHaveLength(2);
        });
    });

    describe('calculateRevenue', () => {
        it('should calculate total revenue from confirmed bookings', async () => {
            const bookings = [
                { id: 'booking-1', total_amount: 100, created_at: '2026-01-01' },
                { id: 'booking-2', total_amount: 150, created_at: '2026-01-02' },
                { id: 'booking-3', total_amount: 200, created_at: '2026-01-03' },
            ];

            mockBookingRepo.getConfirmedBookings.mockResolvedValue(bookings as any);

            const result = await bookingService.calculateRevenue('vendor-123');

            expect(result.total).toBe(450);
            expect(result.count).toBe(3);
            expect(result.average).toBe(150);
        });

        it('should filter by date range', async () => {
            const bookings = [
                { id: 'booking-1', total_amount: 100, created_at: '2026-01-05' },
                { id: 'booking-2', total_amount: 150, created_at: '2026-01-15' },
                { id: 'booking-3', total_amount: 200, created_at: '2026-01-25' },
            ];

            mockBookingRepo.getConfirmedBookings.mockResolvedValue(bookings as any);

            const result = await bookingService.calculateRevenue(
                'vendor-123',
                '2026-01-10',
                '2026-01-20'
            );

            expect(result.total).toBe(150);
            expect(result.count).toBe(1);
        });

        it('should return zero for no bookings', async () => {
            mockBookingRepo.getConfirmedBookings.mockResolvedValue([]);

            const result = await bookingService.calculateRevenue('vendor-123');

            expect(result.total).toBe(0);
            expect(result.count).toBe(0);
            expect(result.average).toBe(0);
        });
    });
});
