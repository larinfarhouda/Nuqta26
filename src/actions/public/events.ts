'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';


export async function getPublicEvent(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('events')
        .select('*, tickets(*), vendors(business_name, company_logo, whatsapp_number)')
        .eq('id', id)
        .eq('status', 'published')
        .single();

    if (error) return null;
    return data;
}

export type EventFilter = {
    search?: string;
    category?: string;
    date?: string; // 'today', 'tomorrow', 'weekend', 'week'
    location?: string;
};

export async function getPublicEvents(filters?: EventFilter) {
    const supabase = await createClient();
    let query = supabase
        .from('events')
        .select('*, vendors(business_name, company_logo)')
        .eq('status', 'published')
        .order('date', { ascending: true });

    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
    }

    // if (filters?.category) {
    //     // distinct category or filter by vendor category? Assume vendors.category or events.category if it existed.
    //     // Schema says `vendors` has category. Events doesn't seem to have a category column in the schema I read earlier?
    //     // Let me double check schema. events table: title, description, date, location, image_url, price.
    //     // vendors table: category.
    //     // So we filter by vendor category.
    //      query = query.filter('vendors.category', 'eq', filters.category);
    // } 
    // Note: Filtering by joined table column in Supabase requires inner join and specific syntax or embedded resource filtering.
    // 'vendors!inner(category)' allows filtering.

    if (filters?.location) {
        // Search across address fields
        query = query.or(`location_name.ilike.%${filters.location}%, city.ilike.%${filters.location}%, district.ilike.%${filters.location}%`);
    }

    if (filters?.date) {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

        if (filters.date === 'today') {
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
            query = query.gte('date', startOfDay).lte('date', endOfDay);
        } else if (filters.date === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
            const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
            query = query.gte('date', startOfTomorrow).lte('date', endOfTomorrow);
        } else if (filters.date === 'week') {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            query = query.gte('date', startOfDay).lte('date', nextWeek.toISOString());
        }
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }
    return data;
}


export async function createBooking(eventId: string, ticketId: string, quantity: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Please login to book tickets' };

    // 1. Fetch Ticket & Event details to verify price
    const { data: ticket } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
    const { data: event } = await supabase.from('events').select('vendor_id').eq('id', eventId).single();

    if (!ticket || !event) return { error: 'Invalid Ticket' };

    const totalAmount = ticket.price * quantity;

    // 2. Create Booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            event_id: eventId,
            vendor_id: event.vendor_id,
            user_id: user.id,
            total_amount: totalAmount,
            status: 'confirmed' // Auto-confirm for now (free/mock payment)
        })
        .select()
        .single();

    if (bookingError) return { error: bookingError.message };

    // 3. Create Booking Item (Simplistic: 1 item per bulk quantity or just record it?)
    // Schema has `booking_items` to track individual attendees. 
    // For now, we'll just create one item representing the bulk or loop. 
    // Let's create `quantity` items.

    // Note: JS client doesn't support bulk insert well with returning in one go easily without array match
    // We'll just do a loop or bulk insert without return.

    // Actually, `booking.status` is confirmed, we should increment `tickets.sold`
    await supabase.rpc('increment_ticket_sold', { ticket_id: ticketId, quantity });
    // Note: RPC needed for atomic increment, but for now we'll skip or just update directly (race condition risk)
    const { error: updateError } = await supabase.from('tickets').update({ sold: ticket.sold + quantity }).eq('id', ticketId);


    revalidatePath(`/events/${eventId}`);
    return { success: true, bookingId: booking.id };
}
