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
    minPrice?: number;
    maxPrice?: number;
    lat?: number;
    lng?: number;
    radius?: number; // km
};

export async function getPublicEvents(filters?: EventFilter) {
    const supabase = await createClient();

    let dateStart: string | null = null;
    let dateEnd: string | null = null;

    if (filters?.date) {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

        if (filters.date === 'today') {
            dateStart = startOfDay;
            dateEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        } else if (filters.date === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
            dateEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
        } else if (filters.date === 'week') {
            dateStart = startOfDay;
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            dateEnd = nextWeek.toISOString();
        } else if (filters.date === 'weekend') {
            const friday = new Date(today);
            const day = friday.getDay();
            const diff = 5 - day; // 5 is Friday
            friday.setDate(friday.getDate() + (diff >= 0 ? diff : diff + 7));
            friday.setHours(0, 0, 0, 0);

            const sunday = new Date(friday);
            sunday.setDate(sunday.getDate() + 2);
            sunday.setHours(23, 59, 59, 999);

            dateStart = friday.toISOString();
            dateEnd = sunday.toISOString();
        }
    }

    const { data, error } = await supabase.rpc('get_events_pro', {
        p_search: filters?.search || undefined,
        p_category: filters?.category || undefined,
        p_min_price: filters?.minPrice || undefined,
        p_max_price: filters?.maxPrice || undefined,
        p_lat: filters?.lat || undefined,
        p_long: filters?.lng || undefined,
        p_radius_km: filters?.radius || undefined,
        p_date_start: dateStart || undefined,
        p_date_end: dateEnd || undefined,
        p_limit: 50,
        p_offset: 0
    });

    if (error) {
        console.error('Error fetching events:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        return [];
    }

    return data || [];
}


export async function createBooking(eventId: string, ticketId: string, quantity: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Please login to book tickets' };

    // 1. Fetch Ticket & Event details to verify price
    const { data: ticket } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
    const { data: event } = await supabase.from('events').select('vendor_id').eq('id', eventId).single();

    if (!ticket || !event) return { error: 'Invalid Ticket' };

    const totalAmount = (ticket.price || 0) * quantity;

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
    const { error: updateError } = await supabase.from('tickets').update({ sold: (ticket.sold || 0) + quantity }).eq('id', ticketId);


    revalidatePath(`/events/${eventId}`);
    return { success: true, bookingId: booking.id };
}
