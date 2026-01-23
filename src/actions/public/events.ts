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
            // Atomically increment usage
            const { data: usageResult, error: usageError } = await (supabase as any).rpc('increment_discount_usage', {
                p_discount_id: validation.discountId
            });

            if (usageError || !(usageResult as any).success) {
                return { error: (usageResult as any)?.error || 'Failed to apply discount code' };
            }

            discountAmount += validation.discountAmount!;
            discountCodeId = validation.discountId;
        }
    }

    totalAmount = Math.max(0, basePrice - discountAmount);

    // 2. Call Transactional RPC
    const { data: bookingResult, error: rpcError } = await (supabase.rpc as any)('place_booking', {
        p_event_id: eventId,
        p_ticket_id: ticketId,
        p_quantity: quantity,
        p_user_id: user.id,
        p_total_amount: totalAmount,
        p_discount_amount: discountAmount,
        p_discount_code_id: discountCodeId
    });

    if (rpcError || !bookingResult?.success) {
        console.error('Booking RPC Error:', rpcError || bookingResult?.error);
        return { error: bookingResult?.error || 'Failed to complete booking' };
    }

    const bookingId = bookingResult.booking_id;

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
                bookingId: bookingId,
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
                bookingId: bookingId
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

    return { success: true, bookingId: bookingId };
}

export async function getAllEventIdsForSitemap() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('events')
        .select('id, slug, updated_at')
        .eq('status', 'published');
    return data || [];
}
