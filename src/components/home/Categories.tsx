'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (categories.length === 0) return null;

    return (
        <section className="sticky top-24 z-40 w-full bg-white/95 backdrop-blur-xl md:backdrop-blur-2xl border-b border-gray-100 transition-shadow duration-300">
            <div className="container mx-auto px-4 md:px-8 lg:px-12 relative group max-w-[1800px]">

                {/* Desktop Scroll Nav */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-gray-50 active:scale-90"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-900" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex items-center md:justify-center gap-8 md:gap-12 lg:gap-16 xl:gap-20 overflow-x-auto no-scrollbar py-5 md:py-6 lg:py-8 px-4 md:px-6"
                >
                    {categories.map((cat, idx) => {
                        const isActive = currentCategory === cat.slug;
                        const name = locale === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={cn(
                                    "flex flex-col items-center gap-2 md:gap-3 min-w-fit group transition-all relative",
                                    isActive ? "opacity-100" : "opacity-50 hover:opacity-100 active:opacity-100"
                                )}
                            >
                                <span className={cn(
                                    "text-2xl md:text-3xl lg:text-4xl transition-all duration-300 md:group-hover:-translate-y-1",
                                    isActive ? "filter-none scale-110" : "grayscale opacity-80 md:group-hover:grayscale-0 md:group-hover:opacity-100"
                                )}>
                                    {cat.icon}
                                </span>
                                <span className={cn(
                                    "text-[10px] md:text-xs font-black uppercase whitespace-nowrap transition-colors",
                                    locale === 'ar' ? "tracking-normal" : "tracking-[0.15em]",
                                    isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-900"
                                )}>
                                    {name}
                                </span>

                                {
                                    isActive && (
                                        <div
                                            className="absolute -bottom-5 md:-bottom-8 left-0 right-0 h-1 bg-gray-900 rounded-full transition-all duration-200"
                                        />
                                    )
                                }
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-gray-50 active:scale-90"
                >
                    <ChevronRight className="w-5 h-5 text-gray-900" />
                </button>

                {/* Desktop Fades */}
                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 hidden md:block" />
                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 hidden md:block" />
            </div>
        </section >
    );
}
