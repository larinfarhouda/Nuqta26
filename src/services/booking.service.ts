import { BookingRepository } from '@/repositories/booking.repository';
import { EventRepository } from '@/repositories/event.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { UserRepository } from '@/repositories/user.repository';
import { VendorRepository } from '@/repositories/vendor.repository';
import { NotFoundError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger/logger';

/**
 * Booking Service
 * Handles business logic for booking operations
 */
export class BookingService {
    constructor(
        private bookingRepo: BookingRepository,
        private eventRepo: EventRepository,
        private ticketRepo: TicketRepository,
        private userRepo: UserRepository,
        private vendorRepo: VendorRepository
    ) { }

    /**
     * Get vendor bookings
     */
    async getVendorBookings(vendorId: string) {
        logger.info('BookingService: Fetching vendor bookings', { vendorId });
        return await this.bookingRepo.findByVendorId(vendorId);
    }

    /**
     * Get user bookings
     */
    async getUserBookings(userId: string) {
        logger.info('BookingService: Fetching user bookings', { userId });
        return await this.bookingRepo.findByUserId(userId);
    }

    /**
     * Get booking by ID with details
     */
    async getBookingDetails(bookingId: string) {
        logger.info('BookingService: Fetching booking details', { bookingId });

        const booking = await this.bookingRepo.findByIdWithDetails(bookingId);
        if (!booking) {
            throw new NotFoundError('Booking');
        }

        return booking;
    }

    /**
     * Get vendor customers for analytics
     */
    async getVendorCustomers(vendorId: string) {
        logger.info('BookingService: Fetching vendor customers', { vendorId });

        const bookingsData = await this.bookingRepo.getVendorCustomers(vendorId);

        // Group by user_id and aggregate
        const customerMap = new Map();

        for (const booking of bookingsData) {
            const userId = booking.user_id;
            if (!userId) continue;

            if (!customerMap.has(userId)) {
                customerMap.set(userId, {
                    user_id: userId,
                    total_spent: 0,
                    bookings_count: 0,
                    last_booking: booking.created_at,
                    types_preferred: new Set()
                });
            }

            const customer = customerMap.get(userId);
            customer.total_spent += booking.total_amount || 0;
            customer.bookings_count += 1;

            if (booking.created_at && booking.created_at > customer.last_booking) {
                customer.last_booking = booking.created_at;
            }

            if (booking.events?.event_type) {
                customer.types_preferred.add(booking.events.event_type);
            }
        }

        // Get user profiles
        const userIds = Array.from(customerMap.keys());
        const profiles = await this.userRepo.findByIds(userIds);

        // Combine data
        const customers = profiles.map(profile => {
            const customerData = customerMap.get(profile.id);
            return {
                id: profile.id,
                name: profile.full_name || 'Unknown',
                avatar: profile.avatar_url,
                phone: profile.phone,
                total_spent: customerData.total_spent,
                bookings_count: customerData.bookings_count,
                last_booking: customerData.last_booking,
                types_preferred: Array.from(customerData.types_preferred)
            };
        });

        return customers;
    }

    /**
     * Update booking status (vendor action)
     */
    async updateBookingStatus(
        bookingId: string,
        vendorId: string,
        status: 'confirmed' | 'cancelled'
    ) {
        logger.info('BookingService: Updating booking status', {
            bookingId,
            vendorId,
            status
        });

        const booking = await this.bookingRepo.updateStatus(bookingId, vendorId, status);

        if (!booking) {
            throw new NotFoundError('Booking not found or you do not have permission');
        }

        logger.info('Booking status updated', { bookingId, status });

        // TODO: Send notification email to customer
        // await notificationService.sendBookingStatusUpdate(booking);

        return booking;
    }

    /**
     * Get pending bookings count
     */
    async getPendingCount(vendorId: string): Promise<number> {
        logger.info('BookingService: Getting pending count', { vendorId });
        return await this.bookingRepo.getPendingCount(vendorId);
    }

    /**
     * Get confirmed bookings for analytics
     */
    async getConfirmedBookings(vendorId: string) {
        logger.info('BookingService: Getting confirmed bookings', { vendorId });
        return await this.bookingRepo.getConfirmedBookings(vendorId);
    }

    /**
     * Calculate booking revenue (helper for analytics)
     */
    async calculateRevenue(vendorId: string, startDate?: string, endDate?: string) {
        logger.info('BookingService: Calculating revenue', {
            vendorId,
            startDate,
            endDate
        });

        const bookings = await this.bookingRepo.getConfirmedBookings(vendorId);

        let filteredBookings = bookings;
        if (startDate) {
            filteredBookings = filteredBookings.filter(
                b => b.created_at && b.created_at >= startDate
            );
        }
        if (endDate) {
            filteredBookings = filteredBookings.filter(
                b => b.created_at && b.created_at <= endDate
            );
        }

        const total = filteredBookings.reduce(
            (sum, booking) => sum + (booking.total_amount || 0),
            0
        );

        return {
            total,
            count: filteredBookings.length,
            average: filteredBookings.length > 0 ? total / filteredBookings.length : 0
        };
    }
}
