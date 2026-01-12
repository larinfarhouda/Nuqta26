'use client';

import { Search, MapPin, Calendar, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [date, setDate] = useState(searchParams.get('date') || '');
    const [isExpanded, setIsExpanded] = useState(false);

    // Debounce function
    const updateFilters = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    // Handle inputs with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get('search') || '')) updateFilters('search', search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, updateFilters, searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (location !== (searchParams.get('location') || '')) updateFilters('location', location);
        }, 500);
        return () => clearTimeout(timer);
    }, [location, updateFilters, searchParams]);

    const activeFiltersCount = [location, date].filter(Boolean).length;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 z-30 -mt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-3 transition-all"
            >
                {/* Main Bar */}
                <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="flex-1 w-full flex items-center gap-4 px-6 py-4 bg-gray-50/50 rounded-2xl border border-transparent focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-inner transition-all group">
                        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            className="flex-1 text-base font-bold text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                            placeholder="Find your next experience..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex w-full md:w-auto items-center gap-3">
                        {/* Hidden on mobile, shown as part of filters if needed but kept simple here */}
                        <div className="hidden lg:flex items-center gap-4 px-6 py-4 bg-gray-50/50 rounded-2xl border border-transparent">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className="w-32 text-sm font-bold text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                                placeholder="Anywhere"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>

                        {/* Filter Toggle Button */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all relative overflow-hidden",
                                isExpanded || activeFiltersCount > 0
                                    ? "bg-primary text-white shadow-xl shadow-primary/25"
                                    : "bg-gray-900 text-white hover:bg-gray-800"
                            )}
                        >
                            {isExpanded ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
                            <span className="hidden sm:inline">{isExpanded ? 'Close' : 'Filters'}</span>

                            {!isExpanded && activeFiltersCount > 0 && (
                                <span className="w-5 h-5 bg-white text-primary text-[10px] flex items-center justify-center rounded-full font-black ml-2">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Collapsible Filters */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 mt-2 border-t border-gray-100">
                                {/* Location (Mobile/Tablet) */}
                                <div className="lg:hidden flex flex-col gap-1 px-4 py-3 bg-gray-50 rounded-xl">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</label>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <input
                                            type="text"
                                            className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none"
                                            placeholder="Istanbul, TR"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Date Selector */}
                                <div className="flex flex-col gap-1 px-4 py-3 bg-gray-50 rounded-xl">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeframe</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <select
                                            className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer appearance-none"
                                            value={date}
                                            onChange={(e) => { setDate(e.target.value); updateFilters('date', e.target.value); }}
                                        >
                                            <option value="">Any Time</option>
                                            <option value="today">Today</option>
                                            <option value="tomorrow">Tomorrow</option>
                                            <option value="week">This Week</option>
                                            <option value="weekend">This Weekend</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Placeholder for more filters */}
                                <div className="flex items-center justify-center px-4 py-3 border border-dashed border-gray-200 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400 italic">More filters coming soon</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
