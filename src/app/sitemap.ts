import { MetadataRoute } from 'next';
import { getAllEventIdsForSitemap } from '@/actions/public/events';

const BASE_URL = 'https://nuqta.ist';
const locales = ['ar', 'en'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let events: any[] = [];
    try {
        events = await getAllEventIdsForSitemap();
    } catch (error) {
        console.error('Sitemap generation error (events):', error);
    }

    // Static pages
    const routes = [
        '',
        '/about',
        '/contact',
        '/for-vendors',
        '/privacy',
        '/events'
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Static Routes
    routes.forEach(route => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: `${BASE_URL}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: route === '' ? 1 : 0.8,
            });
        });
    });

    // 2. Dynamic Event Pages
    events.forEach((event: any) => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: `${BASE_URL}/${locale}/events/${event.slug || event.id}`,
                lastModified: new Date(event.updated_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.9,
            });
        });
    });

    return sitemapEntries;
}
