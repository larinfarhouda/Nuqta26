'use client';

import { Heart, Star } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/navigation';
import { useState } from 'react';
import { toggleFavoriteEvent } from '@/actions/user';
import { useRouter } from 'next/navigation';

interface EventCardProps {
    event: any;
    isFavoriteInitial: boolean;
}

export default function EventCard({ event, isFavoriteInitial }: EventCardProps) {
    const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;

        const newState = !isFavorite;
        setIsFavorite(newState);
        setIsLoading(true);

        const result = await toggleFavoriteEvent(event.id, isFavorite);
        if (result?.error) {
            setIsFavorite(!newState);
            if (result.error === 'Unauthorized') {
                router.push('/login');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="group relative bg-white rounded-xl md:rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl md:hover:-translate-y-2 transition-all duration-300 h-full">
            <Link href={`/events/${event.id}`} className="flex flex-col h-full">
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

                    {/* Favorite Button */}
                    <button
                        onClick={handleToggleFavorite}
                        className="absolute top-2 right-2 md:top-3 md:right-3 z-10 p-2 md:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all group/fav shadow-sm"
                    >
                        <Heart
                            className={`w-4 h-4 md:w-5 md:h-5 transition-all ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600 group-hover/fav:text-rose-500'}`}
                        />
                    </button>

                    {/* Type Badge - Positioned at bottom on mobile */}
                    <div className="absolute bottom-2 left-2 md:top-3 md:left-3 md:bottom-auto px-2.5 py-1.5 md:px-3 md:py-1.5 bg-white/95 backdrop-blur-md rounded-lg md:rounded-xl text-[10px] md:text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm flex items-center gap-1 md:gap-1.5">
                        <span className="text-sm md:text-sm">{event.category_icon || '✨'}</span>
                        <span className="inline">{event.category_name_en || event.category || 'Event'}</span>
                    </div>
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
                                    : (event.district || event.city || event.location_name || 'Istanbul')}
                            </span>
                        </p>
                        <p className="text-xs md:text-sm font-bold text-gray-400">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-gray-100 mt-4 flex-row-reverse">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 px-3 py-2 md:px-3 md:py-2 rounded-xl md:rounded-xl border border-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:shadow-md group-hover:shadow-primary/20">
                                <span className="text-base md:text-lg font-black text-primary group-hover:text-white transition-colors">
                                    {(() => {
                                        const displayPrice = (event.tickets && event.tickets.length > 0)
                                            ? Math.min(...event.tickets.map((t: any) => t.price))
                                            : event.price;
                                        return displayPrice > 0 ? `${displayPrice} ₺` : 'Free';
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-emerald-100/50">
                            <Star className="w-3 h-3 md:w-3 md:h-3 fill-current" />
                            <span className="inline">NEW</span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
