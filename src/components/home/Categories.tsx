'use client';

import { useTranslations } from 'next-intl';
import { Calendar, ShoppingBag, Music, Palette, Utensils, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Categories() {
    const t = useTranslations('Index');

    const categories = [
        { icon: Calendar, key: 'workshops', color: 'bg-amber-500', light: 'bg-amber-50' },
        { icon: ShoppingBag, key: 'bazaars', color: 'bg-violet-500', light: 'bg-violet-50' },
        { icon: Music, key: 'music', color: 'bg-rose-500', light: 'bg-rose-50' },
        { icon: Palette, key: 'art', color: 'bg-sky-500', light: 'bg-sky-50' },
        { icon: Utensils, key: 'food', color: 'bg-emerald-500', light: 'bg-emerald-50' },
    ];

    return (
        <section className="relative z-10 w-full mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em]">
                        <Sparkles className="w-3" />
                        <span>Explore variety</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                        {t('categories.title')}
                    </h2>
                </div>
                <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent mx-8 mb-4" />
                <button className="text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2">
                    View all collections →
                </button>
            </div>

            <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto pb-6 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {categories.map((cat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -8 }}
                        whileTap={{ scale: 0.95 }}
                        className="group flex-shrink-0 w-28 md:w-auto bg-white p-5 md:p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all cursor-pointer flex flex-col items-center gap-4 text-center"
                    >
                        <div className={`w-14 h-14 md:w-20 md:h-20 rounded-[22px] ${cat.light} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500`}>
                            <cat.icon className={`w-7 h-7 md:w-10 md:h-10 ${cat.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="space-y-1">
                            <span className="font-black text-gray-900 text-xs md:text-base whitespace-nowrap md:whitespace-normal block lowercase tracking-tight italic">
                                {t(`categories.${cat.key}`)}
                            </span>
                            <div className={`h-1 w-0 group-hover:w-full transition-all duration-300 mx-auto rounded-full ${cat.color}`} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
