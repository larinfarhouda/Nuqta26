'use client';

import { Search, MapPin, Calendar, SlidersHorizontal, X, ArrowUpRight, DollarSign, LocateFixed, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useLocale } from 'next-intl';

import { useTranslations } from 'next-intl';

export default function EventSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('Index');
    const locale = useLocale();

    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('categories').select('*');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    // Local state
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [date, setDate] = useState(searchParams.get('date') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

    // Geolocation state
    const [isLocating, setIsLocating] = useState(false);
    const [hasLocation, setHasLocation] = useState(!!searchParams.get('lat'));

    const [isExpanded, setIsExpanded] = useState(false);

    // Debounce function
    const updateFilters = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        router.push(`?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    // Handle inputs with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const updates: Record<string, string | null> = {};
            if (search !== (searchParams.get('search') || '')) updates.search = search;
            if (location !== (searchParams.get('location') || '')) updates.location = location;
            // Only update if changed
            if (Object.keys(updates).length > 0) updateFilters(updates);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, location, updateFilters, searchParams]);

    const handleGeolocation = () => {
        setIsLocating(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    updateFilters({
                        lat: latitude.toString(),
                        lng: longitude.toString(),
                        radius: '50', // Default 50km
                        location: 'Current Location' // Visual override
                    });
                    setLocation('Current Location');
                    setHasLocation(true);
                    setIsLocating(false);
                },
                (error) => {
                    console.error('Error getting location', error);
                    setIsLocating(false);
                    // Optionally show toast error
                }
            );
        } else {
            setIsLocating(false);
        }
    };

    const clearLocation = () => {
        setLocation('');
        setHasLocation(false);
        updateFilters({ lat: null, lng: null, radius: null, location: null });
    };

    const activeFiltersCount = [
        location, date, category, minPrice, maxPrice,
        searchParams.get('lat')
    ].filter(Boolean).length;

    return (
        <div className="w-full max-w-6xl mx-auto px-4 z-30 -mt-4 md:-mt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 p-2 md:p-3 transition-all"
            >
                {/* Main Bar */}
                <div className="flex flex-col lg:flex-row items-center gap-3">

                    {/* Search Input - Always visible */}
                    <div className="flex-1 w-full lg:w-auto h-14 md:h-16 flex items-center gap-3 px-4 md:px-6 bg-gray-50 rounded-[22px] border border-transparent focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-lg transition-all group">
                        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            className="flex-1 text-base font-bold text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                            placeholder="What are you looking for?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex w-full lg:w-auto items-center gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">

                        {/* Hidden on mobile initially, but we can make it part of main bar for quick access */}
                        <div className="hidden md:flex items-center gap-3 px-5 h-16 bg-gray-50 rounded-[22px] border border-transparent hover:bg-white hover:shadow-md transition-all cursor-pointer group" onClick={() => document.getElementById('location-input')?.focus()}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasLocation ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                <MapPin className="w-4 h-4" />
                            </div>
                            <input
                                id="location-input"
                                type="text"
                                className="w-32 lg:w-40 text-sm font-bold text-gray-800 placeholder:text-gray-400 outline-none bg-transparent cursor-pointer"
                                placeholder="Location"
                                value={location}
                                onChange={(e) => {
                                    setLocation(e.target.value);
                                    if (hasLocation && e.target.value === '') clearLocation();
                                }}
                            />
                            {hasLocation ? (
                                <button onClick={(e) => { e.stopPropagation(); clearLocation(); }} className="p-1 hover:bg-gray-200 rounded-full">
                                    <X className="w-3 h-3 text-gray-400" />
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleGeolocation(); }}
                                    className="p-1.5 hover:bg-white rounded-full text-primary hover:shadow-sm"
                                    title="Use my location"
                                >
                                    {isLocating ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                                </button>
                            )}
                        </div>

                        <div className="h-10 w-px bg-gray-200 hidden md:block mx-1" />

                        {/* Filter Toggle Button */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "flex-none h-14 md:h-16 flex items-center justify-center gap-3 px-6 md:px-8 rounded-[22px] font-black text-sm uppercase tracking-widest transition-all relative overflow-hidden",
                                isExpanded || activeFiltersCount > 0
                                    ? "bg-gray-900 text-white shadow-xl shadow-gray-900/20"
                                    : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {isExpanded ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
                            <span className="hidden md:inline">{isExpanded ? 'Close Filters' : 'Filters'}</span>

                            {!isExpanded && activeFiltersCount > 0 && (
                                <span className="w-6 h-6 bg-white text-gray-900 text-[10px] flex items-center justify-center rounded-full font-black border-2 border-transparent">
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
                            key="filters"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 md:p-6 mt-2 border-t border-gray-100 flex flex-col gap-6">

                                {/* 1. Categories - Pills */}
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Event Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => { setCategory(''); updateFilters({ category: null }); }}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2",
                                                !category
                                                    ? "border-gray-900 bg-gray-900 text-white"
                                                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                                            )}
                                        >
                                            <span>All</span>
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    const newVal = category === cat.slug ? '' : cat.slug; // Use slug for URL filtering
                                                    setCategory(newVal);
                                                    updateFilters({ category: newVal || null });
                                                }}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2",
                                                    category === cat.slug
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-gray-100 bg-white text-gray-600 hover:border-primary/30"
                                                )}
                                            >
                                                <span>{cat.icon}</span>
                                                <span>{locale === 'ar' ? cat.name_ar : cat.name_en}</span>
                                                {category === cat.slug && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* 2. Date */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">When</label>
                                        <div className="flex items-center gap-3 px-4 h-12 bg-gray-50 rounded-xl border border-transparent focus-within:border-primary/20 transition-all">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <select
                                                className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer appearance-none"
                                                value={date}
                                                onChange={(e) => { setDate(e.target.value); updateFilters({ date: e.target.value || null }); }}
                                            >
                                                <option value="">Any Time</option>
                                                <option value="today">Today</option>
                                                <option value="tomorrow">Tomorrow</option>
                                                <option value="week">This Week</option>
                                                <option value="weekend">This Weekend</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* 3. Price Range (Simple version) */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Price Range</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 flex items-center gap-2 px-3 h-12 bg-gray-50 rounded-xl">
                                                <span className="text-gray-400 text-xs font-bold">Min</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent text-sm font-bold outline-none" placeholder="0"
                                                    value={minPrice}
                                                    onChange={(e) => setMinPrice(e.target.value)}
                                                    onBlur={() => updateFilters({ minPrice: minPrice || null })}
                                                />
                                            </div>
                                            <div className="flex-1 flex items-center gap-2 px-3 h-12 bg-gray-50 rounded-xl">
                                                <span className="text-gray-400 text-xs font-bold">Max</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Any"
                                                    value={maxPrice}
                                                    onChange={(e) => setMaxPrice(e.target.value)}
                                                    onBlur={() => updateFilters({ maxPrice: maxPrice || null })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Location (Mobile only, or detailed search) */}
                                    <div className="md:hidden flex flex-col gap-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Location</label>
                                        <div className="flex items-center gap-3 px-4 h-12 bg-gray-50 rounded-xl relative">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none"
                                                placeholder="City, District..."
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                            />
                                            <button
                                                onClick={handleGeolocation}
                                                className="absolute right-2 p-2 bg-white rounded-lg shadow-sm text-primary"
                                            >
                                                <LocateFixed className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
