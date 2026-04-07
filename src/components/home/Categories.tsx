'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

interface Category {
    id: string;
    slug: string;
    name_en: string;
    name_ar?: string | null;
    icon?: string | null;
}

export default function Categories() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');
    const [categories, setCategories] = useState<Category[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('categories')
                .select('*')
                .order('name_en', { ascending: true });
            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    const handleCategoryClick = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentCategory === key) {
            params.delete('category');
        } else {
            params.set('category', key);
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    if (categories.length === 0) return null;

    return (
        <section className="sticky top-16 md:top-24 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-gray-100/60">
            <div className="relative max-w-[1440px] mx-auto">
                <div
                    ref={scrollRef}
                    className="flex items-center gap-2.5 md:gap-3 overflow-x-auto no-scrollbar py-3 md:py-4 px-4 md:px-8 md:justify-center"
                >
                    {categories.map((cat, idx) => {
                        const isActive = currentCategory === cat.slug;
                        const name = locale === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en;

                        return (
                            <motion.button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 border",
                                    isActive
                                        ? "bg-accent text-white border-accent shadow-md shadow-accent/15"
                                        : "bg-white text-accent/70 border-gray-100 hover:border-primary/30 hover:text-accent hover:bg-primary/5 active:bg-primary/10"
                                )}
                            >
                                <span className={cn(
                                    "text-base md:text-lg transition-transform",
                                    isActive ? "scale-110" : ""
                                )}>
                                    {cat.icon}
                                </span>
                                <span className={cn(
                                    "text-xs md:text-sm",
                                    locale === 'ar' ? "tracking-normal" : "tracking-wide"
                                )}>
                                    {name}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Scroll fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/90 to-transparent pointer-events-none md:hidden" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none md:hidden" />
            </div>
        </section>
    );
}
