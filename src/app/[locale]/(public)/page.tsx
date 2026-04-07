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
import { cookies } from 'next/headers';
import { COUNTRY_COOKIE_NAME, getCountryCode } from '@/utils/country-helpers';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const title = locale === 'ar'
        ? 'نقطة | دليل الفعاليات والأنشطة'
        : 'Nuqta | Discover Events & Experiences';
    const description = locale === 'ar'
        ? 'اكتشف أفضل الفعاليات والأنشطة. ورش عمل، معارض فنية، بازارات وأكثر - كل شيء في مكان واحد.'
        : 'Discover and join vibrant community events. Workshops, bazaars, concerts, and more - all in one place.';

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
            locale: locale === 'ar' ? 'ar' : 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

// Dynamic imports for heavy components
const EventSearchClient = dynamic(() => import('@/components/events/EventSearchClient'), {
    loading: () => <div className="h-16 bg-gray-50 rounded-2xl animate-pulse max-w-2xl mx-auto" />
});

const Categories = dynamic(() => import('@/components/home/Categories'), {
    loading: () => <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
});

const LocalFilters = dynamic(() => import('@/components/home/LocalFilters'), {
    loading: () => <div className="h-12 bg-gray-50 rounded-xl animate-pulse w-48" />
});

const StatsBar = dynamic(() => import('@/components/home/StatsBar'), {
    loading: () => <div className="h-32 bg-gray-50 animate-pulse" />
});

const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
    loading: () => <div className="h-64 bg-gray-50 rounded-3xl animate-pulse" />
});

export default async function HomePage(props: { params: Promise<{ locale: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { locale } = await props.params;
    const searchParams = await props.searchParams;
    const t = await getTranslations('Index');
    const supabase = await createClient();

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
    const cookieStore = await cookies();
    const country = typeof searchParams.country === 'string'
        ? searchParams.country
        : cookieStore.get(COUNTRY_COOKIE_NAME)?.value || undefined;

    // Run independent queries in parallel
    const [allEvents, { data: districtsData }, { data: { user: authUser } }, { count: vendorCount }, { count: totalEventCount }] = await Promise.all([
        getPublicEvents({
            search,
            location,
            date: date as 'today' | 'tomorrow' | 'weekend' | 'week' | undefined,
            category,
            minPrice,
            maxPrice,
            lat,
            lng,
            radius,
        }),
        supabase
            .from('events')
            .select('district')
            .not('district', 'is', null)
            .eq('status', 'published'),
        supabase.auth.getUser(),
        supabase
            .from('vendors')
            .select('*', { count: 'exact', head: true }),
        supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published'),
    ]);

    const favoriteIds = authUser ? await getUserFavoriteIds() : [];
    const favoritesSet = new Set(favoriteIds);

    // Filter & sort events
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = allEvents
        .filter((event: any) => {
            const eventDate = new Date(event.date);
            return eventDate >= oneDayAgo;
        })
        .sort((a: any, b: any) => {
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            const aIsPast = aDate < now;
            const bIsPast = bDate < now;
            if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
            return aDate.getTime() - bDate.getTime();
        });

    const uniqueDistricts = Array.from(new Set(districtsData?.map(d => d.district).filter(Boolean))) as string[];
    uniqueDistricts.sort();

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
                        "addressCountry": getCountryCode(event.country)
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
                {/* Hero + Search — Seamless flow */}
                {!isFiltered && (
                    <Hero />
                )}

                {/* Search Bar — Part of the hero flow, not floating */}
                <div className={`relative z-50 ${!isFiltered ? '-mt-4 md:-mt-6 mb-6 md:mb-8' : 'pt-24 md:pt-36 pb-6 md:pb-8'}`}>
                    <Suspense fallback={<div className="h-16 max-w-2xl mx-auto" />}>
                        <EventSearchClient />
                    </Suspense>
                </div>

                {/* Categories — Sticky */}
                <div className="sticky top-16 md:top-24 z-40">
                    <Categories />
                </div>

                {/* Main Content */}
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 pb-20 mt-8 md:mt-12">
                    {/* Section Header with Filters */}
                    <div className="flex flex-row items-center justify-between gap-2 md:gap-6 mb-6 md:mb-10 pb-4 md:pb-6 border-b border-gray-100 overflow-x-auto no-scrollbar">
                        <div className="space-y-1.5 shrink-0">
                            <h2 className="text-lg md:text-2xl xl:text-3xl font-black text-accent tracking-tight">
                                {isFiltered ? (
                                    <span className="flex items-center gap-3">
                                        {t('searchResults')}
                                        <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
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
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                                >
                                    <span className="bg-gray-100 p-0.5 rounded">✕</span>
                                    <span>{t('clearAllFilters')}</span>
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <LocalFilters districts={uniqueDistricts} />
                        </div>
                    </div>

                    {/* Event Grid */}
                    {!events || events.length === 0 ? (
                        <div className="py-24 md:py-32 text-center bg-secondary/20 rounded-3xl border border-secondary/30">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                                <Search className="w-7 h-7 text-primary/30" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-accent mb-2">{t('noMatchesFound')}</h3>
                            <p className="text-accent/40 max-w-sm mx-auto text-sm md:text-base leading-relaxed mb-6">
                                {t('noMatchesDescription')}
                            </p>
                            <Link
                                href="/"
                                className="inline-block px-8 py-3.5 bg-accent text-white rounded-2xl font-bold hover:bg-primary transition-all shadow-lg"
                            >
                                {t('resetDiscovery')}
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                            {events.map((event: any, index: number) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isFavoriteInitial={favoritesSet.has(event.id)}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats — Social proof for both audiences */}
                <StatsBar eventCount={totalEventCount || 0} vendorCount={vendorCount || 0} />

                {/* How It Works — Attendee onboarding */}
                <div className="max-w-[1440px] mx-auto px-4 md:px-8">
                    <HowItWorks />
                </div>

                {/* FAQ Section */}
                <div className="max-w-[1440px] mx-auto px-4 md:px-8">
                    <div className="border-t border-gray-100 pt-12 md:pt-20">
                        <HomeFAQ />
                    </div>
                </div>

                {/* CTA */}
                <CTA />
            </main>
        </div>
    );
}
