'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFavoriteEvent(eventId: string, isFavorite: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
            .from('favorite_events')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', eventId);

        if (error) return { error: error.message };
    } else {
        // Add favorite
        const { error } = await supabase
            .from('favorite_events')
            .insert({ user_id: user.id, event_id: eventId });

        if (error) return { error: error.message };
    }

    revalidatePath('/dashboard/user/favorites');
    revalidatePath(`/events/${eventId}`);
    return { success: true };
}

export async function getUserFavorites() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('favorite_events')
        .select('event:events(*, vendors(business_name, company_logo))')
        .eq('user_id', user.id);

    if (error) return [];

    // Flatten the structure to return just a list of events
    return data.map((item: any) => item.event);
}

export async function getUserBookings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(*, vendors(business_name, company_logo))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return [];

    return data;
}


export async function getUserFavoriteIds() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('favorite_events')
        .select('event_id')
        .eq('user_id', user.id);

    if (error) return [];

    return data.map((item: any) => item.event_id);
}

export async function isEventFavorite(eventId: string) {

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from('favorite_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

    return !!data;
}

export async function updateUserProfile(data: { full_name: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/user/profile');
    return { success: true };
}
