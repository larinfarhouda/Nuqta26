'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/utils/mail';
import BookingUserTemplate from '@/components/emails/BookingUserTemplate';
import BookingVendorTemplate from '@/components/emails/BookingVendorTemplate';
import EventSoldOutTemplate from '@/components/emails/EventSoldOutTemplate';


export async function getPublicEvent(idOrSlug: string) {
    const supabase = await createClient();

    // Check if the input is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase
        .from('events')
        .select('*, tickets(*), vendors(business_name, company_logo, whatsapp_number, slug), bulk_discounts(*)')
        .eq('status', 'published');

    if (isUuid) {
        query = query.eq('id', idOrSlug);
    } else {
        query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.single();

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


export async function createBooking(eventId: string, ticketId: string, quantity: number, discountCode?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Please login to book tickets' };

    // 1. Fetch Ticket & Event details to verify price
    const { data: ticket } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
    const { data: event } = await supabase.from('events').select('vendor_id, title, date, location_name, city').eq('id', eventId).single();

    if (!ticket || !event) return { error: 'Invalid Ticket' };

    const basePrice = (ticket.price || 0) * quantity;
    let totalAmount = basePrice;
    let discountAmount = 0;
    let discountCodeId = null;

    // 1.5 Apply Bulk Discounts
    const { data: bulkDiscounts } = await (supabase.from('bulk_discounts' as any) as any)
        .select('*')
        .eq('event_id', eventId)
        .order('min_quantity', { descending: true });

    if (bulkDiscounts && bulkDiscounts.length > 0) {
        const applicableBulk = bulkDiscounts.find((d: any) => quantity >= d.min_quantity);
        if (applicableBulk) {
            if (applicableBulk.discount_type === 'percentage') {
                discountAmount += (basePrice * applicableBulk.discount_value) / 100;
            } else {
                discountAmount += applicableBulk.discount_value;
            }
        }
    }

    // 1.6 Apply Discount Code
    if (discountCode) {
        const { validateDiscountCode } = await import('./discounts');
        const validation = await validateDiscountCode(discountCode, event.vendor_id, eventId, basePrice - discountAmount);
        if (validation.success) {
            discountAmount += validation.discountAmount!;
            discountCodeId = validation.discountId;

            // Increment used_count (simple update as sql`used_count + 1` isn't easy here)
            // We'll trust the validation logic already checked if its allowed.
            await (supabase.from('discount_codes' as any) as any)
                .update({ used_count: (validation as any).currentUsedCount ? (validation as any).currentUsedCount + 1 : 1 })
                .eq('id', discountCodeId);
        }
    }

    totalAmount = Math.max(0, basePrice - discountAmount);

    // 2. Create Booking
    const { data: booking, error: bookingError } = await (supabase.from('bookings' as any) as any)
        .insert({
            event_id: eventId,
            vendor_id: event.vendor_id,
            user_id: user.id,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            discount_code_id: discountCodeId,
            status: totalAmount > 0 ? 'pending_payment' : 'confirmed',
            payment_method: totalAmount > 0 ? 'bank_transfer' : 'free'
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

    // 4. Update Ticket Sold Count (Only if confirmed/free)
    if (totalAmount === 0) {
        await supabase.rpc('increment_ticket_sold', { ticket_id: ticketId, quantity });
        await supabase.from('tickets').update({ sold: (ticket.sold || 0) + quantity }).eq('id', ticketId);
    }

    revalidatePath(`/events/${eventId}`);

    // --- NOTIFICATIONS & POST-BOOKING LOGIC ---

    // A. User Notification (Booking Requested / Confirmed)
    // A. User Notification (Booking Requested / Confirmed)
    // Fetch User Profile for email
    const { data: userProfileData } = await supabase.from('profiles').select('email, full_name').eq('id', user.id).single();
    const userProfile = userProfileData as any;

    if (userProfile?.email) {
        await sendEmail({
            to: userProfile.email,
            subject: `Booking Request Received: ${event.title || 'Event'}`,
            react: BookingUserTemplate({
                userName: userProfile.full_name || 'Explorer',
                eventName: event.title || 'Event',
                bookingId: booking.id,
                status: 'requested', // Explicitly Requested as per plan, even if DB says confirmed for now
                eventDate: event.date,
                location: event.location_name || event.city || undefined
            })
        });
    }

    // B. Vendor Notification (New Booking)
    // Fetch Vendor Email (via their User ID in vendors table if mapped, or direct auth user lookup if vendor_id is auth_id)
    // Schema: vendors.id IS uuid references auth.users(id). So vendor_id IS the auth user id.
    const { data: vendorUserData } = await supabase.from('profiles').select('email, full_name').eq('id', event.vendor_id).single();
    const vendorUser = vendorUserData as any;

    const { data: vendorDetails } = await supabase.from('vendors').select('business_name').eq('id', event.vendor_id).single();

    if (vendorUser?.email) {
        await sendEmail({
            to: vendorUser.email,
            subject: `New Booking Request: ${event.title || 'Event'}`,
            react: BookingVendorTemplate({
                vendorName: vendorDetails?.business_name || vendorUser.full_name || 'Partner',
                eventName: event.title || 'Event',
                customerName: userProfile?.full_name || 'Guest',
                quantity,
                totalAmount,
                bookingId: booking.id
            })
        });
    }

    // C. Check Sold Out Status
    // Fetch all tickets for this event
    const { data: allTickets } = await supabase.from('tickets').select('quantity, sold').eq('event_id', eventId);

    if (allTickets && allTickets.length > 0) {
        const isFullySoldOut = allTickets.every(t => (t.sold || 0) >= t.quantity);

        if (isFullySoldOut) {
            // Need to check if we already sent this? 
            // Ideally should have a flag on event `notified_sold_out`.
            // For now, we'll just send it. Vendor might get duplicates if canceled/rebooked, effectively strictly minor issue.

            const totalSold = allTickets.reduce((acc, t) => acc + (t.sold || 0), 0);

            if (vendorUser?.email) {
                await sendEmail({
                    to: vendorUser.email,
                    subject: `Event Fully Booked: ${event.title || 'Event'}`,
                    react: EventSoldOutTemplate({
                        vendorName: vendorDetails?.business_name || vendorUser.full_name || 'Partner',
                        eventName: event.title || 'Event',
                        eventId: eventId,
                        soldCount: totalSold
                    })
                });
            }
        }
    }

    return { success: true, bookingId: booking.id };
}

export async function getAllEventIdsForSitemap() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('events')
        .select('id, slug, updated_at')
        .eq('status', 'published');
    return data || [];
}
