'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/utils/mail';
import BookingUserTemplate from '@/components/emails/BookingUserTemplate';

export async function getVendorBookings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            events (title, event_type),
            profiles:user_id (full_name, email, avatar_url)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }

    return data;
}

export async function getVendorCustomers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Fetch confirmed bookings to analyze customers
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            user_id,
            total_amount,
            created_at,
            events (event_type),
            profiles:user_id (full_name, email, avatar_url)
        `)
        .eq('vendor_id', user.id)
        .eq('status', 'confirmed');

    if (error) return [];

    // Aggregate data by User
    const customerMap = new Map();

    bookings.forEach((booking: any) => {
        if (!booking.user_id) return; // Skip guest bookings for now if any

        if (!customerMap.has(booking.user_id)) {
            customerMap.set(booking.user_id, {
                id: booking.user_id,
                name: booking.profiles?.full_name || 'Guest',
                email: booking.profiles?.email || 'No Email',
                avatar: booking.profiles?.avatar_url,
                total_spent: 0,
                bookings_count: 0,
                last_booking: booking.created_at,
                types_preferred: new Set()
            });
        }

        const customer = customerMap.get(booking.user_id);
        customer.total_spent += booking.total_amount || 0;
        customer.bookings_count += 1;
        if (new Date(booking.created_at) > new Date(customer.last_booking)) {
            customer.last_booking = booking.created_at;
        }
        if (booking.events?.event_type) {
            customer.types_preferred.add(booking.events.event_type);
        }
    });

    return Array.from(customerMap.values()).map(c => ({
        ...c,
        types_preferred: Array.from(c.types_preferred)
    }));
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .eq('vendor_id', user.id);

    if (error) return { error: error.message };
    if (error) return { error: error.message };

    // --- NOTIFICATIONS ---
    // Fetch Booking Details with Event and User info for email
    const { data: booking } = await supabase
        .from('bookings')
        .select(`
            *,
            events (title, date, location_name, city),
            profiles:user_id (email, full_name)
        `)
        .eq('id', bookingId)
        .single();

    // Cast to any to avoid strict type errors for now
    const bookingData = booking as any;

    if (bookingData && bookingData.profiles?.email) {
        await sendEmail({
            to: bookingData.profiles.email,
            subject: status === 'confirmed'
                ? `Booking Confirmed! Get ready for ${bookingData.events?.title}`
                : `Update on your booking for ${bookingData.events?.title}`,
            react: BookingUserTemplate({
                userName: bookingData.profiles.full_name || 'Explorer',
                eventName: bookingData.events?.title || 'Event',
                bookingId: bookingId,
                status: status,
                eventDate: bookingData.events?.date,
                location: bookingData.events?.location_name || bookingData.events?.city
            })
        });
    }

    revalidatePath('/dashboard/vendor');
    return { success: true };
}
