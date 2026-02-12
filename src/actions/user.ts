'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { UnauthorizedError } from '@/lib/errors/app-error';
import { trackActivity } from '@/lib/track-activity';

/**
 * Toggle favorite event
 */
export async function toggleFavoriteEvent(eventId: string, isFavorite: boolean) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        const factory = new ServiceFactory(supabase);
        const userService = factory.getUserService();

        await userService.toggleFavorite(user.id, eventId);

        revalidatePath('/dashboard/user/favorites');
        revalidatePath(`/events/${eventId}`);
        logger.info('Favorite toggled', { userId: user.id, eventId, isFavorite: !isFavorite });

        trackActivity({
            userId: user.id,
            action: isFavorite ? 'event_unfavorited' : 'event_favorited',
            targetType: 'event',
            targetId: eventId,
        });

        return { success: true };
    } catch (error) {
        logger.error('Failed to toggle favorite', { error, eventId });
        return { error: error instanceof Error ? error.message : 'Failed to toggle favorite' };
    }
}

/**
 * Get user favorites
 */
export async function getUserFavorites() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const userService = factory.getUserService();

        const favorites = await userService.getFavorites(user.id);
        logger.info('User favorites fetched', { userId: user.id, count: favorites.length });

        return favorites.map((item: any) => item.event);
    } catch (error) {
        logger.error('Failed to get favorites', { error });
        return [];
    }
}

/**
 * Get user bookings
 */
export async function getUserBookings() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const bookingService = factory.getBookingService();

        const bookings = await bookingService.getUserBookings(user.id);
        logger.info('User bookings fetched', { userId: user.id, count: bookings.length });

        return bookings;
    } catch (error) {
        logger.error('Failed to get user bookings', { error });
        return [];
    }
}

/**
 * Get user favorite IDs
 */
export async function getUserFavoriteIds() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Return empty array for unauthenticated users (public pages)
        if (!user) return [];

        const factory = new ServiceFactory(supabase);
        const userService = factory.getUserService();

        const favoriteIds = await userService.getFavoriteIds(user.id);
        logger.info('User favorite IDs fetched', { userId: user.id, count: favoriteIds.length });

        return favoriteIds;
    } catch (error) {
        logger.error('Failed to get favorite IDs', { error });
        return [];
    }
}

/**
 * Check if event is favorite
 */
export async function isEventFavorite(eventId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const factory = new ServiceFactory(supabase);
        const userRepo = (factory as any).userRepo;

        const isFav = await userRepo.isFavorite(user.id, eventId);
        return isFav;
    } catch (error) {
        logger.error('Failed to check favorite status', { error, eventId });
        return false;
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: {
    full_name: string | null;
    age?: number | null;
    gender?: string | null;
    country?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Filter out undefined values
        const updates: any = {};
        if (data.full_name !== undefined) updates.full_name = data.full_name;
        if (data.age !== undefined) updates.age = data.age;
        if (data.gender !== undefined) updates.gender = data.gender;
        if (data.country !== undefined) updates.country = data.country;
        if (data.city !== undefined) updates.city = data.city;
        if (data.district !== undefined) updates.district = data.district;
        if (data.phone !== undefined) updates.phone = data.phone;

        const factory = new ServiceFactory(supabase);
        const userService = factory.getUserService();

        await userService.updateProfile(user.id, updates);

        revalidatePath('/dashboard/user/profile');
        logger.info('User profile updated', { userId: user.id });

        trackActivity({
            userId: user.id,
            action: 'profile_updated',
            targetType: 'profile',
            targetId: user.id,
            details: { fields: Object.keys(updates) },
        });

        return { success: true };
    } catch (error) {
        logger.error('Failed to update profile', { error });
        return { error: error instanceof Error ? error.message : 'Failed to update profile' };
    }
}

/**
 * Submit payment proof for a booking
 * Updates booking status and sends confirmation email
 */
export async function submitPaymentProof(bookingId: string, paymentProofUrl: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Update booking with payment proof
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_proof_url: paymentProofUrl,
                status: 'payment_submitted'
            })
            .eq('id', bookingId)
            .eq('user_id', user.id); // Ensure user owns this booking

        if (updateError) {
            logger.error('Failed to update booking with payment proof', { error: updateError, bookingId });
            return { error: 'Failed to submit payment proof' };
        }

        // Get booking details for email
        const { data: booking } = await supabase
            .from('bookings')
            .select(`
                *,
                events!inner(title, date, vendor_id)
            `)
            .eq('id', bookingId)
            .single();

        if (!booking) {
            return { error: 'Booking not found' };
        }

        // Send confirmation email to customer
        try {
            const factory = new ServiceFactory(supabase);
            const notificationService = factory.getNotificationService();

            // Get user profile for customer name
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const customerName = userProfile?.full_name || 'Customer';
            const customerEmail = user.email || '';

            if (customerEmail) {
                await notificationService.sendBookingConfirmation({
                    customerEmail,
                    customerName,
                    eventTitle: (booking.events as any).title,
                    eventDate: (booking.events as any).date,
                    bookingId: booking.id,
                    totalAmount: booking.total_amount || 0,
                    ticketCount: 1, // You may need to calculate this from booking_items
                    locale: 'ar', // Default to Arabic
                });
            }
        } catch (emailError) {
            // Don't fail the payment submission if email fails
            logger.error('Failed to send payment confirmation email', { emailError, bookingId });
        }

        revalidatePath('/dashboard/user');
        logger.info('Payment proof submitted', { userId: user.id, bookingId });

        trackActivity({
            userId: user.id,
            action: 'payment_submitted',
            targetType: 'booking',
            targetId: bookingId,
        });

        return { success: true };
    } catch (error) {
        logger.error('Failed to submit payment proof', { error, bookingId });
        return { error: error instanceof Error ? error.message : 'Failed to submit payment proof' };
    }
}

/**
 * Delete unpaid booking
 * Only allows deletion of bookings with status 'pending_payment' or 'payment_submitted'
 */
export async function deleteUnpaidBooking(bookingId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        const factory = new ServiceFactory(supabase);
        const bookingService = factory.getBookingService();

        const success = await bookingService.deleteUnpaidBooking(bookingId, user.id);

        if (!success) {
            return { error: 'Failed to delete booking. Make sure it is unpaid.' };
        }

        revalidatePath('/dashboard/user');
        logger.info('Unpaid booking deleted', { userId: user.id, bookingId });

        trackActivity({
            userId: user.id,
            action: 'booking_deleted',
            targetType: 'booking',
            targetId: bookingId,
        });

        return { success: true };
    } catch (error) {
        logger.error('Failed to delete unpaid booking', { error, bookingId });
        return { error: error instanceof Error ? error.message : 'Failed to delete booking' };
    }
}
