'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { UnauthorizedError } from '@/lib/errors/app-error';
import {
    canCreateEvent,
    getEventLimit,
    getRequiredUpgradeTier,
    type SubscriptionTier
} from '@/lib/constants/subscription';
import { trackActivity } from '@/lib/track-activity';

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
            .select('id, bank_name, bank_iban, bank_account_name, subscription_tier, is_founder_pricing')
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

        const tier = (vendor.subscription_tier || 'starter') as SubscriptionTier;

        // Check subscription tier limits
        const factory = new ServiceFactory(supabase);
        const eventRepository = factory.getEventRepository();
        const activeEventsCount = await eventRepository.countActiveEventsByVendor(user.id);

        if (!canCreateEvent(tier, activeEventsCount)) {
            const limit = getEventLimit(tier);
            const upgradeTier = getRequiredUpgradeTier(tier);

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
                isFounder: vendor.is_founder_pricing || false
            };
        }

        // Parse form data
        const rawData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            event_type: formData.get('event_type') as string,
            date: formData.get('date') as string,
            end_date: formData.get('end_date') as string,
            location_lat: parseFloat(formData.get('location_lat') as string),
            location_long: parseFloat(formData.get('location_long') as string),
            location_name: formData.get('location_name') as string,
            district: formData.get('district') as string,
            city: formData.get('city') as string,
            country: formData.get('country') as string,
            capacity: parseInt(formData.get('capacity') as string),
            is_recurring: formData.get('is_recurring') === 'true',
            recurrence_type: formData.get('recurrence_type') as string,
            recurrence_days: formData.get('recurrence_days') ? JSON.parse(formData.get('recurrence_days') as string) : [],
            recurrence_end_date: formData.get('recurrence_end_date') as string,
        };

        // Handle image upload
        let image_url = null;
        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${vendor.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('vendor-public').upload(fileName, imageFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('vendor-public').getPublicUrl(fileName);
                image_url = publicUrl;
            } else {
                logger.error('Image upload failed', { uploadError });
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
        const eventService = factory.getEventService();

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

        return { success: true, eventId: event.id };
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
        const rawData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            category_id: formData.get('category_id') as string,
            date: formData.get('date') as string,
            end_date: formData.get('end_date') as string,
            location_lat: parseFloat(formData.get('location_lat') as string),
            location_long: parseFloat(formData.get('location_long') as string),
            location_name: formData.get('location_name') as string,
            district: formData.get('district') as string,
            city: formData.get('city') as string,
            country: formData.get('country') as string,
            capacity: parseInt(formData.get('capacity') as string),
            is_recurring: formData.get('is_recurring') === 'true',
            recurrence_type: formData.get('recurrence_type') as string,
            recurrence_days: formData.get('recurrence_days') ? JSON.parse(formData.get('recurrence_days') as string) : [],
            recurrence_end_date: formData.get('recurrence_end_date') as string,
        };

        // Handle image upload
        let image_url = undefined;
        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('vendor-public').upload(fileName, imageFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('vendor-public').getPublicUrl(fileName);
                image_url = publicUrl;
            }
        }

        const updateData: any = { ...rawData };
        if (image_url) updateData.image_url = image_url;

        // Use EventService to update
        const factory = new ServiceFactory(supabase);
        const eventService = factory.getEventService();

        await eventService.updateEvent(eventId, user.id, updateData);

        // Handle tickets (upsert)
        const ticketsJson = formData.get('tickets') as string;
        if (ticketsJson) {
            try {
                const tickets = JSON.parse(ticketsJson);
                if (Array.isArray(tickets)) {
                    for (const t of tickets) {
                        if (t.id) {
                            await supabase.from('tickets').update({
                                name: t.name,
                                price: parseFloat(t.price),
                                quantity: parseInt(t.quantity)
                            }).eq('id', t.id).eq('event_id', eventId);
                        } else {
                            await supabase.from('tickets').insert({
                                event_id: eventId,
                                name: t.name,
                                price: parseFloat(t.price),
                                quantity: parseInt(t.quantity)
                            });
                        }
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
