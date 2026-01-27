'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, Star, Instagram, Globe, CheckCircle, Image as ImageIcon, Calendar, ArrowRight, Share2 } from 'lucide-react';
import EventCard from '@/components/events/EventCard';
import { Link } from '@/navigation';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import VendorEventFilters from '@/components/vendor/VendorEventFilters';
import { calculateDistance } from '@/utils/distance';

export default function VendorProfileClient({ vendor }: { vendor: any }) {
    const t = useTranslations('VendorProfile');
    const tVendor = useTranslations('Vendor');
    const locale = useLocale();
    const [activeTab, setActiveTab] = useState<'events' | 'gallery' | 'about'>('events');
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        district: '',
        userLat: undefined as number | undefined,
        userLng: undefined as number | undefined,
    });

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
            const offset = 120; // sticky header height
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
        setActiveTab(id as any);
    };

    // Filter events based on current filters
    const filteredEvents = useMemo(() => {
        if (!vendor.events || vendor.events.length === 0) return [];

        let result = vendor.events.filter((event: any) => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const titleMatch = event.title?.toLowerCase().includes(searchLower);
                const descMatch = event.description?.toLowerCase().includes(searchLower);
                if (!titleMatch && !descMatch) return false;
            }

            // Category filter
            if (filters.category && event.category_id) {
                // Need to check if event's category slug matches
                if (event.category?.slug !== filters.category) return false;
            }

            // District filter
            if (filters.district && event.district !== filters.district) {
                return false;
            }

            return true;
        });

        // Sort by distance if user location is available
        if (filters.userLat && filters.userLng) {
            result = result
                .map((event: any) => {
                    // Calculate distance if event has location
                    if (event.location_lat && event.location_long) {
                        const distance = calculateDistance(
                            filters.userLat!,
                            filters.userLng!,
                            event.location_lat,
                            event.location_long
                        );
                        return { ...event, _distance: distance };
                    }
                    // Events without location go to the end
                    return { ...event, _distance: Infinity };
                })
                .sort((a: any, b: any) => a._distance - b._distance);
        }

        return result;
    }, [vendor.events, filters]);

    const handleFilterChange = useCallback((newFilters: {
        search: string;
        category: string;
        district: string;
        userLat?: number;
        userLng?: number;
    }) => {
        setFilters({
            search: newFilters.search,
            category: newFilters.category,
            district: newFilters.district,
            userLat: newFilters.userLat,
            userLng: newFilters.userLng,
        });
    }, []);

    const hasEvents = vendor.events && vendor.events.length > 0;
    const hasGallery = vendor.gallery && vendor.gallery.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 relative">

            {/* 1. Immersive Hero Section */}
            <div ref={heroRef} className="relative h-[40vh] md:h-[50vh] min-h-[350px] overflow-hidden bg-gray-900 group">
                {/* Cover Image */}
                {vendor.cover_image ? (
                    <Image
                        src={vendor.cover_image}
                        alt="Cover"
                        fill
                        className="object-cover opacity-90 transition-transform duration-[20s] ease-in-out group-hover:scale-110"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-20" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

                {/* Content Container */}
                <div className="absolute inset-0 flex flex-col justify-end pb-8 md:pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left md:rtl:text-right">

                        {/* Logo - Floating & Elevated */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative w-28 h-28 md:w-40 md:h-40 shrink-0 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white -mb-16 md:mb-0 z-20"
                        >
                            <Image
                                src={vendor.company_logo || '/images/logo_nav.png'}
                                alt={vendor.business_name}
                                fill
                                className="object-cover"
                            />
                        </motion.div>

                        {/* Title & Stats */}
                        <div className="flex-1 pb-2 md:pb-4 space-y-3 relative z-10 w-full">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-wrap items-center justify-center md:justify-start gap-3"
                            >
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {vendor.category?.name_en || vendor.category?.name_ar || tVendor('cat_cultural')}
                                </span>
                                {vendor.status === 'approved' && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/30">
                                        <CheckCircle className="w-3.5 h-3.5 fill-current" />
                                        <span>{t('stats.vetted_quality')}</span>
                                    </span>
                                )}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-sm"
                            >
                                {vendor.business_name}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs md:text-sm font-medium text-gray-300"
                            >
                                {vendor.district && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{vendor.district}, {tVendor('districts.' + vendor.district) || vendor.district}</span>
                                    </div>
                                )}
                                <div className="w-1 h-1 rounded-full bg-gray-600 hidden md:block" />
                                <div className="flex items-center gap-1.5 text-amber-400">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-white font-bold">
                                        {t.rich('elite_rating', {
                                            rating: vendor.rating || '4.9'
                                        })}
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex gap-3 pb-4">
                            <button className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10" title="Share">
                                <Share2 className="w-5 h-5" />
                            </button>
                            {vendor.website && (
                                <a href={vendor.website} target="_blank" className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10" title="Website">
                                    <Globe className="w-5 h-5" />
                                </a>
                            )}
                            {vendor.instagram && (
                                <a href={`https://instagram.com/${vendor.instagram}`} target="_blank" className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10" title="Instagram">
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Sticky Navigation Bar */}
            <div className={`sticky top-20 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 transition-all duration-300 ${isHeaderSticky ? 'shadow-md py-2' : 'py-3'}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-1 md:gap-6 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <button
                            onClick={() => scrollToSection('events')}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'events' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            {t('active_catalog')}
                        </button>
                        <button
                            onClick={() => scrollToSection('gallery')}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'gallery' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            {t('view_gallery')}
                        </button>
                        <button
                            onClick={() => scrollToSection('about')}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'about' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            {t('our_mission')}
                        </button>
                    </div>

                    {/* Desktop Contact CTA */}
                    {vendor.whatsapp_number && (
                        <a
                            href={`https://wa.me/${vendor.whatsapp_number}`}
                            target="_blank"
                            className="hidden md:flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all hover:scale-105"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{t('inquire_whatsapp')}</span>
                        </a>
                    )}
                </div>
            </div>

            {/* 3. Main Content Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-16 md:space-y-24" ref={contentRef}>

                {/* Section: Events */}
                <div id="events" className="scroll-mt-32">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t('active_catalog')}</h2>
                            <p className="text-gray-500 text-sm mt-1">{vendor.events?.length ? 'Book your next experience' : 'Stay tuned for upcoming events'}</p>
                        </div>
                        {hasEvents && (
                            <Link href="/events" className="hidden md:flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                                View all <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>

                    {/* Filters Section */}
                    {hasEvents && (
                        <div className="mb-8 md:mb-12">
                            <VendorEventFilters onFilterChange={handleFilterChange} />
                        </div>
                    )}

                    {hasEvents ? (
                        <>
                            {/* Show filtered count if filters are active */}
                            {(filters.search || filters.category || filters.district) && (
                                <div className="mb-6 text-sm text-gray-600">
                                    <span className="font-bold">
                                        {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
                                    </span>
                                    {filteredEvents.length < vendor.events.length && (
                                        <span className="text-gray-400 ml-2">
                                            (out of {vendor.events.length} total)
                                        </span>
                                    )}
                                </div>
                            )}

                            {filteredEvents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                    {filteredEvents.map((event: any, i: number) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="h-full"
                                        >
                                            <EventCard event={event} isFavoriteInitial={false} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900">No events match your filters</h3>
                                    <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                                    <button
                                        onClick={() => setFilters({ search: '', category: '', district: '', userLat: undefined, userLng: undefined })}
                                        className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-colors"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No events scheduled</h3>
                            <p className="text-gray-500">Enable email notifications to know when they post.</p>
                        </div>
                    )}
                </div>

                {/* Section: Gallery */}
                <div id="gallery" className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <div className="p-2 bg-rose-50 rounded-xl text-rose-500"><ImageIcon className="w-6 h-6" /></div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t('view_gallery')}</h2>
                    </div>

                    {hasGallery ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 md:h-[600px] auto-rows-[200px] md:auto-rows-auto">
                            {vendor.gallery.slice(0, 6).map((img: any, idx: number) => {
                                // Masonry Logic: 1st image is large on desktop
                                const isLarge = idx === 0;
                                return (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className={`relative group overflow-hidden rounded-2xl md:rounded-3xl bg-gray-200 ${isLarge ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''}`}
                                    >
                                        <Image
                                            src={img.image_url}
                                            alt={img.caption || 'Gallery'}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] p-8 text-center border border-gray-200">
                            <p className="text-gray-400 font-bold">More photos coming soon.</p>
                        </div>
                    )}
                </div>

                {/* Section: About */}
                <div id="about" className="scroll-mt-32 pb-20">
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/50">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500"><CheckCircle className="w-6 h-6" /></div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t('our_mission')}</h2>
                        </div>

                        <div className="grid md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-8">
                                <div className="prose prose-lg text-gray-600 font-medium leading-relaxed">
                                    {vendor.description_ar || t('mission_default')}
                                </div>
                            </div>
                            <div className="md:col-span-4 space-y-4">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2">Location</h4>
                                    {vendor.district ? (
                                        <div className="flex items-start gap-2 text-gray-600 text-sm">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>{vendor.district}, Istanbul<br />Turkey</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Online / Various Locations</span>
                                    )}
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2">Joined</h4>
                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>Since 2024</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* 4. Mobile Sticky Bottom Bar - Higher z-index to appear above global nav */}
            <div className="fixed bottom-0 inset-x-0 p-3 md:p-4 bg-white/95 backdrop-blur-lg border-t border-gray-200 md:hidden z-[60] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                {/* Check if vendor has any contact info */}
                {(vendor.whatsapp_number || vendor.instagram || vendor.website) ? (
                    <div className="flex items-center gap-2">
                        {/* Instagram Button */}
                        {vendor.instagram && (
                            <a
                                href={`https://instagram.com/${vendor.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl active:scale-95 transition-transform shadow-md"
                                title="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        )}

                        {/* Website Button */}
                        {vendor.website && (
                            <a
                                href={vendor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center h-12 bg-gray-100 text-gray-900 rounded-xl active:scale-95 transition-transform border-2 border-gray-200"
                                title="Website"
                            >
                                <Globe className="w-5 h-5" />
                            </a>
                        )}

                        {/* WhatsApp Button - Primary */}
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
                    /* Fallback if no contact info */
                    <div className="text-center py-2">
                        <p className="text-xs text-gray-500 font-medium">
                            {locale === 'ar' ? 'لم يتم توفير معلومات الاتصال' : 'No contact information available'}
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
