'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { UnauthorizedError } from '@/lib/errors/app-error';
import { optimizeImageFile } from '@/utils/image-optimizer';
import {
    canCreateEventFromDB,
    getEventLimitFromDB,
    getRequiredUpgradeTierFromDB,
} from '@/lib/constants/subscription-server';
import { type SubscriptionTier, normalizeTier } from '@/lib/constants/subscription';
import { trackActivity } from '@/lib/track-activity';

// --- Helpers ---

function safeParseFloat(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
}

function safeParseInt(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
}

function appendTimezone(dateStr: string | null, _tz: string): string | undefined {
    if (!dateStr) return undefined;
    // datetime-local gives "2026-03-01T19:00" — this IS the intended display time.
    // Tag as UTC so Supabase stores it verbatim (no offset conversion).
    // Display side must also use UTC to avoid browser tz shift.
    return `${dateStr}:00+00:00`;
}

/**
 * Create event (vendor action)
 */
export async function createEvent(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Get vendor profile with subscription info
        const { data: vendor } = await supabase
            .from('vendors')
            .select('id, bank_name, bank_iban, bank_account_name, subscription_tier')
            .eq('id', user.id)
            .single();

        if (!vendor) return { error: 'Vendor profile not found' };

        // Require bank information before creating events
        if (!vendor.bank_name || !vendor.bank_iban) {
            return {
                error: 'INCOMPLETE_PROFILE',
                message: 'Please complete your bank information in your profile before creating events.'
            };
        }

        const tier = normalizeTier(vendor.subscription_tier);

        // Check subscription tier limits
        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();
        const activeEventsCount = await eventService.countActiveEventsByVendor(user.id);

        if (!(await canCreateEventFromDB(tier, activeEventsCount))) {
            const limit = await getEventLimitFromDB(tier);
            const upgradeTier = await getRequiredUpgradeTierFromDB(tier);

            logger.warn('Event creation blocked - tier limit reached', {
                vendorId: user.id,
                tier,
                activeEventsCount,
                limit
            });

            return {
                error: 'TIER_LIMIT_REACHED',
                message: `You've reached your ${tier} plan limit of ${limit} active event${limit > 1 ? 's' : ''}.`,
                currentTier: tier,
                activeEvents: activeEventsCount,
                limit,
                upgradeTier,
            };
        }

        // Parse form data
        const tzOffset = formData.get('timezone_offset') as string || '+00:00';
        const rawData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            event_type: formData.get('event_type') as string,
            category_id: formData.get('category_id') as string || undefined,
            date: appendTimezone(formData.get('date') as string, tzOffset) as string,
            end_date: appendTimezone(formData.get('end_date') as string, tzOffset),
            location_lat: safeParseFloat(formData.get('location_lat') as string),
            location_long: safeParseFloat(formData.get('location_long') as string),
            location_name: formData.get('location_name') as string,
            location_details: formData.get('location_details') as string || undefined,
            district: formData.get('district') as string,
            city: formData.get('city') as string,
            country: formData.get('country') as string,
            capacity: safeParseInt(formData.get('capacity') as string),
            is_recurring: formData.get('is_recurring') === 'true',
            recurrence_type: formData.get('recurrence_type') as string,
            recurrence_days: formData.get('recurrence_days') ? JSON.parse(formData.get('recurrence_days') as string) : [],
            recurrence_end_date: formData.get('recurrence_end_date') as string,
        };

        // Handle image upload
        let image_url = null;

        // Check if image was pre-uploaded via Instagram import
        const existingImageUrl = formData.get('existing_image_url') as string;
        if (existingImageUrl) {
            image_url = existingImageUrl;
        } else {
            const imageFile = formData.get('image') as File;
            if (imageFile && imageFile.size > 0) {
                try {
                    const optimized = await optimizeImageFile(imageFile);
                    const fileName = `${vendor.id}/${Date.now()}.${optimized.extension}`;
                    const { error: uploadError } = await supabase.storage.from('vendor-public').upload(fileName, optimized.buffer, {
                        contentType: optimized.mimeType,
                    });

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage.from('vendor-public').getPublicUrl(fileName);
                        image_url = publicUrl;
                    } else {
                        logger.error('Image upload failed', { uploadError });
                    }
                } catch (err) {
                    logger.error('Image optimization failed', { error: err });
                }
            }
        }

        // Generate unique slug
        const { slugify } = await import('@/utils/slugify');
        let slug = slugify(rawData.title);
        const { data: existingSlug } = await supabase.from('events').select('slug').eq('slug', slug).maybeSingle();
        if (existingSlug) {
            const randomStr = Math.random().toString(36).substring(2, 6);
            slug = `${slug}-${randomStr}`;
        }

        // Use EventService to create (reuse factory from tier check above)

        const event = await eventService.createEvent(vendor.id, {
            ...rawData,
            slug,
            image_url: image_url || undefined
        });

        // Create tickets
        const ticketsJson = formData.get('tickets') as string;
        if (ticketsJson) {
            try {
                const tickets = JSON.parse(ticketsJson);
                if (Array.isArray(tickets) && tickets.length > 0) {
                    const ticketInserts = tickets.map((t: any) => ({
                        event_id: event.id,
                        name: t.name,
                        price: parseFloat(t.price),
                        quantity: parseInt(t.quantity)
                    }));

                    const { error: ticketError } = await supabase.from('tickets').insert(ticketInserts);
                    if (ticketError) logger.error('Error creating tickets', { ticketError });
                }
            } catch (e) {
                logger.error('Error parsing tickets JSON', { error: e });
            }
        }

        // Create bulk discounts using DiscountService
        const bulkDiscountsJson = formData.get('bulk_discounts') as string;
        if (bulkDiscountsJson) {
            try {
                const bulkDiscounts = JSON.parse(bulkDiscountsJson);
                if (Array.isArray(bulkDiscounts) && bulkDiscounts.length > 0) {
                    const discountService = factory.getDiscountService();
                    await discountService.createBulkDiscountsForEvent(event.id, bulkDiscounts);
                    logger.info('Bulk discounts created for event', { eventId: event.id, count: bulkDiscounts.length });
                }
            } catch (e) {
                logger.error('Error creating bulk discounts', { error: e, eventId: event.id });
            }
        }


        revalidatePath('/dashboard/vendor');
        logger.info('Event created successfully', { eventId: event.id });

        trackActivity({
            userId: user.id,
            userRole: 'vendor',
            action: 'event_created',
            targetType: 'event',
            targetId: event.id,
            details: { title: formData.get('title') },
        });

        return { success: true, eventId: event.id, data: event };
    } catch (error) {
        logger.error('Failed to create event', { error });
        return { error: error instanceof Error ? error.message : 'Failed to create event' };
    }
}

/**
 * Update event (vendor action)
 */
export async function updateEvent(eventId: string, formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Parse form data
        const tzOffset = formData.get('timezone_offset') as string || '+00:00';
        const rawData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            event_type: formData.get('event_type') as string,
            category_id: formData.get('category_id') as string || undefined,
            date: appendTimezone(formData.get('date') as string, tzOffset) as string,
            end_date: appendTimezone(formData.get('end_date') as string, tzOffset),
            location_lat: safeParseFloat(formData.get('location_lat') as string),
            location_long: safeParseFloat(formData.get('location_long') as string),
            location_name: formData.get('location_name') as string,
            location_details: formData.get('location_details') as string || undefined,
            district: formData.get('district') as string,
            city: formData.get('city') as string,
            country: formData.get('country') as string,
            capacity: safeParseInt(formData.get('capacity') as string),
            is_recurring: formData.get('is_recurring') === 'true',
            recurrence_type: formData.get('recurrence_type') as string,
            recurrence_days: formData.get('recurrence_days') ? JSON.parse(formData.get('recurrence_days') as string) : [],
            recurrence_end_date: formData.get('recurrence_end_date') as string,
        };

        // Handle image upload
        let image_url = undefined;
        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            try {
                const optimized = await optimizeImageFile(imageFile);
                const fileName = `${user.id}/${Date.now()}.${optimized.extension}`;
                const { error: uploadError } = await supabase.storage.from('vendor-public').upload(fileName, optimized.buffer, {
                    contentType: optimized.mimeType,
                });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('vendor-public').getPublicUrl(fileName);
                    image_url = publicUrl;
                }
            } catch (err) {
                logger.error('Image optimization failed during update', { error: err });
            }
        }

        const updateData: any = { ...rawData };
        if (image_url) updateData.image_url = image_url;

        // Use EventService to update
        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();

        await eventService.updateEvent(eventId, user.id, updateData);

        // Handle tickets (upsert + delete removed)
        const ticketsJson = formData.get('tickets') as string;
        if (ticketsJson) {
            try {
                const tickets = JSON.parse(ticketsJson);
                if (Array.isArray(tickets)) {
                    const existingTickets = tickets.filter((t: any) => t.id);
                    const newTickets = tickets.filter((t: any) => !t.id);

                    // Batch: update existing + insert new in parallel
                    const [updateResults, insertResult] = await Promise.all([
                        // Update all existing tickets concurrently
                        Promise.all(existingTickets.map((t: any) =>
                            supabase.from('tickets').update({
                                name: t.name,
                                price: parseFloat(t.price),
                                quantity: parseInt(t.quantity)
                            }).eq('id', t.id).eq('event_id', eventId)
                        )),
                        // Batch insert all new tickets at once
                        newTickets.length > 0
                            ? supabase.from('tickets').insert(
                                newTickets.map((t: any) => ({
                                    event_id: eventId,
                                    name: t.name,
                                    price: parseFloat(t.price),
                                    quantity: parseInt(t.quantity)
                                }))
                            ).select('id')
                            : Promise.resolve({ data: [] as any[] }),
                    ]);

                    const keptTicketIds = [
                        ...existingTickets.map((t: any) => t.id),
                        ...(insertResult.data || []).map((t: any) => t.id),
                    ];

                    // Delete tickets that were removed from the form
                    if (keptTicketIds.length > 0) {
                        await supabase.from('tickets')
                            .delete()
                            .eq('event_id', eventId)
                            .not('id', 'in', `(${keptTicketIds.join(',')})`);
                    }
                }
            } catch (e) {
                logger.error('Error parsing tickets for update', { error: e });
            }
        }

        // Handle bulk discounts using DiscountService
        const bulkDiscountsJson = formData.get('bulk_discounts') as string;
        if (bulkDiscountsJson) {
            try {
                const bulkDiscounts = JSON.parse(bulkDiscountsJson);
                if (Array.isArray(bulkDiscounts)) {
                    const discountService = factory.getDiscountService();
                    await discountService.updateBulkDiscountsForEvent(eventId, bulkDiscounts);
                    logger.info('Bulk discounts updated for event', { eventId, count: bulkDiscounts.length });
                }
            } catch (e) {
                logger.error('Error updating bulk discounts', { error: e, eventId });
            }
        }

        revalidatePath('/dashboard/vendor');
        logger.info('Event updated successfully', { eventId });

        trackActivity({
            userId: user.id,
            userRole: 'vendor',
            action: 'event_updated',
            targetType: 'event',
            targetId: eventId,
        });

        return { success: true };
    } catch (error) {
        logger.error('Failed to update event', { error, eventId });
        return { error: error instanceof Error ? error.message : 'Failed to update event' };
    }
}

/**
 * Get vendor events
 */
export async function getVendorEvents() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();

        const events = await eventService.getVendorEvents(user.id);
        logger.info('Vendor events fetched', { vendorId: user.id, count: events.length });

        return events;
    } catch (error) {
        logger.error('Failed to get vendor events', { error });
        return [];
    }
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();

        await eventService.deleteEvent(eventId, user.id);

        revalidatePath('/dashboard/vendor');
        logger.info('Event deleted successfully', { eventId });

        trackActivity({
            userId: user.id,
            userRole: 'vendor',
            action: 'event_deleted',
            targetType: 'event',
            targetId: eventId,
        });

        return { success: true };
    } catch (error) {
        logger.error('Failed to delete event', { error, eventId });
        return { error: error instanceof Error ? error.message : 'Failed to delete event' };
    }
}

/**
 * Get event bookings (for a specific event)
 */
export async function getEventBookings(eventId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        // Verify ownership
        const { data: event } = await supabase.from('events').select('id').eq('id', eventId).eq('vendor_id', user.id).single();
        if (!event) return [];

        // Get bookings for this event
        const factory = new ServiceFactory(supabase);
        const bookingService = factory.getBookingService();

        // Get all vendor bookings and filter by event
        const allBookings = await bookingService.getVendorBookings(user.id);
        const eventBookings = allBookings.filter((b: any) => b.event_id === eventId);

        logger.info('Event bookings fetched', { eventId, count: eventBookings.length });
        return eventBookings;
    } catch (error) {
        logger.error('Failed to get event bookings', { error, eventId });
        return [];
    }
}
