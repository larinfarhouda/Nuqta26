'use client';

import { Search, X, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function EventSearch() {
    const t = useTranslations('Index');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filters state
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [isFocused, setIsFocused] = useState(false);

    const updateFilters = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        router.push(`?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    const handleSearch = (val: string) => {
        updateFilters({ search: val || null });
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get('search') || '')) {
                handleSearch(search);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="relative w-full max-w-4xl mx-auto px-4 z-50 transition-all duration-500">
            <motion.div
                animate={{
                    scale: isFocused ? 1.02 : 1,
                    boxShadow: isFocused
                        ? '0 25px 50px -12px rgba(45, 116, 116, 0.25)'
                        : '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                className={`flex items-center bg-white border-2 transition-all duration-300 rounded-xl md:rounded-[2.5rem] py-1 md:py-1.5 px-4 md:px-8 ${isFocused ? 'border-primary/30 shadow-2xl' : 'border-gray-50 shadow-xl'
                    } group`}
            >
                <div className="flex items-center gap-2 md:gap-4 flex-1">
                    <Search className={`w-4 h-4 md:w-6 md:h-6 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-gray-300'
                        }`} />
                    <input
                        className="flex-1 bg-transparent py-3 md:py-6 lg:py-8 text-sm md:text-lg lg:text-xl font-bold text-gray-900 placeholder:text-gray-300 outline-none"
                        placeholder={t('search.placeholder')}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <AnimatePresence>
                        {search && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => { setSearch(''); handleSearch(''); }}
                                className="p-2 md:p-3 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div className="hidden md:flex items-center gap-2 px-5 py-3 bg-gray-50 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('search.label')}</span>
                    </div>
                </div>
            </motion.div>

            {/* Discovery Suggestion Desktop Only */}
            <div className="absolute -bottom-8 left-12 hidden lg:flex items-center gap-4 text-xs font-bold text-white/40 uppercase tracking-widest pointer-events-none">
                <span>{t('search.try_jazz')}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{t('search.try_photo')}</span>
            </div>
        </div>
    );
}
