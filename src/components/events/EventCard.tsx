'use client';

import { Calendar, MapPin, Heart, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/navigation';
import { useState } from 'react';
import { toggleFavoriteEvent } from '@/actions/user';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (isLoading) return;

        const newState = !isFavorite;
        setIsFavorite(newState);
        setIsLoading(true);

        const result = await toggleFavoriteEvent(event.id, isFavorite);
        setIsLoading(false);

        if (result?.error) {
            setIsFavorite(!newState);
            if (result.error === 'Unauthorized') {
                router.push('/login');
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="h-full"
        >
            <Link href={`/events/${event.id}`} className="group block h-full">
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col relative">

                    {/* Image Container */}
                    <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                        {event.image_url ? (
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Image</span>
                            </div>
                        )}

                        {/* Glassy Overlay for bottom Info */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Date Badge */}
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl text-center shadow-lg border border-white/20">
                            <p className="text-[10px] uppercase font-black text-primary leading-none mb-0.5">
                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                            <p className="text-lg font-black text-gray-900 leading-none">
                                {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric' })}
                            </p>
                        </div>

                        {/* Favorite Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleToggleFavorite}
                            className={`absolute top-4 right-4 p-2.5 rounded-2xl backdrop-blur-xl transition-all border ${isFavorite ? 'bg-red-500 text-white border-red-400' : 'bg-white/80 text-gray-600 border-white/40 hover:bg-white'}`}
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        </motion.button>

                        {/* View Arrow */}
                        <div className="absolute bottom-4 right-4 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="bg-white p-2 rounded-xl shadow-lg">
                                <ArrowUpRight className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="px-2 py-0.5 bg-secondary text-primary text-[10px] font-black rounded-md uppercase tracking-wider">
                                {event.category || 'Event'}
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-xs font-bold text-gray-400 truncate max-w-[120px]">
                                {event.vendors?.business_name}
                            </span>
                        </div>

                        <h3 className="text-xl font-black text-gray-900 mb-4 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {event.title}
                        </h3>

                        <div className="mt-auto space-y-3">
                            <div className="flex items-center gap-2.5 text-sm text-gray-500 font-medium">
                                <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="truncate">{event.location_name || 'Istanbul'}</span>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">Starting from</span>
                                    <span className="font-black text-xl text-primary">
                                        {event.price > 0 ? `${event.price} ₺` : 'FREE'}
                                    </span>
                                </div>
                                <div className="h-10 px-4 rounded-xl bg-gray-900 group-hover:bg-primary text-white flex items-center justify-center transition-colors">
                                    <span className="text-xs font-black uppercase tracking-widest">Join</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
