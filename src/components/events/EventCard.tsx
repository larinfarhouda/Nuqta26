'use client';

import { Heart, Star, AlertCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Link, useRouter } from '@/navigation';
import { useState } from 'react';
import { toggleFavoriteEvent } from '@/actions/user';
import { getEventStatus } from '@/utils/eventStatus';
import { useTranslations, useLocale } from 'next-intl';
import { useCountryName } from '@/hooks/useCountry';
import TierBadge from '@/components/TierBadge';
import type { SubscriptionTier } from '@/lib/constants/subscription';
import { getCurrencySymbol } from '@/utils/country-helpers';
import { motion } from 'framer-motion';

interface EventCardProps {
    event: any;
    isFavoriteInitial: boolean;
    index?: number;
}

export default function EventCard({ event, isFavoriteInitial, index = 0 }: EventCardProps) {
    const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('Events');
    const locale = useLocale();
    const countryName = useCountryName();
    const isRTL = locale === 'ar';

    const eventStatus = getEventStatus(event);
    const isExpired = eventStatus === 'expired';
    const isSoldOut = eventStatus === 'sold_out';

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;

        const newState = !isFavorite;
        setIsFavorite(newState);
        setIsLoading(true);

        try {
            const result = await toggleFavoriteEvent(event.id, isFavorite);
            if (result?.error) {
                setIsFavorite(!newState);
                if (result.error === 'Unauthorized') {
                    router.push('/login');
                }
            }
        } catch (error) {
            console.error('Favorite toggle error:', error);
            setIsFavorite(!newState);
        } finally {
            setIsLoading(false);
        }
    };

    const displayPrice = (() => {
        const price = (event.tickets && event.tickets.length > 0)
            ? Math.min(...event.tickets.map((t: any) => t.price))
            : event.price;
        return price > 0 ? `${price} ${getCurrencySymbol(event.country)}` : 'Free';
    })();

    const eventDate = new Date(event.date);

    const handleCardClick = () => {
        router.push(`/events/${event.slug || event.id}` as any);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
            className={`group relative bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl md:hover:-translate-y-1 transition-all duration-300 h-full cursor-pointer ${isExpired ? 'opacity-60' : ''}`}
            onClick={handleCardClick}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        >
            <div className="flex flex-col h-full">
                {/* Image — taller on mobile for immersive feel */}
                <div className="relative w-full aspect-[4/3] md:aspect-square overflow-hidden bg-gray-50 shrink-0">
                    {event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                            className={`object-cover md:transition-transform md:duration-500 md:group-hover:scale-105 ${isExpired ? 'grayscale' : ''}`}
                            loading="lazy"
                            quality={75}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-primary/30">
                            <span className="text-4xl">📅</span>
                        </div>
                    )}

                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

                    {/* Status Badge — top left */}
                    {(isExpired || isSoldOut) && (
                        <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} z-10 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 ${
                            isExpired ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                            {isExpired ? (
                                <><XCircle className="w-3 h-3" /><span>{t('status_expired')}</span></>
                            ) : (
                                <><AlertCircle className="w-3 h-3" /><span>{t('status_sold_out')}</span></>
                            )}
                        </div>
                    )}

                    {/* Category chip — top left (when no status badge) */}
                    {!isExpired && !isSoldOut && (
                        <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} z-10`}>
                            <div className="px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-accent shadow-sm flex items-center gap-1">
                                <span className="text-sm">{event.category_icon || event.category?.icon || '✨'}</span>
                                <span>{event.category_name_en || event.category?.name_en || event.category?.name_ar || 'Event'}</span>
                            </div>
                        </div>
                    )}

                    {/* Favorite button — top right */}
                    <motion.button
                        onClick={handleToggleFavorite}
                        whileTap={{ scale: 0.8 }}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} z-10 p-2.5 rounded-full transition-all shadow-sm ${
                            isFavorite ? 'bg-rose-500' : 'bg-white/90 backdrop-blur-sm'
                        }`}
                    >
                        <Heart
                            className={`w-4 h-4 transition-all ${
                                isFavorite ? 'fill-white text-white' : 'text-gray-600'
                            }`}
                        />
                    </motion.button>

                    {/* Price pill — bottom right of image */}
                    <div className={`absolute bottom-3 ${isRTL ? 'left-3' : 'right-3'} z-10`}>
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-black shadow-md ${
                            isExpired || isSoldOut
                                ? 'bg-gray-100/90 text-gray-400'
                                : displayPrice === 'Free'
                                    ? 'bg-primary text-white'
                                    : 'bg-white/95 backdrop-blur-sm text-accent'
                        }`}>
                            {displayPrice}
                        </div>
                    </div>

                    {/* Tier Badge */}
                    {event.vendors?.subscription_tier && (
                        <div className={`absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'} z-10 hidden md:block`}>
                            <TierBadge
                                tier={event.vendors.subscription_tier as SubscriptionTier}
                                size="sm"
                                showLabel={true}
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-3.5 md:p-4 flex-1 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
                    {/* Title */}
                    <h3 className="text-base md:text-lg font-bold text-accent line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-1">
                        {event.title}
                    </h3>

                    {/* Vendor name — clickable to vendor profile */}
                    {event.vendor_name && (
                        <p className="text-[11px] md:text-xs font-semibold text-accent/40 mb-2 truncate">
                            {event.vendor_slug ? (
                                <Link
                                    href={`/v/${event.vendor_slug}`}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    className="hover:text-primary transition-colors"
                                >
                                    by {event.vendor_name}
                                </Link>
                            ) : (
                                <span>by {event.vendor_name}</span>
                            )}
                        </p>
                    )}

                    {/* Location & Date */}
                    <div className="space-y-1.5 mb-auto">
                        <p className="text-xs md:text-sm font-semibold text-accent/50 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                            <span className="truncate">
                                {event.district && event.city
                                    ? `${event.district}, ${event.city}`
                                    : (event.district || event.city || event.location_name || t('default_location', { country: countryName }))}
                            </span>
                        </p>
                        <p className={`text-xs md:text-sm font-semibold ${isExpired ? 'text-red-400' : 'text-accent/35'} flex items-center gap-1.5`}>
                            <span>{eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <span dir="ltr">
                                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })}
                            </span>
                        </p>
                    </div>

                    {/* Footer status */}
                    <div className="pt-3 mt-3 border-t border-gray-50 flex items-center justify-between">
                        {isExpired ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg">
                                <XCircle className="w-3 h-3" />
                                <span>{t('status_expired')}</span>
                            </div>
                        ) : isSoldOut ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                                <AlertCircle className="w-3 h-3" />
                                <span>{t('status_sold_out')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10">
                                <Star className="w-3 h-3 fill-current" />
                                <span>NEW</span>
                            </div>
                        )}

                        {/* View arrow */}
                        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-primary group-hover:shadow-md group-hover:shadow-primary/20 flex items-center justify-center transition-all duration-300">
                            <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d={isRTL ? "M19 12H5M12 5l-7 7 7 7" : "M5 12h14M12 5l7 7-7 7"} />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
