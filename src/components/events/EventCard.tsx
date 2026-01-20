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
        <div className="group relative bg-white rounded-2xl md:rounded-3xl p-2 md:p-3 border border-gray-100 shadow-sm hover:shadow-2xl md:hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
            <Link href={`/events/${event.id}`} className="flex flex-col h-full">
                {/* Image Container */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl md:rounded-2xl bg-gray-50 mb-3 md:mb-4 shrink-0">
                    {event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover md:transition-transform md:duration-700 md:group-hover:scale-110"
                            loading="lazy"
                            quality={75}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">
                            No Image
                        </div>
                    )}

                    {/* Floating Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Favorite Button */}
                    <button
                        onClick={handleToggleFavorite}
                        className="absolute top-2 right-2 md:top-3 md:right-3 z-10 p-2 md:p-2.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20 hover:bg-white transition-all group/fav"
                    >
                        <Heart
                            className={`w-4 h-4 md:w-5 md:h-5 transition-all ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white group-hover/fav:text-rose-500'}`}
                        />
                    </button>

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 px-2 py-1 md:px-3 md:py-1.5 bg-white/95 backdrop-blur-md rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-900 border border-white/50 shadow-sm flex items-center gap-1 md:gap-1.5 transition-transform group-hover:scale-105">
                        <span className="text-xs md:text-sm">{event.category_icon || '✨'}</span>
                        <span className="hidden xs:inline">{event.category_name_en || event.category || 'Event'}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="px-1 flex-1 flex flex-col">
                    <div className="mb-1.5 md:mb-2 text-left">
                        <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors leading-tight md:leading-snug">
                            {event.title}
                        </h3>
                    </div>

                    <div className="space-y-0.5 md:space-y-1 mb-auto text-left">
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 md:gap-1.5">
                            <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary/40" />
                            <span className="truncate">{event.location_name || 'Istanbul'}</span>
                        </p>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Price & Footer */}
                    <div className="pt-3 md:pt-4 flex items-center justify-between border-t border-gray-100 mt-3 md:mt-4">
                        <div className="flex items-center gap-1 md:gap-2">
                            <div className="bg-primary/10 px-2 py-1 md:px-3 md:py-2 rounded-lg md:rounded-xl border border-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20">
                                <span className="text-sm md:text-base font-black text-primary group-hover:text-white transition-colors">
                                    {(() => {
                                        let displayPrice = event.price;
                                        if (event.tickets && event.tickets.length > 0) {
                                            const prices = event.tickets.map((t: any) => t.price);
                                            displayPrice = Math.min(...prices);
                                        }
                                        return displayPrice > 0 ? `${displayPrice} ₺` : 'Free';
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 md:px-2.5 md:py-1.5 rounded-md md:rounded-lg border border-emerald-100/50">
                            <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" />
                            <span className="hidden xs:inline">NEW</span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
