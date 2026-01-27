'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { UnauthorizedError } from '@/lib/errors/app-error';

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

        return { success: true };
    } catch (error) {
        logger.error('Failed to update profile', { error });
        return { error: error instanceof Error ? error.message : 'Failed to update profile' };
    }
}
