'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, Star, Instagram, Globe, CheckCircle, Image as ImageIcon, Calendar, ArrowRight, Share2, Quote, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import StarRating from '@/components/reviews/StarRating';
import EventCard from '@/components/events/EventCard';
import { Link } from '@/navigation';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VendorEventFilters from '@/components/vendor/VendorEventFilters';
import { calculateDistance } from '@/utils/distance';

export default function VendorProfileClient({ vendor }: { vendor: any }) {
    const t = useTranslations('VendorProfile');
    const tVendor = useTranslations('Vendor');
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [activeTab, setActiveTab] = useState<'events' | 'gallery' | 'reviews' | 'about'>('events');
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Read filter values from URL search params
    const filters = useMemo(() => ({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        district: searchParams.get('district') || '',
        userLat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
        userLng: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
    }), [searchParams]);

    // Refs for scroll handling
    const heroRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (heroRef.current) {
                const heroHeight = heroRef.current.offsetHeight;
                setIsHeaderSticky(window.scrollY > heroHeight - 100);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 120;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
        setActiveTab(id as any);
    };

    // Filter events based on current URL filters
    const filteredEvents = useMemo(() => {
        if (!vendor.events || vendor.events.length === 0) return [];

        let result = vendor.events.filter((event: any) => {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const titleMatch = event.title?.toLowerCase().includes(searchLower);
                const descMatch = event.description?.toLowerCase().includes(searchLower);
                if (!titleMatch && !descMatch) return false;
            }
            if (filters.category && event.category_id) {
                if (event.category?.slug !== filters.category) return false;
            }
            if (filters.district && event.district !== filters.district) {
                return false;
            }
            return true;
        });

        // Sort by distance if user location is available
        if (filters.userLat && filters.userLng) {
            result = result
                .map((event: any) => {
                    if (event.location_lat && event.location_long) {
                        const distance = calculateDistance(
                            filters.userLat!,
                            filters.userLng!,
                            event.location_lat,
                            event.location_long
                        );
                        return { ...event, _distance: distance };
                    }
                    return { ...event, _distance: Infinity };
                })
                .sort((a: any, b: any) => a._distance - b._distance);
        }

        return result;
    }, [vendor.events, filters]);

    const hasEvents = vendor.events && vendor.events.length > 0;
    const hasGallery = vendor.gallery && vendor.gallery.length > 0;
    const hasReviews = vendor.reviews && vendor.reviews.length > 0;
    const isVerified = vendor.status === 'approved';
    const memberYear = vendor.created_at ? new Date(vendor.created_at).getFullYear() : null;

    // Get the best review for the featured section
    const featuredReview = useMemo(() => {
        if (!hasReviews) return null;
        const sorted = [...vendor.reviews].sort((a: any, b: any) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return sorted[0];
    }, [vendor.reviews, hasReviews]);

    // Share handler
    const handleShare = useCallback(async () => {
        const url = window.location.href;
        const text = `${vendor.business_name} — ${locale === 'ar' ? 'اكتشف فعالياتهم على نقطة' : 'Check out their events on Nuqta'}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: vendor.business_name, text, url });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
        }
    }, [vendor.business_name, locale]);

    // Visible tabs based on available data
    const tabs = useMemo(() => {
        const base: { id: string; label: string }[] = [
            { id: 'events', label: t('events_tab') },
        ];
        if (hasGallery) base.push({ id: 'gallery', label: t('gallery_tab') });
        if (hasReviews) base.push({ id: 'reviews', label: `${t('reviews_tab')}${vendor.rating?.count ? ` (${vendor.rating.count})` : ''}` });
        base.push({ id: 'about', label: t('about_tab') });
        return base;
    }, [hasGallery, hasReviews, vendor.rating, t]);

    // Short description excerpt for hero
    const bioExcerpt = useMemo(() => {
        const desc = vendor.description_ar || '';
        if (desc.length <= 120) return desc;
        return desc.substring(0, 120).trim() + '…';
    }, [vendor.description_ar]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 relative">

            {/* ═══════════════ SECTION 1: IMMERSIVE HERO ═══════════════ */}
            <div ref={heroRef} className="relative h-[45vh] md:h-[55vh] min-h-[380px] overflow-hidden bg-gray-900 group">
                {/* Cover Image / Gradient Fallback */}
                {vendor.cover_image ? (
                    <Image
                        src={vendor.cover_image}
                        alt="Cover"
                        fill
                        className="object-cover opacity-80 transition-transform duration-[20s] ease-in-out group-hover:scale-105"
                        priority
                    />
                ) : (
                    /* Stylish gradient fallback instead of broken grid.svg */
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary/30">
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-gray-900/20" />

                {/* Hero Content */}
                <div className="absolute inset-0 flex flex-col justify-end pb-8 md:pb-14 px-4 md:px-8 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8 text-center md:text-left md:rtl:text-right">

                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative w-24 h-24 md:w-36 md:h-36 shrink-0 rounded-2xl md:rounded-[1.75rem] overflow-hidden border-[3px] border-white/90 shadow-2xl bg-white z-20"
                        >
                            <Image
                                src={vendor.company_logo || '/images/logo_nav.png'}
                                alt={vendor.business_name}
                                fill
                                className="object-cover"
                            />
                        </motion.div>

                        {/* Title, Bio, Badges */}
                        <div className="flex-1 space-y-2.5 relative z-10 w-full pb-1 md:pb-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-wrap items-center justify-center md:justify-start gap-2"
                            >
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {vendor.category?.name_en || vendor.category?.name_ar || tVendor('cat_cultural')}
                                </span>
                                {isVerified && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/30">
                                        <CheckCircle className="w-3 h-3 fill-current" />
                                        <span>{t('verified_partner')}</span>
                                    </span>
                                )}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                data-speakable
                                className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-sm"
                            >
                                {vendor.business_name}
                            </motion.h1>

                            {/* Bio Excerpt (below name) */}
                            {bioExcerpt && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-sm md:text-base text-gray-300/90 font-medium max-w-2xl leading-relaxed hidden md:block"
                                >
                                    {bioExcerpt}
                                </motion.p>
                            )}

                            {/* Location + Rating row */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-sm font-medium text-gray-300"
                            >
                                {(vendor.city || vendor.district || vendor.location_name) && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{vendor.city || vendor.district || vendor.location_name}</span>
                                    </div>
                                )}
                                {vendor.rating && vendor.rating.count > 0 && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-gray-600 hidden md:block" />
                                        <div className="flex items-center gap-1.5 text-amber-400">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            <span className="text-white font-bold">
                                                {vendor.rating.average.toFixed(1)} ({vendor.rating.count})
                                            </span>
                                        </div>
                                    </>
                                )}
                                {memberYear && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-gray-600 hidden md:block" />
                                        <span className="text-gray-400 hidden md:inline">
                                            {t('member_since', { year: memberYear })}
                                        </span>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex gap-2 pb-4">
                            <button
                                onClick={handleShare}
                                className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10"
                                title={t('share_profile')}
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            {vendor.website && (
                                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10" title={t('visit_website')}>
                                    <Globe className="w-5 h-5" />
                                </a>
                            )}
                            {vendor.instagram && (
                                <a href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10" title="Instagram">
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ SECTION 2: STICKY NAVIGATION ═══════════════ */}
            <div className={`sticky top-20 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 transition-all duration-300 ${isHeaderSticky ? 'shadow-md py-2' : 'py-3'}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 flex-nowrap min-w-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => scrollToSection(tab.id)}
                                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Desktop Contact CTA */}
                    {vendor.whatsapp_number && (
                        <a
                            href={`https://wa.me/${vendor.whatsapp_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all hover:scale-105"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{t('inquire_whatsapp')}</span>
                        </a>
                    )}
                </div>
            </div>

            {/* ═══════════════ SECTION 3: TRUST BAR ═══════════════ */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {/* Events Count */}
                    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 text-center shadow-sm">
                        <div className="text-2xl md:text-3xl font-black text-gray-900" dir="ltr">
                            {vendor.events?.length || 0}
                        </div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                            {t('events_hosted')}
                        </p>
                    </div>

                    {/* Rating */}
                    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 text-center shadow-sm">
                        <div className="text-2xl md:text-3xl font-black text-gray-900 flex items-center justify-center gap-1" dir="ltr">
                            {vendor.rating && vendor.rating.count > 0 ? (
                                <>
                                    <Star className="w-5 h-5 md:w-6 md:h-6 text-amber-400 fill-amber-400" />
                                    {vendor.rating.average.toFixed(1)}
                                </>
                            ) : (
                                <span className="text-lg md:text-xl text-primary">✨</span>
                            )}
                        </div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                            {vendor.rating && vendor.rating.count > 0 ? t('rating_label') : t('new_vendor')}
                        </p>
                    </div>

                    {/* Status */}
                    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 text-center shadow-sm">
                        <div className="text-2xl md:text-3xl font-black text-gray-900 flex items-center justify-center">
                            {isVerified ? (
                                <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" />
                            ) : memberYear ? (
                                <span className="text-lg md:text-xl" dir="ltr">{memberYear}</span>
                            ) : (
                                <span className="text-lg md:text-xl text-primary">🚀</span>
                            )}
                        </div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                            {isVerified ? t('verified_partner') : memberYear ? t('joined_title') : t('new_vendor')}
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══════════════ SECTION 4: FEATURED REVIEW (if available) ═══════════════ */}
            {featuredReview && (
                <div className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm overflow-hidden"
                    >
                        {/* Decorative quote */}
                        <Quote className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-14 md:h-14 text-primary/5 rtl:right-auto rtl:left-4 md:rtl:left-6" />

                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">{t('featured_review')}</p>
                            <p className="text-base md:text-lg font-semibold text-gray-800 leading-relaxed mb-4 italic">
                                &ldquo;{featuredReview.comment}&rdquo;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center shrink-0">
                                    <span className="text-xs font-black text-primary">
                                        {(featuredReview.profiles?.full_name || 'U')[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{featuredReview.profiles?.full_name || 'Guest'}</p>
                                    {featuredReview.events?.title && (
                                        <p className="text-xs text-gray-400 truncate">{featuredReview.events.title}</p>
                                    )}
                                </div>
                                <StarRating rating={featuredReview.rating} size="sm" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ═══════════════ MAIN CONTENT AREA ═══════════════ */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 space-y-12 md:space-y-20" ref={contentRef}>

                {/* ═══════════════ SECTION 5: EVENTS CATALOG ═══════════════ */}
                <div id="events" className="scroll-mt-32">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                                {t('upcoming_events')}
                                {hasEvents && (
                                    <span className="ml-2 rtl:ml-0 rtl:mr-2 text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full align-middle">
                                        {vendor.events.length}
                                    </span>
                                )}
                            </h2>
                        </div>
                        {hasEvents && (
                            <Link href="/events" className="hidden md:flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                                {t('explore_all')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    {hasEvents && (
                        <div className="mb-6 md:mb-8">
                            <VendorEventFilters compact vendorId={vendor.id} />
                        </div>
                    )}

                    {hasEvents ? (
                        <>
                            {/* Filtered count if filters active */}
                            {(filters.search || filters.category || filters.district) && (
                                <div className="mb-4 text-sm text-gray-600">
                                    <span className="font-bold">
                                        {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
                                    </span>
                                    {filteredEvents.length < vendor.events.length && (
                                        <span className="text-gray-400 ml-2 rtl:ml-0 rtl:mr-2">
                                            (out of {vendor.events.length} total)
                                        </span>
                                    )}
                                </div>
                            )}

                            {filteredEvents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                                    {filteredEvents.map((event: any, i: number) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: Math.min(i * 0.08, 0.3) }}
                                            className="h-full"
                                        >
                                            <EventCard event={event} isFavoriteInitial={false} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
                                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-base font-bold text-gray-900">No events match your filters</h3>
                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
                                    <button
                                        onClick={() => router.push('?', { scroll: false })}
                                        className="mt-4 px-5 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-colors"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl p-10 md:p-14 text-center border border-gray-100 shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-primary/50" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('no_upcoming_events')}</h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">{t('stay_tuned')}</p>
                            {vendor.instagram && (
                                <a
                                    href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                                >
                                    <Instagram className="w-4 h-4" />
                                    {t('follow_instagram')}
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══════════════ SECTION 6: GALLERY (only if items exist) ═══════════════ */}
                {hasGallery && (
                    <div id="gallery" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="p-2 bg-rose-50 rounded-xl text-rose-500"><ImageIcon className="w-5 h-5" /></div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t('gallery_tab')}</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 auto-rows-[160px] md:auto-rows-[200px]">
                            {vendor.gallery.map((img: any, idx: number) => {
                                const isLarge = idx === 0;
                                return (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        onClick={() => setLightboxIndex(idx)}
                                        className={`relative group overflow-hidden rounded-xl md:rounded-2xl bg-gray-200 cursor-pointer ${isLarge ? 'col-span-2 row-span-2' : ''}`}
                                    >
                                        <Image
                                            src={img.image_url}
                                            alt={img.caption || 'Gallery'}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══════════════ SECTION 7: REVIEWS (only if reviews exist) ═══════════════ */}
                {hasReviews && (
                    <div id="reviews" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-500"><Star className="w-5 h-5 fill-current" /></div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t('reviews_tab')}</h2>
                            {vendor.rating?.count > 0 && (
                                <span className="text-sm font-bold text-gray-500">({vendor.rating.count})</span>
                            )}
                        </div>

                        <div className="space-y-5">
                            {/* Rating Summary Card */}
                            {vendor.rating && vendor.rating.count > 0 && (() => {
                                const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                                vendor.reviews.forEach((r: any) => {
                                    const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
                                    if (dist[rounded] !== undefined) dist[rounded]++;
                                });
                                const total = vendor.rating.count;

                                return (
                                    <div className="bg-white border border-gray-100 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm">
                                        <div className="flex flex-row gap-4 md:gap-8 items-center">
                                            <div className="flex flex-col items-center justify-center shrink-0">
                                                <div className="text-3xl md:text-5xl font-black text-gray-900 mb-1" dir="ltr">
                                                    {vendor.rating.average.toFixed(1)}
                                                </div>
                                                <StarRating rating={vendor.rating.average} size="sm" />
                                                <p className="text-[9px] md:text-xs font-black text-gray-500 uppercase tracking-widest mt-2">
                                                    {vendor.rating.count} {vendor.rating.count === 1 ? 'review' : 'reviews'}
                                                </p>
                                            </div>
                                            <div className="flex-1 space-y-1.5 md:space-y-2">
                                                <p className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                                    {t('rating_distribution')}
                                                </p>
                                                {[5, 4, 3, 2, 1].map((rating) => {
                                                    const count = dist[rating as keyof typeof dist] || 0;
                                                    const percentage = (count / total) * 100;
                                                    return (
                                                        <div key={rating} className="flex items-center gap-1.5 md:gap-3">
                                                            <div className="flex items-center gap-0.5 w-8 md:w-14 justify-end" dir="ltr">
                                                                <span className="text-[10px] md:text-xs font-black text-gray-700">{rating}</span>
                                                                <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-400 fill-amber-400" />
                                                            </div>
                                                            <div className="flex-1 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 rounded-full"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] md:text-xs font-bold text-gray-500 w-5 md:w-8 text-left" dir="ltr">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Review Cards */}
                            <div className="space-y-3">
                                {vendor.reviews.map((review: any) => (
                                    <div key={review.id} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center shrink-0">
                                                <span className="text-xs font-black text-primary">
                                                    {(review.profiles?.full_name || 'U')[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-sm text-gray-900 truncate">
                                                        {review.profiles?.full_name || 'Anonymous'}
                                                    </p>
                                                    <span className="text-[10px] md:text-xs text-gray-400 shrink-0">
                                                        {new Date(review.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="mt-0.5">
                                                    <StarRating rating={review.rating} size="sm" />
                                                </div>
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-gray-700 leading-relaxed font-medium mb-2">{review.comment}</p>
                                        )}
                                        {review.events?.title && (
                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                                                <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                                <span className="text-[10px] md:text-xs font-bold text-gray-400 truncate">{review.events.title}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════ SECTION 8: ABOUT & LOCATION ═══════════════ */}
                <div id="about" className="scroll-mt-32">
                    <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500"><CheckCircle className="w-5 h-5" /></div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t('about_vendor', { name: vendor.business_name })}</h2>
                        </div>

                        <div className="grid md:grid-cols-12 gap-6 md:gap-10">
                            {/* Description + Social Links */}
                            <div className="md:col-span-7 space-y-6">
                                <div className="prose prose-lg text-gray-600 font-medium leading-relaxed max-w-none">
                                    {vendor.description_ar || t('mission_default')}
                                </div>

                                {/* Social Links Row */}
                                <div className="flex flex-wrap gap-2">
                                    {vendor.instagram && (
                                        <a
                                            href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-xl text-sm font-bold hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-100"
                                        >
                                            <Instagram className="w-4 h-4" />
                                            {t('follow_instagram')}
                                        </a>
                                    )}
                                    {vendor.website && (
                                        <a
                                            href={vendor.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors border border-gray-100"
                                        >
                                            <Globe className="w-4 h-4" />
                                            {t('visit_website')}
                                        </a>
                                    )}
                                </div>

                                {/* Member since */}
                                {memberYear && (
                                    <p className="text-sm text-gray-400 font-medium">{t('member_since', { year: memberYear })}</p>
                                )}
                            </div>

                            {/* Location Sidebar */}
                            <div className="md:col-span-5 space-y-4">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-3">{t('location_title')}</h4>
                                    {vendor.location_lat && vendor.location_long ? (
                                        <div className="space-y-3">
                                            <div className="relative h-[180px] w-full rounded-xl overflow-hidden border border-gray-200">
                                                <Image
                                                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${vendor.location_lat},${vendor.location_long}&zoom=15&size=400x200&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&markers=color:0x2CA58D%7C${vendor.location_lat},${vendor.location_long}&style=feature:all|element:all|saturation:-20|lightness:10`}
                                                    alt="Location"
                                                    fill
                                                    className="object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="flex items-start gap-2 text-gray-600 text-sm">
                                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span>{vendor.location_name || ''}</span>
                                                    {vendor.location_details && (
                                                        <span className="text-xs text-gray-500 italic mt-0.5">{vendor.location_details}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${vendor.location_lat},${vendor.location_long}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {t('get_directions')}
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2 text-gray-600 text-sm">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>{vendor.location_name || t('online_location')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ SECTION 9: CTA FOOTER ═══════════════ */}
                {(vendor.whatsapp_number || vendor.instagram) && (
                    <div className="pb-8 md:pb-16">
                        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl md:rounded-3xl p-8 md:p-12 text-center overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-black text-white mb-2">{t('interested_booking')}</h3>
                                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">{t('contact_us')}</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    {vendor.whatsapp_number && (
                                        <a
                                            href={`https://wa.me/${vendor.whatsapp_number}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            {t('inquire_whatsapp')}
                                        </a>
                                    )}
                                    {vendor.instagram && (
                                        <a
                                            href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-bold text-sm hover:bg-white/20 transition-colors border border-white/20"
                                        >
                                            <Instagram className="w-5 h-5" />
                                            {t('follow_instagram')}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ═══════════════ SECTION 10: MOBILE BOTTOM BAR ═══════════════ */}
            <div className="fixed bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-lg border-t border-gray-200 md:hidden z-[60] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                {(vendor.whatsapp_number || vendor.instagram || vendor.website) ? (
                    <div className="flex items-center gap-2">
                        {vendor.instagram && (
                            <a
                                href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl active:scale-95 transition-transform shadow-md"
                                title="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        )}
                        {vendor.website && (
                            <a
                                href={vendor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center h-12 bg-gray-100 text-gray-900 rounded-xl active:scale-95 transition-transform border border-gray-200"
                                title={t('visit_website')}
                            >
                                <Globe className="w-5 h-5" />
                            </a>
                        )}
                        {vendor.whatsapp_number && (
                            <a
                                href={`https://wa.me/${vendor.whatsapp_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-2 h-12 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform ${(vendor.instagram || vendor.website) ? 'flex-[2]' : 'flex-[3]'}`}
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm">{t('inquire_whatsapp')}</span>
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <p className="text-xs text-gray-500 font-medium">
                            {isRTL ? 'لم يتم توفير معلومات الاتصال' : 'No contact information available'}
                        </p>
                    </div>
                )}
            </div>

            {/* ═══════════════ LIGHTBOX MODAL ═══════════════ */}
            {lightboxIndex !== null && hasGallery && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
                    >
                        <X className="w-7 h-7" />
                    </button>

                    {lightboxIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors z-10"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                    )}

                    {lightboxIndex < vendor.gallery.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors z-10"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    )}

                    <div className="relative w-[90vw] h-[80vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={vendor.gallery[lightboxIndex].image_url}
                            alt={vendor.gallery[lightboxIndex].caption || 'Gallery'}
                            fill
                            className="object-contain"
                            sizes="90vw"
                        />
                    </div>

                    {/* Counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium" dir="ltr">
                        {lightboxIndex + 1} / {vendor.gallery.length}
                    </div>
                </div>
            )}

        </div>
    );
}
