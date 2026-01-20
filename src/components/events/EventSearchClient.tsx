'use client';

import dynamic from 'next/dynamic';

// Dynamic import for EventSearch (client-side only)
const EventSearch = dynamic(() => import('@/components/events/EventSearch'), {
    loading: () => <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />,
    ssr: false
});

export default EventSearch;
