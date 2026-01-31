'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { UnauthorizedError } from '@/lib/errors/app-error';

/**
 * Get vendor bookings
 */
export async function getVendorBookings() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();


        const factory = new ServiceFactory(supabase);
        const bookingService = factory.getBookingService();

        const bookings = await bookingService.getVendorBookings(user.id);
        logger.info('Vendor bookings fetched', { vendorId: user.id, count: bookings.length });


        return bookings;
    } catch (error) {
        logger.error('Failed to get vendor bookings', { error });

        return [];
    }
}

/**
 * Get vendor customers
 */
export async function getVendorCustomers() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const bookingService = factory.getBookingService();

        const customers = await bookingService.getVendorCustomers(user.id);
        logger.info('Vendor customers fetched', { vendorId: user.id, count: customers.length });

        return customers;
    } catch (error) {
        logger.error('Failed to get vendor customers', { error });
        return [];
    }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled'
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        const factory = new ServiceFactory(supabase);
        const bookingService = factory.getBookingService();
        const notificationService = factory.getNotificationService();

        // Update status
        await bookingService.updateBookingStatus(bookingId, user.id, status);

        // Get booking details for notification
        const bookingDetails = await bookingService.getBookingDetails(bookingId);

        // Send notification
        if (bookingDetails && (bookingDetails as any).profiles) {
            await notificationService.sendBookingStatusUpdate({
                customerEmail: (bookingDetails as any).profiles.email || '',
                customerName: (bookingDetails as any).profiles.full_name || 'Customer',
                eventTitle: (bookingDetails as any).events?.title || 'Event',
                bookingId,
                status,
                locale: 'ar', // Default to Arabic
            });
        }

        revalidatePath('/dashboard/vendor');
        logger.info('Booking status updated', { bookingId, status });

        return { success: true };
    } catch (error) {
        logger.error('Failed to update booking status', { error, bookingId, status });
        return { error: error instanceof Error ? error.message : 'Failed to update booking' };
    }
}

/**
 * Get pending bookings count
 */
export async function getPendingBookingsCount() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return 0;

        const factory = new ServiceFactory(supabase);
        const bookingService = factory.getBookingService();

        const count = await bookingService.getPendingCount(user.id);
        logger.info('Pending bookings count fetched', { vendorId: user.id, count });

        return count;
    } catch (error) {
        logger.error('Failed to get pending bookings count', { error });
        return 0;
    }
}
