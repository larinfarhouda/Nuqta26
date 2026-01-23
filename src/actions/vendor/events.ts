'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Get Vendor ID
    const { data: vendor } = await supabase.from('vendors').select('id').eq('id', user.id).single();
    if (!vendor) return { error: 'Vendor profile not found' };

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

    // 1. Handle Image Upload
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
            console.error("Image upload failed:", uploadError);
        }
    }

    // 1.5 Generate Slug with uniqueness check
    const { slugify } = await import('@/utils/slugify');
    let slug = slugify(rawData.title);

    // Initial check
    const { data: existingSlug } = await supabase.from('events').select('slug').eq('slug', slug).maybeSingle();
    if (existingSlug) {
        // Simple but multi-user safeish: Append random string
        const randomStr = Math.random().toString(36).substring(2, 6);
        slug = `${slug}-${randomStr}`;
    }

    // 2. Create Event
    const { data: event, error: eventError } = await supabase.from('events').insert({
        vendor_id: vendor.id,
        ...rawData,
        slug,
        image_url
    }).select().single();

    if (eventError) return { error: eventError.message };

    // 3. Create Tickets
    const ticketsJson = formData.get('tickets') as string;
    if (ticketsJson) {
        try {
            const tickets = JSON.parse(ticketsJson);
            if (Array.isArray(tickets)) {
                const ticketInserts = tickets.map((t: any) => ({
                    event_id: event.id,
                    name: t.name,
                    price: parseFloat(t.price),
                    quantity: parseInt(t.quantity)
                }));

                if (ticketInserts.length > 0) {
                    const { error: ticketError } = await supabase.from('tickets').insert(ticketInserts);
                    if (ticketError) console.error("Error creating tickets:", ticketError);
                }
            }
        } catch (e) {
            console.error("Error parsing tickets JSON", e);
        }
    }

    // 4. Create Bulk Discounts
    const bulkDiscountsJson = formData.get('bulk_discounts') as string;
    if (bulkDiscountsJson) {
        try {
            const bulkDiscounts = JSON.parse(bulkDiscountsJson);
            if (Array.isArray(bulkDiscounts)) {
                const bulkInserts = bulkDiscounts.map((d: any) => ({
                    event_id: event.id,
                    min_quantity: parseInt(d.min_quantity),
                    discount_type: d.discount_type,
                    discount_value: parseFloat(d.discount_value)
                }));

                if (bulkInserts.length > 0) {
                    const { error: bulkError } = await (supabase.from('bulk_discounts' as any) as any).insert(bulkInserts);
                    if (bulkError) console.error("Error creating bulk discounts:", bulkError);
                }
            }
        } catch (e) {
            console.error("Error parsing bulk discounts JSON", e);
        }
    }

    revalidatePath('/dashboard/vendor');
    return { success: true, eventId: event.id };
}

export async function updateEvent(eventId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Update Basic Info
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

    // Handle Image Upload (only if new image provided)
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

    const { data: updatedEvent, error: eventError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .eq('vendor_id', user.id)
        .select('id');

    if (eventError) {
        console.error("Update Event Error:", eventError);
        return { error: eventError.message };
    }

    if (!updatedEvent || updatedEvent.length === 0) {
        console.error("Update Event: No rows updated. ID mismatch or permission issue.", { eventId, vendorId: user.id });
        return { error: 'Event not found or permission denied' };
    }

    // Handle Tickets (Upsert: Update existing, Insert new)
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
            console.error("Error parsing tickets for update", e);
        }
    }

    // Handle Bulk Discounts
    const bulkDiscountsJson = formData.get('bulk_discounts') as string;
    if (bulkDiscountsJson) {
        try {
            const bulkDiscounts = JSON.parse(bulkDiscountsJson);
            if (Array.isArray(bulkDiscounts)) {
                await (supabase.from('bulk_discounts' as any) as any).delete().eq('event_id', eventId);

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
            console.error("Error parsing bulk discounts for update", e);
        }
    }

    revalidatePath('/dashboard/vendor');
    return { success: true };
}

export async function getVendorEvents() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await (supabase
        .from('events')
        .select(`
            *,
            tickets (
                id,
                name,
                price,
                sold,
                quantity
            ),
            bookings (count),
            bulk_discounts (*)
        `) as any)
        .eq('vendor_id', user.id)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return data;
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('vendor_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/dashboard/vendor');
    return { success: true };
}
