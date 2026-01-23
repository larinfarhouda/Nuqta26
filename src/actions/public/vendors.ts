'use server';

import { createClient } from '@/utils/supabase/server';

export async function getPublicVendor(slug: string) {
    const supabase = await createClient();

    // Fetch vendor details
    const { data: vendor, error } = await supabase
        .from('vendors')
        .select('id, slug, business_name, description_ar, company_logo, whatsapp_number, website, category, instagram, banner_url:cover_image, location_lat, location_long')
        .eq('slug', slug)
        .single();

    if (error || !vendor) return null;

    // Fetch vendor gallery
    const { data: gallery } = await supabase
        .from('vendor_gallery')
        .select('id, image_url, caption')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

    // Fetch vendor events
    const { data: events } = await supabase
        .from('events')
        .select(`
            id, 
            slug, 
            title, 
            description, 
            date, 
            location_name, 
            city, 
            image_url, 
            category_id,
            tickets (
                id,
                name,
                price,
                capacity,
                sold
            )
        `)
        .eq('vendor_id', vendor.id)
        .eq('status', 'published')
        .gte('date', new Date().toISOString()) // Only future events
        .order('date', { ascending: true });

    return {
        ...vendor,
        gallery: gallery || [],
        events: events || []
    };
}
