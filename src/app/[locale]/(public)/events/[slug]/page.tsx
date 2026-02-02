
import { getPublicEvent } from '@/actions/public/events';
import EventDetailsClient from '@/components/events/EventDetailsClient';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';
import { getDemoEvents } from '@/lib/demoData';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const { slug } = await params;

    // Check if this is a demo event
    const demoEvents = getDemoEvents();
    const demoEvent = demoEvents.find(e => e.slug === slug);

    if (demoEvent) {
        return {
            title: `${demoEvent.title} | Nuqta`,
            description: demoEvent.description?.substring(0, 160) || 'Join this amazing event on Nuqta.',
            openGraph: {
                title: demoEvent.title,
                description: demoEvent.description?.substring(0, 160),
                images: demoEvent.image_url ? [demoEvent.image_url] : [],
            },
        };
    }

    const event = await getPublicEvent(slug);

    if (!event) {
        return {
            title: 'Event Not Found',
        };
    }

    return {
        title: `${event.title} | Nuqta`,
        description: event.description?.substring(0, 160) || 'Join this amazing event on Nuqta.',
        openGraph: {
            title: event.title,
            description: event.description?.substring(0, 160),
            images: event.image_url ? [event.image_url] : [],
        },
    };
}

export default async function EventPage({ params }: { params: any }) {
    const { slug } = await params;

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

    return <EventDetailsClient event={event} user={user} />;
}
