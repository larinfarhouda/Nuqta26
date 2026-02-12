import { getPublicEvent } from '@/actions/public/events';
import EventDetailsClient from '@/components/events/EventDetailsClient';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { hasExpressedInterest, getEventInterestCount } from '@/actions/public/interests';
import { trackPageView } from '@/actions/public/track';
import { Metadata } from 'next';
import { getDemoEvents } from '@/lib/demoData';
import {
    generateCanonicalUrl,
    generateLanguageAlternates,
    createEventDescription,
    formatDateForOG,
    generateImageUrl
} from '@/lib/seo';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const { slug, locale } = await params;

    // Check if this is a demo event
    const demoEvents = getDemoEvents();
    const demoEvent = demoEvents.find(e => e.slug === slug);

    if (demoEvent) {
        const description = createEventDescription(demoEvent);
        const canonicalUrl = generateCanonicalUrl(`events/${slug}`, locale || 'en');
        const alternates = generateLanguageAlternates(`events/${slug}`);
        const imageUrl = generateImageUrl(demoEvent.image_url);

        return {
            title: `${demoEvent.title} | Nuqta`,
            description,
            alternates: {
                canonical: canonicalUrl,
                languages: Object.fromEntries(
                    alternates.map(alt => [alt.hreflang, alt.href])
                ),
            },
            openGraph: {
                type: 'website',
                title: demoEvent.title,
                description,
                images: [{ url: imageUrl, width: 1200, height: 630, alt: demoEvent.title }],
                url: canonicalUrl,
                siteName: 'Nuqta',
            },
            twitter: {
                card: 'summary_large_image',
                title: demoEvent.title,
                description,
                images: [imageUrl],
            },
        };
    }

    const event = await getPublicEvent(slug);

    if (!event) {
        return {
            title: 'Event Not Found',
        };
    }

    const description = createEventDescription(event);
    const canonicalUrl = generateCanonicalUrl(`events/${slug}`, locale || 'en');
    const alternates = generateLanguageAlternates(`events/${slug}`);
    const imageUrl = generateImageUrl(event.image_url);

    return {
        title: `${event.title} | Nuqta`,
        description,
        alternates: {
            canonical: canonicalUrl,
            languages: Object.fromEntries(
                alternates.map(alt => [alt.hreflang, alt.href])
            ),
        },
        openGraph: {
            type: 'website',
            title: event.title,
            description,
            images: [{ url: imageUrl, width: 1200, height: 630, alt: event.title }],
            url: canonicalUrl,
            siteName: 'Nuqta',
        },
        twitter: {
            card: 'summary_large_image',
            title: event.title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function EventPage({ params }: { params: any }) {
    const { slug, locale } = await params;

    // Check if this is a demo event
    const demoEvents = getDemoEvents();
    const demoEvent = demoEvents.find(e => e.slug === slug);

    if (demoEvent) {
        // For demo events, we don't need actual user auth
        return <EventDetailsClient event={demoEvent} user={null} />;
    }

    const event = await getPublicEvent(slug);

    if (!event) return notFound();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get interest data for prospect events
    let interestData: { isInterested: boolean; interestCount: number } | undefined;
    if (event.prospect_vendor_id) {
        const [isInterested, interestCount] = await Promise.all([
            hasExpressedInterest(event.id),
            getEventInterestCount(event.id),
        ]);
        interestData = { isInterested, interestCount };
    }

    // Track page view (fire-and-forget)
    trackPageView('event', event.id, { slug, title: event.title });

    // Generate Event Schema (JSON-LD)
    const eventSchema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        image: generateImageUrl(event.image_url),
        startDate: formatDateForOG(event.date),
        endDate: event.end_date ? formatDateForOG(event.end_date) : formatDateForOG(event.date),
        eventStatus: event.status === 'published' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventCancelled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: event.location_name || event.district || 'Istanbul',
            address: {
                '@type': 'PostalAddress',
                addressLocality: event.district || 'Istanbul',
                addressCountry: 'TR'
            },
            ...(event.location_lat && event.location_long ? {
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: event.location_lat,
                    longitude: event.location_long
                }
            } : {})
        },
        organizer: {
            '@type': 'Organization',
            name: event.vendor?.business_name || 'Nuqta',
            url: event.vendor?.slug ? `https://nuqta.ist/v/${event.vendor.slug}` : 'https://nuqta.ist'
        },
        offers: event.tickets && event.tickets.length > 0 ? event.tickets.map(ticket => ({
            '@type': 'Offer',
            price: ticket.price || 0,
            priceCurrency: 'TRY',
            name: ticket.name,
            availability: event.status === 'published' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            url: generateCanonicalUrl(`events/${slug}`, locale || 'en')
        })) : {
            '@type': 'Offer',
            price: 0,
            priceCurrency: 'TRY',
            availability: event.status === 'published' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            url: generateCanonicalUrl(`events/${slug}`, locale || 'en')
        }
    };

    // Generate Breadcrumb Schema
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `https://nuqta.ist/${locale || 'en'}`
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Events',
                item: `https://nuqta.ist/${locale || 'en'}/events`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: event.title,
                item: generateCanonicalUrl(`events/${slug}`, locale || 'en')
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <EventDetailsClient event={event} user={user} interestData={interestData} />
        </>
    );
}
