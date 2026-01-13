import { getPublicEvents } from '@/actions/public/events';
import { getUserFavoriteIds } from '@/actions/user';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import EventSearch from '@/components/events/EventSearch';
import EventCard from '@/components/events/EventCard';
import Categories from '@/components/home/Categories';

import Features from '@/components/home/Features';
import CTA from '@/components/home/CTA';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/utils/supabase/server';
import BackgroundShapes from '@/components/home/BackgroundShapes';
import { Search } from 'lucide-react';
import { Link } from '@/navigation';
import { Suspense } from 'react';

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
    const favoriteIds = await getUserFavoriteIds();
    const favoritesSet = new Set(favoriteIds);

    return (
        <div className="min-h-screen bg-white flex flex-col relative overflow-hidden selection:bg-primary selection:text-white pb-24 md:pb-0">
            <BackgroundShapes />

            <Navbar user={user} />

            <Hero />

            {/* Event Search & Listing Section */}
            <div className="relative z-20 pb-16">
                {/* Search Bar - Sticky on mobile? Integrated for now */}
                <Suspense fallback={<div className="h-20" />}>
                    <EventSearch />
                </Suspense>

                <div className="container mx-auto px-4 md:px-6 pt-12 md:pt-24">

                    {/* Categories - Outside Search */}
                    <Categories />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2">
                                {search || location || date ? (
                                    <span className="flex items-center gap-3">
                                        {t('searchResults')}
                                        <span className="text-sm font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{events?.length || 0}</span>
                                    </span>
                                ) : (
                                    t('upcomingEvents')
                                )}
                            </h2>
                            <p className="text-gray-500 font-medium text-lg">
                                {search || location || date
                                    ? `Showing curated results for your search`
                                    : `Discover what's happening in your community today`
                                }
                            </p>
                        </div>
                    </div>

                    {/* Event Grid */}
                    {!events || events.length === 0 ? (
                        <div className="py-24 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">No events found</h3>
                            <p className="text-gray-400 max-w-xs mx-auto">We couldn't find anything matching those filters. Try broadening your search!</p>
                            <Link
                                href="/"
                                className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-colors inline-block"
                            >
                                Clear all filters
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                            {events.map((event: any, idx: number) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isFavoriteInitial={favoritesSet.has(event.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Features />

            <CTA />

            <Footer />

            <BottomNav isLoggedIn={!!user} />
        </div>
    );
}
