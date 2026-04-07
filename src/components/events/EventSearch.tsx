'use client';

import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

const PLACEHOLDER_CYCLE_MS = 3000;

export default function EventSearch() {
    const t = useTranslations('Index');
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const placeholders = [
        t('search.placeholder'),
        t('search.try_jazz'),
        t('search.try_photo'),
    ];

    // Cycle through placeholder suggestions
    useEffect(() => {
        if (isFocused || search) return;
        const timer = setInterval(() => {
            setPlaceholderIndex((i) => (i + 1) % placeholders.length);
        }, PLACEHOLDER_CYCLE_MS);
        return () => clearInterval(timer);
    }, [isFocused, search, placeholders.length]);

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
        <div className="relative w-full max-w-2xl mx-auto px-4 md:px-0 z-50">
            <motion.div
                animate={{
                    boxShadow: isFocused
                        ? '0 20px 40px -12px rgba(44, 165, 141, 0.2)'
                        : '0 8px 24px -4px rgba(0, 0, 0, 0.08)'
                }}
                className={`flex items-center bg-white border-2 transition-all duration-300 rounded-2xl md:rounded-[2rem] py-0.5 md:py-1 px-4 md:px-6 ${
                    isFocused ? 'border-primary/30' : 'border-gray-100'
                }`}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Search className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                        isFocused ? 'text-primary' : 'text-gray-300'
                    }`} />
                    <div className="relative flex-1">
                        <input
                            className="w-full bg-transparent py-3.5 md:py-5 text-base md:text-lg font-semibold text-accent placeholder:text-transparent outline-none"
                            placeholder={placeholders[placeholderIndex]}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {/* Animated placeholder */}
                        {!search && !isFocused && (
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={placeholderIndex}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-y-0 left-0 flex items-center text-base md:text-lg font-medium text-gray-300 pointer-events-none truncate"
                                >
                                    {placeholders[placeholderIndex]}
                                </motion.span>
                            </AnimatePresence>
                        )}
                        {!search && isFocused && (
                            <span className="absolute inset-y-0 left-0 flex items-center text-base md:text-lg font-medium text-gray-300 pointer-events-none">
                                {placeholders[0]}
                            </span>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {search && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => { setSearch(''); handleSearch(''); }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
