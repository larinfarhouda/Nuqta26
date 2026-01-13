'use client';

import { useTranslations } from 'next-intl';
import { Calendar, ShoppingBag, Music, Palette, Utensils, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Categories() {
    const t = useTranslations('Index');
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');

    const categories = [
        { icon: Calendar, key: 'workshop', color: 'bg-amber-500', light: 'bg-amber-50' },
        { icon: ShoppingBag, key: 'bazaar', color: 'bg-violet-500', light: 'bg-violet-50' },
        { icon: Music, key: 'concert', color: 'bg-rose-500', light: 'bg-rose-50' },
        { icon: Palette, key: 'exhibition', color: 'bg-sky-500', light: 'bg-sky-50' },
        { icon: Utensils, key: 'other', color: 'bg-emerald-500', light: 'bg-emerald-50' },
    ];

    const handleCategoryClick = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentCategory === key) {
            params.delete('category');
        } else {
            params.set('category', key);
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <section className="relative z-10 w-full mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em]">
                        <Sparkles className="w-3" />
                        <span>Explore variety</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                        {t('categories.title')}
                    </h2>
                </div>
                <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent mx-8 mb-4" />
                <button className="text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2">
                    View all collections →
                </button>
            </div>

            <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto pb-6 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {categories.map((cat, idx) => {
                    const isActive = currentCategory === cat.key;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -8 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategoryClick(cat.key)}
                            className={`group flex-shrink-0 w-24 md:w-auto p-4 md:p-8 rounded-[32px] shadow-sm border transition-all cursor-pointer flex flex-col items-center gap-4 text-center ${isActive
                                ? 'bg-gray-900 border-gray-900 shadow-xl'
                                : 'bg-white border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50'
                                }`}
                        >
                            <div className={`w-14 h-14 md:w-20 md:h-20 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500 ${isActive ? 'bg-white/10' : cat.light
                                }`}>
                                <cat.icon className={`w-7 h-7 md:w-10 md:h-10 ${isActive ? 'text-white' : cat.color.replace('bg-', 'text-')
                                    }`} />
                            </div>
                            <div className="space-y-1">
                                <span className={`font-black text-xs md:text-base whitespace-nowrap md:whitespace-normal block lowercase tracking-tight italic ${isActive ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {t(`categories.${cat.key}`)}
                                </span>
                                <div className={`h-1 mx-auto rounded-full transition-all duration-300 ${isActive ? 'w-full bg-white/20' : `w-0 group-hover:w-full ${cat.color}`
                                    }`} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
