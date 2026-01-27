'use server';

import { createClient } from '@/utils/supabase/server';
import { ServiceFactory } from '@/services/service-factory';
import { EventFilters } from '@/types/dto/event.dto';
import { logger } from '@/lib/logger/logger';

/**
 * Get public event by ID or slug
 */
export async function getPublicEvent(idOrSlug: string) {
    try {
        const supabase = await createClient();
        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();

        const event = await eventService.getPublicEvent(idOrSlug);

        if (event) {
            logger.info('Public event fetched', { idOrSlug });
        } else {
            logger.warn('Public event not found', { idOrSlug });
        }

        return event;
    } catch (error) {
        logger.error('Failed to get public event', { error, idOrSlug });
        return null;
    }
}

/**
 * Get public events with filters
 */
export async function getPublicEvents(filters?: EventFilters) {
    try {
        const supabase = await createClient();
        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();

        const events = await eventService.searchPublicEvents(filters);
        logger.info('Public events fetched', { filters, count: events.length });

        return events;
    } catch (error) {
        logger.error('Failed to get public events', { error, filters });
        return [];
    }
}

/**
 * Get all event IDs for sitemap
 */
export async function getAllEventIdsForSitemap() {
    try {
        const supabase = await createClient();
        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();

        // Use the event repository method directly for sitemap
        const eventRepo = (eventService as any).eventRepo;
        const events = await eventRepo.getAllForSitemap();

        logger.info('Sitemap events fetched', { count: events.length });
        return events;
    } catch (error) {
        logger.error('Failed to get sitemap events', { error });
        return [];
    }
}

/**
 * Create booking
 * TODO: Refactor to use BookingService once booking creation flow is finalized
 */
export async function createBooking(
    eventId: string,
    ticketId: string,
    quantity: number,
    discountCode?: string
) {
    // This function is complex and involves transaction logic
    // For now, keeping the original implementation
    // Will refactor in a follow-up when BookingService.createBooking is implemented

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to make a booking' };
    }

    try {
        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();
        const discountService = factory.getDiscountService();

        // Get event and ticket
        const event = await eventService.getPublicEvent(eventId);
        if (!event) {
            return { error: 'Event not found' };
        }

        const ticket = event.tickets?.find((t: any) => t.id === ticketId);
        if (!ticket) {
            return { error: 'Ticket not found' };
        }

        // Calculate pricing
        if (!ticket.price) {
            return { error: 'Invalid ticket price' };
        }

        const basePrice = ticket.price * quantity;
        let totalAmount = basePrice;
        let discountAmount = 0;
        let discountCodeId = null;

        // Apply discount code if provided
        if (discountCode) {
            try {
                const discountResult = await discountService.applyDiscount(
                    discountCode,
                    eventId,
                    basePrice
                );
                discountCodeId = discountResult.discountId;
                discountAmount = discountResult.discountAmount;
                totalAmount = discountResult.finalAmount;
            } catch (error) {
                // Discount validation failed - continue without discount
                logger.warn('Discount code validation failed', { discountCode, error });
            }
        }

        // Check for bulk discount if no discount code was applied
        if (!discountCodeId && event.bulk_discounts && event.bulk_discounts.length > 0) {
            const bulkDiscount = await discountService.checkBulkDiscount(
                eventId,
                quantity,
                ticket.price
            );

            if (bulkDiscount) {
                discountAmount = bulkDiscount.discountAmount;
                totalAmount = basePrice - discountAmount;
            }
        }

        // Get vendor ID
        const vendorId = event.vendor_id;
        if (!vendorId) {
            return { error: 'Vendor not found' };
        }

        // Create booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                user_id: user.id,
                event_id: eventId,
                vendor_id: vendorId,
                total_amount: totalAmount,
                discount_amount: discountAmount,
                discount_code_id: discountCodeId,
                status: 'pending_payment'
            })
            .select()
            .single();

        if (bookingError) {
            logger.error('Failed to create booking', { bookingError });
            return { error: bookingError.message };
        }

        // Create booking items (one per ticket)
        const bookingItems = Array.from({ length: quantity }, () => ({
            booking_id: booking.id,
            ticket_id: ticketId,
            price_at_booking: ticket.price
        }));

        const { error: itemError } = await supabase
            .from('booking_items')
            .insert(bookingItems);

        if (itemError) {
            // Rollback booking
            await supabase.from('bookings').delete().eq('id', booking.id);
            logger.error('Failed to create booking items', { itemError });
            return { error: itemError.message };
        }

        // Update ticket sold count
        await supabase.rpc('increment_ticket_sold', {
            ticket_id: ticketId,
            quantity: quantity
        });

        logger.info('Booking created successfully', { bookingId: booking.id });
        return { success: true, booking, bookingId: booking.id };
    } catch (error) {
        logger.error('Failed to create booking', { error, eventId, ticketId, quantity });
        return { error: error instanceof Error ? error.message : 'Failed to create booking' };
    }
}
