'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Calendar, Users, Store, Star } from 'lucide-react';

interface StatsBarProps {
    eventCount: number;
    vendorCount: number;
}

export default function StatsBar({ eventCount, vendorCount }: StatsBarProps) {
    const t = useTranslations('Index.stats');

    const stats = [
        {
            icon: Calendar,
            value: `${eventCount}+`,
            label: t('events_hosted'),
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            icon: Users,
            value: '5K+',
            label: t('community_members'),
            color: 'text-accent',
            bg: 'bg-accent/10',
        },
        {
            icon: Store,
            value: `${vendorCount}+`,
            label: t('organizers'),
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            icon: Star,
            value: '4.8',
            label: t('avg_rating'),
            color: 'text-amber-500',
            bg: 'bg-amber-50',
        },
    ];

    return (
        <section className="py-10 md:py-16 border-y border-gray-100 bg-gradient-to-r from-secondary/30 via-white to-secondary/30">
            <div className="max-w-[1440px] mx-auto px-4 md:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className="flex flex-col items-center text-center gap-2"
                        >
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-1`}>
                                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                            </div>
                            <span className="text-2xl md:text-3xl font-black text-accent tracking-tight">
                                {stat.value}
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-accent/40 uppercase tracking-wide">
                                {stat.label}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
