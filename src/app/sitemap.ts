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
        { route: '/for-vendors', priority: 0.8, changeFrequency: 'weekly' as const },
        { route: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
        { route: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
        { route: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Static Routes - One entry per route with language alternates
    staticRoutes.forEach(({ route, priority, changeFrequency }) => {
        locales.forEach(locale => {
            const alternateLanguages: Record<string, string> = {};
            locales.forEach(altLocale => {
                alternateLanguages[altLocale] = `${BASE_URL}/${altLocale}${route}`;
            });
            // x-default points to the default locale (Arabic)
            alternateLanguages['x-default'] = `${BASE_URL}/ar${route}`;

            sitemapEntries.push({
                url: `${BASE_URL}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency,
                priority,
                alternates: {
                    languages: alternateLanguages,
                },
            });
        });
    });

    // 2. Dynamic Event Pages - with language alternates
    events.forEach((event: any) => {
        const slug = event.slug || event.id;
        locales.forEach(locale => {
            const alternateLanguages: Record<string, string> = {};
            locales.forEach(altLocale => {
                alternateLanguages[altLocale] = `${BASE_URL}/${altLocale}/events/${slug}`;
            });
            alternateLanguages['x-default'] = `${BASE_URL}/ar/events/${slug}`;

            sitemapEntries.push({
                url: `${BASE_URL}/${locale}/events/${slug}`,
                lastModified: new Date(event.updated_at || event.created_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.9,
                alternates: {
                    languages: alternateLanguages,
                },
            });
        });
    });

    // 3. Vendor Profile Pages - with language alternates
    vendors.forEach((vendor: any) => {
        locales.forEach(locale => {
            const alternateLanguages: Record<string, string> = {};
            locales.forEach(altLocale => {
                alternateLanguages[altLocale] = `${BASE_URL}/${altLocale}/v/${vendor.slug}`;
            });
            alternateLanguages['x-default'] = `${BASE_URL}/ar/v/${vendor.slug}`;

            sitemapEntries.push({
                url: `${BASE_URL}/${locale}/v/${vendor.slug}`,
                lastModified: new Date(vendor.updated_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.8,
                alternates: {
                    languages: alternateLanguages,
                },
            });
        });
    });

    return sitemapEntries;
}
