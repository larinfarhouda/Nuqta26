'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { UnauthorizedError } from '@/lib/errors/app-error';

/**
 * Create event (vendor action)
 */
export async function createEvent(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Get/verify vendor
        const { data: vendor } = await supabase.from('vendors').select('id').eq('id', user.id).single();
        if (!vendor) return { error: 'Vendor profile not found' };

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

        // Use EventService to create
        const factory = new ServiceFactory(supabase);
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

        // Create bulk discounts
        const bulkDiscountsJson = formData.get('bulk_discounts') as string;
        if (bulkDiscountsJson) {
            try {
                const bulkDiscounts = JSON.parse(bulkDiscountsJson);
                if (Array.isArray(bulkDiscounts) && bulkDiscounts.length > 0) {
                    const discountService = factory.getDiscountService();
                    for (const d of bulkDiscounts) {
                        await discountService.createDiscount({
                            vendorId: vendor.id,
                            code: `BULK_${event.id}_${d.min_quantity}`,
                            discountType: d.discount_type,
                            discountValue: parseFloat(d.discount_value),
                            eventId: event.id
                        });
                    }
                }
            } catch (e) {
                logger.error('Error parsing bulk discounts JSON', { error: e });
            }
        }

        revalidatePath('/dashboard/vendor');
        logger.info('Event created successfully', { eventId: event.id });

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

        // Handle bulk discounts
        const bulkDiscountsJson = formData.get('bulk_discounts') as string;
        if (bulkDiscountsJson) {
            try {
                const bulkDiscounts = JSON.parse(bulkDiscountsJson);
                if (Array.isArray(bulkDiscounts)) {
                    // Delete existing
                    await (supabase.from('bulk_discounts' as any) as any).delete().eq('event_id', eventId);

                    // Insert new
                    const bulkInserts = bulkDiscounts.map((d: any) => ({
                        event_id: eventId,
                        min_quantity: parseInt(d.min_quantity),
                        discount_type: d.discount_type,
                        discount_value: parseFloat(d.discount_value)
                    }));

                    if (bulkInserts.length > 0) {
                        await (supabase.from('bulk_discounts' as any) as any).insert(bulkInserts);
                    }
                }
            } catch (e) {
                logger.error('Error parsing bulk discounts for update', { error: e });
            }
        }

        revalidatePath('/dashboard/vendor');
        logger.info('Event updated successfully', { eventId });

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
