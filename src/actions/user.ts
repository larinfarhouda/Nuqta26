'use server';
import { receiptStoragePath } from '@/lib/booking-receipts';

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

        const path = receiptStoragePath(paymentProofUrl, bookingId, process.env.NEXT_PUBLIC_SUPABASE_URL!);
        if (!path) return { error: 'Invalid receipt' };
        const { data: existing } = await supabase.from('bookings').select('id, status')
            .eq('id', bookingId).eq('user_id', user.id).single();
        if (!existing || !['pending_payment', 'payment_submitted'].includes(existing.status || '')) return { error: 'Booking cannot accept a receipt' };
        // Storage RLS checks ownership; also require the uploaded object to exist.
        const { error: fileError } = await supabase.storage.from('booking-receipts').createSignedUrl(path, 60);
        if (fileError) return { error: 'Receipt upload not found' };
        const { data: updated, error: updateError } = await supabase.from('bookings')
            .update({ payment_proof_url: path, status: 'payment_submitted' })
            .eq('id', bookingId).eq('user_id', user.id)
            .in('status', ['pending_payment', 'payment_submitted']).select('id').maybeSingle();
        if (updateError || !updated) return { error: 'Failed to submit payment proof' };
        // A receipt submission is not a confirmed booking. The organizer's
        // confirmation flow sends the confirmation after verifying payment.

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
