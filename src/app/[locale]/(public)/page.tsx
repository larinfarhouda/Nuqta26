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
import { Metadata } from 'next';
import HomeFAQ from '@/components/home/HomeFAQ';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const title = locale === 'ar'
        ? 'نقطة | دليل الفعاليات والأنشطة العربية في إسطنبول'
        : "Nuqta | Istanbul's Arabic Event Hub";
    const description = locale === 'ar'
        ? 'اكتشف أفضل الفعاليات والأنشطة العربية في إسطنبول. ورش عمل، معارض فنية، بازارات وأكثر - كل شيء في مكان واحد.'
        : 'Discover and join vibrant community events in Istanbul. Workshops, bazaars, concerts, and more - all in one place.';

    return {
        title,
        description,
        alternates: {
            canonical: `https://nuqta.ist/${locale}`,
            languages: {
                'ar': 'https://nuqta.ist/ar',
                'en': 'https://nuqta.ist/en',
                'x-default': 'https://nuqta.ist/ar',
            },
        },
        openGraph: {
            title,
            description,
            url: `https://nuqta.ist/${locale}`,
            siteName: 'Nuqta',
            type: 'website',
            locale: locale === 'ar' ? 'ar_TR' : 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

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

export default async function HomePage(props: { params: Promise<{ locale: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { locale } = await props.params;
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

    const allEvents = await getPublicEvents({
        search,
        location,
        date: date as 'today' | 'tomorrow' | 'weekend' | 'week' | undefined,
        category,
        minPrice,
        maxPrice,
        lat,
        lng,
        radius
    });

    // Filter out events that finished more than 1 day ago,
    // and push recently-past events to the end of the list
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = allEvents
        .filter((event: any) => {
            const eventDate = new Date(event.date);
            // Keep events that haven't finished more than 1 day ago
            return eventDate >= oneDayAgo;
        })
        .sort((a: any, b: any) => {
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            const aIsPast = aDate < now;
            const bIsPast = bDate < now;

            // Upcoming events come first, past events go to the end
            if (aIsPast !== bIsPast) {
                return aIsPast ? 1 : -1;
            }

            // Within same group, sort by date ascending
            return aDate.getTime() - bDate.getTime();
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

    // Organization and WebSite schemas are now in root layout.tsx

    const itemListSchema = events && events.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": events.slice(0, 12).map((event: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Event",
                "name": event.title,
                "url": `https://nuqta.ist/${locale}/events/${event.slug || event.id}`,
                "image": event.image_url,
                "startDate": event.date,
                "location": {
                    "@type": "Place",
                    "name": event.location_name || event.district || 'Istanbul',
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": event.district || 'Istanbul',
                        "addressCountry": "TR"
                    }
                },
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "eventStatus": "https://schema.org/EventScheduled"
            }
        }))
    } : null;

    const isFiltered = !!(search || location || date || category || lat);

    return (
        <div className="min-h-screen bg-white flex flex-col relative selection:bg-primary selection:text-white">
            {itemListSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
                />
            )}

            <BackgroundShapes />

            <main className="w-full relative z-10">
                {!isFiltered && (
                    <div className="pt-20 md:pt-28 px-4 md:px-12 lg:px-20 max-w-[1440px] mx-auto">
                        <Hero />
                    </div>
                )}

                {/* Search Bar - Better Desktop Integration */}
                <div className={`relative z-50 transition-all duration-500 ${!isFiltered ? '-mt-6 md:-mt-10 mb-8 md:mb-12' : 'pt-24 md:pt-36 pb-8 md:pb-12'}`}>
                    <Suspense fallback={<div className="h-20" />}>
                        <EventSearchClient />
                    </Suspense>
                </div>

                {/* Discovery Categories (Sticky) - Refined desktop container */}
                <div className="sticky top-16 md:top-24 z-40">
                    <Categories />
                </div>

                <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 pb-24 mt-16 max-w-[1440px]">
                    {/* Listing Section Title with Local Filters - Improved Desktop Alignment */}
                    <div className="flex flex-row items-center justify-between gap-2 md:gap-8 mb-8 md:mb-16 border-b border-gray-100 pb-6 md:pb-10 overflow-x-auto no-scrollbar">
                        <div className="space-y-3 shrink-0">
                            <h2 className="text-xl md:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight">
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
                                    <span>{t('clearAllFilters')}</span>
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
                            <h3 className="text-2xl font-black text-gray-900 mb-2">{t('noMatchesFound')}</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-lg leading-relaxed">
                                {t('noMatchesDescription')}
                            </p>
                            <Link href="/" className="mt-8 inline-block px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-primary transition-all shadow-xl shadow-gray-200">
                                {t('resetDiscovery')}
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-x-10 md:gap-y-20">
                            {events.map((event: any) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isFavoriteInitial={favoritesSet.has(event.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Homepage FAQ Section */}
                    <div className="mt-24 md:mt-32 border-t border-gray-100 pt-16 md:pt-24">
                        <HomeFAQ />
                    </div>

                    {/* Features Section - Better spacing on desktop */}
                    <div className="mt-16 md:mt-24 border-t border-gray-100 pt-16 md:pt-24">
                        <Features />
                    </div>
                </div>
            </main>

            {/* <CTA /> */}
        </div>
    );
}
