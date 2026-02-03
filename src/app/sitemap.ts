import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://nuqta.ist';
const locales = ['ar', 'en'];

// Create a Supabase client without cookies for static generation
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let events: any[] = [];
    let vendors: any[] = [];

    try {
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('events')
            .select('slug, id, updated_at, created_at')
            .eq('status', 'published')
            .not('slug', 'is', null);

        events = data || [];
    } catch (error) {
        console.error('Sitemap generation error (events):', error);
    }

    try {
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('vendors')
            .select('slug, updated_at')
            .eq('status', 'approved')
            .not('slug', 'is', null);

        vendors = data || [];
    } catch (error) {
        console.error('Sitemap generation error (vendors):', error);
    }

    // Static pages with their respective priorities
    const staticRoutes = [
        { route: '', priority: 1.0, changeFrequency: 'daily' as const },
        { route: '/events', priority: 0.9, changeFrequency: 'daily' as const },
        { route: '/for-vendors', priority: 0.8, changeFrequency: 'weekly' as const },
        { route: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
        { route: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
        { route: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Static Routes - Both locales
    staticRoutes.forEach(({ route, priority, changeFrequency }) => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: `${BASE_URL}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency,
                priority,
            });
        });
    });

    // 2. Dynamic Event Pages - High priority, weekly updates
    events.forEach((event: any) => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: `${BASE_URL}/${locale}/events/${event.slug || event.id}`,
                lastModified: new Date(event.updated_at || event.created_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.9,
            });
        });
    });

    // 3. Vendor Profile Pages - Good priority, weekly updates
    vendors.forEach((vendor: any) => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: `${BASE_URL}/${locale}/v/${vendor.slug}`,
                lastModified: new Date(vendor.updated_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.8,
            });
        });
    });

    return sitemapEntries;
}
