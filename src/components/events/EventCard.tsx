'use client';

import { Heart, Star, AlertCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/navigation';
import { useState } from 'react';
import { toggleFavoriteEvent } from '@/actions/user';
import { useRouter } from 'next/navigation';
import { getEventStatus, EventStatus } from '@/utils/eventStatus';
import { useTranslations } from 'next-intl';

interface EventCardProps {
    event: any;
    isFavoriteInitial: boolean;
}

export default function EventCard({ event, isFavoriteInitial }: EventCardProps) {
    const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('Events');

    // Calculate event status
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

    return (
        <div className={`group relative bg-white rounded-xl md:rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl md:hover:-translate-y-2 transition-all duration-300 h-full ${isExpired ? 'grayscale opacity-75' : ''}`}>
            <Link href={`/events/${event.slug || event.id}`} className="flex flex-col h-full">
                {/* Image Container - Compact on mobile */}
                <div className="relative w-full h-40 md:aspect-square overflow-hidden bg-gray-50 shrink-0">
                    {event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover md:transition-transform md:duration-700 md:group-hover:scale-110"
                            loading="lazy"
                            quality={75}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 font-bold uppercase tracking-widest text-[10px]">
                            No Image
                        </div>
                    )}

                    {/* Floating Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Status Badge - Expired or Sold Out */}
                    {(isExpired || isSoldOut) && (
                        <div className={`absolute top-2 left-2 md:top-3 md:left-3 z-10 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 ${isExpired
                            ? 'bg-red-500 text-white'
                            : 'bg-amber-500 text-white'
                            }`}>
                            {isExpired ? (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    <span>{t('status_expired')}</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{t('status_sold_out')}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Favorite Button */}
                    <button
                        onClick={handleToggleFavorite}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        className="absolute top-2 right-2 md:top-3 md:right-3 z-10 p-2 md:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all group/fav shadow-sm"
                    >
                        <Heart
                            className={`w-4 h-4 md:w-5 md:h-5 transition-all ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600 group-hover/fav:text-rose-500'}`}
                        />
                    </button>

                    {/* Type Badge - Positioned at bottom on mobile (only show if not expired/sold out) */}
                    {!isExpired && !isSoldOut && (
                        <div className="absolute bottom-2 left-2 md:top-3 md:left-3 md:bottom-auto px-2.5 py-1.5 md:px-3 md:py-1.5 bg-white/95 backdrop-blur-md rounded-lg md:rounded-xl text-[10px] md:text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm flex items-center gap-1 md:gap-1.5">
                            <span className="text-sm md:text-sm">{event.category_icon || event.category?.icon || '✨'}</span>
                            <span className="inline">{event.category_name_en || event.category?.name_en || event.category?.name_ar || 'Event'}</span>
                        </div>
                    )}
                </div>

                {/* Content - Compact padding on mobile */}
                <div className="p-3 md:p-4 flex-1 flex flex-col" dir="rtl">
                    <div className="mb-2 text-right">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                            {event.title}
                        </h3>
                    </div>

                    <div className="space-y-1.5 mb-auto text-right">
                        <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 flex-row-reverse justify-start">
                            <span className="w-1.5 h-1.5 md:w-1.5 md:h-1.5 rounded-full bg-primary/60 shrink-0" />
                            <span className="truncate">
                                {event.district && event.city
                                    ? `${event.district}, ${event.city}`
                                    : (event.district || event.city || event.location_name || t('default_location'))}
                            </span>
                        </p>
                        <p className={`text-xs md:text-sm font-bold ${isExpired ? 'text-red-400' : 'text-gray-400'} flex items-center gap-1.5 flex-row-reverse justify-start`}>
                            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span dir="ltr">
                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                        </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-gray-100 mt-4 flex-row-reverse">
                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-2 md:px-3 md:py-2 rounded-xl md:rounded-xl border transition-all duration-300 ${isExpired || isSoldOut
                                ? 'bg-gray-100 border-gray-200'
                                : 'bg-primary/10 border-primary/10 group-hover:bg-primary group-hover:border-primary group-hover:shadow-md group-hover:shadow-primary/20'
                                }`}>
                                <span className={`text-base md:text-lg font-black transition-colors ${isExpired || isSoldOut
                                    ? 'text-gray-400'
                                    : 'text-primary group-hover:text-white'
                                    }`}>
                                    {(() => {
                                        const displayPrice = (event.tickets && event.tickets.length > 0)
                                            ? Math.min(...event.tickets.map((t: any) => t.price))
                                            : event.price;
                                        return displayPrice > 0 ? `${displayPrice} ₺` : 'Free';
                                    })()}
                                </span>
                            </div>
                        </div>

                        {/* Status badge in footer - show expired/sold out or NEW */}
                        {isExpired ? (
                            <div className="flex items-center gap-1 text-[10px] md:text-[10px] font-black text-red-600 bg-red-50 px-2.5 py-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-red-100/50">
                                <XCircle className="w-3 h-3 md:w-3 md:h-3" />
                                <span className="inline">{t('status_expired')}</span>
                            </div>
                        ) : isSoldOut ? (
                            <div className="flex items-center gap-1 text-[10px] md:text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-amber-100/50">
                                <AlertCircle className="w-3 h-3 md:w-3 md:h-3" />
                                <span className="inline">{t('status_sold_out')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-emerald-100/50">
                                <Star className="w-3 h-3 md:w-3 md:h-3 fill-current" />
                                <span className="inline">NEW</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}

