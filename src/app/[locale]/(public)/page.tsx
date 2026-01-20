import { getPublicEvents } from '@/actions/public/events';
import { getUserFavoriteIds } from '@/actions/user';
import Hero from '@/components/home/Hero';
import EventCard from '@/components/events/EventCard';
import CTA from '@/components/home/CTA';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/utils/supabase/server';
import BackgroundShapes from '@/components/home/BackgroundShapes';
import { Search } from 'lucide-react';
import { Link } from '@/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components to reduce initial bundle size
const EventSearchClient = dynamic(() => import('@/components/events/EventSearchClient'), {
    loading: () => <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
});

const Categories = dynamic(() => import('@/components/home/Categories'), {
    loading: () => <div className="h-24 bg-white border-b border-gray-100 animate-pulse" />
});

const LocalFilters = dynamic(() => import('@/components/home/LocalFilters'), {
    loading: () => <div className="h-12 bg-gray-50 rounded-xl animate-pulse w-48" />
});

const Features = dynamic(() => import('@/components/home/Features'), {
    loading: () => <div className="h-96 bg-gray-50 rounded-3xl animate-pulse" />
});

export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const t = await getTranslations('Index');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Parse filters
    const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
    const location = typeof searchParams.location === 'string' ? searchParams.location : undefined;
    const date = typeof searchParams.date === 'string' ? searchParams.date : undefined;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const minPrice = typeof searchParams.minPrice === 'string' ? Number(searchParams.minPrice) : undefined;
    const maxPrice = typeof searchParams.maxPrice === 'string' ? Number(searchParams.maxPrice) : undefined;
    const lat = typeof searchParams.lat === 'string' ? Number(searchParams.lat) : undefined;
    const lng = typeof searchParams.lng === 'string' ? Number(searchParams.lng) : undefined;
    const radius = typeof searchParams.radius === 'string' ? Number(searchParams.radius) : undefined;

    const events = await getPublicEvents({
        search,
        location,
        date,
        category,
        minPrice,
        maxPrice,
        lat,
        lng,
        radius
    });

    // Fetch unique districts
    const { data: districtsData } = await supabase
        .from('events')
        .select('district')
        .not('district', 'is', null)
        .eq('status', 'published');

    const uniqueDistricts = Array.from(new Set(districtsData?.map(d => d.district).filter(Boolean))) as string[];
    uniqueDistricts.sort();

    const favoriteIds = await getUserFavoriteIds();
    const favoritesSet = new Set(favoriteIds);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Nuqta",
        "url": "https://nuqta.ist",
        "logo": "https://nuqta.ist/images/logo_nav.png",
        "sameAs": [
            "https://instagram.com/nuqta_ist",
            "https://twitter.com/nuqta_ist"
        ],
        "description": "The digital marketplace for events and ticketing in Istanbul's Arabic-speaking community."
    };

    const isFiltered = !!(search || location || date || category || lat);

    return (
        <div className="min-h-screen bg-white flex flex-col relative selection:bg-primary selection:text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <BackgroundShapes />

            <main className="w-full relative z-10">
                {!isFiltered && (
                    <div className="pt-24 md:pt-28 px-4 md:px-12 lg:px-20 max-w-[1440px] mx-auto">
                        <Hero />
                    </div>
                )}

                {/* Search Bar - Better Desktop Integration */}
                <div className={`relative z-50 transition-all duration-500 ${!isFiltered ? '-mt-10 mb-12' : 'pt-36 pb-12'}`}>
                    <Suspense fallback={<div className="h-20" />}>
                        <EventSearchClient />
                    </Suspense>
                </div>

                {/* Discovery Categories (Sticky) - Refined desktop container */}
                <div className="sticky top-24 z-40">
                    <Categories />
                </div>

                <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 pb-24 mt-16 max-w-[1440px]">
                    {/* Listing Section Title with Local Filters - Improved Desktop Alignment */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 border-b border-gray-100 pb-10">
                        <div className="space-y-3">
                            <h2 className="text-2xl md:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight">
                                {isFiltered ? (
                                    <span className="flex items-center gap-4">
                                        {t('searchResults')}
                                        <span className="text-base font-bold bg-primary/10 text-primary px-4 py-1.5 rounded-full border border-primary/10">
                                            {events?.length || 0}
                                        </span>
                                    </span>
                                ) : (
                                    t('upcomingEvents')
                                )}
                            </h2>
                            {isFiltered && (
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors group"
                                >
                                    <span className="bg-gray-100 p-1 rounded-md group-hover:bg-primary/10 transition-colors">✕</span>
                                    <span>Clear all filters</span>
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <LocalFilters districts={uniqueDistricts} />
                        </div>
                    </div>

                    {/* Event Grid - Balanced Desktop Proportions */}
                    {!events || events.length === 0 ? (
                        <div className="py-32 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">No matches found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-lg leading-relaxed">
                                We couldn't find any events matching your current filters. Try broadening your search!
                            </p>
                            <Link href="/" className="mt-8 inline-block px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-primary transition-all shadow-xl shadow-gray-200">
                                Reset Discovery
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-10 gap-y-12 md:gap-y-20">
                            {events.map((event: any) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isFavoriteInitial={favoritesSet.has(event.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Features Section - Better spacing on desktop */}
                    <div className="mt-40 border-t border-gray-100 pt-32">
                        <Features />
                    </div>
                </div>
            </main>

            <CTA />
        </div>
    );
}
