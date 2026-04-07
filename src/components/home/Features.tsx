'use client';

import { useTranslations } from 'next-intl';
import { Search, Users, Star } from 'lucide-react';
import { useCountryName } from '@/hooks/useCountry';
import { motion } from 'framer-motion';

export default function Features() {
    const t = useTranslations('Index');
    const countryName = useCountryName();

    const features = [
        {
            title: 'explore',
            icon: Search,
            emoji: '🔍',
            gradient: 'from-primary/10 to-secondary',
            iconColor: 'text-primary',
            dotColor: 'bg-primary'
        },
        {
            title: 'connect',
            icon: Users,
            emoji: '🤝',
            gradient: 'from-secondary to-primary/5',
            iconColor: 'text-accent',
            dotColor: 'bg-accent'
        },
        {
            title: 'grow',
            icon: Star,
            emoji: '⭐',
            gradient: 'from-primary/8 to-secondary/50',
            iconColor: 'text-primary',
            dotColor: 'bg-primary'
        }
    ];

    return (
        <section className="py-16 md:py-24 relative overflow-hidden">
            <div className="max-w-[1440px] mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center max-w-xl mx-auto mb-10 md:mb-16 space-y-3 md:space-y-4">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/50 rounded-full text-xs font-bold text-accent/60 uppercase tracking-widest">
                        {t('features_section.our_ecosystem')}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-black text-accent tracking-tight leading-tight">
                        {t.rich('features_section.thrive_title', {
                            country: countryName,
                            highlight: (chunks) => (
                                <span className="text-primary">{chunks}</span>
                            )
                        })}
                    </h2>
                </div>

                {/* Cards — Horizontal scroll on mobile, grid on desktop */}
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 overflow-x-auto no-scrollbar pb-4 md:pb-0 px-1 md:px-0 snap-x snap-mandatory md:snap-none">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className={`group relative p-6 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br ${feature.gradient} border border-white/80 shadow-sm hover:shadow-lg transition-all duration-300 min-w-[280px] md:min-w-0 snap-center`}
                        >
                            {/* Emoji accent */}
                            <span className="text-3xl md:text-4xl mb-4 block">{feature.emoji}</span>

                            <div className="space-y-2 md:space-y-3">
                                <h3 className="text-lg md:text-xl font-black text-accent tracking-tight">
                                    {t(`features.${feature.title}`)}
                                </h3>
                                <p className="text-sm text-accent/50 font-medium leading-relaxed">
                                    {t(`features.${feature.title}_desc`)}
                                </p>
                            </div>

                            {/* Decorative dot */}
                            <div className={`absolute bottom-4 ${idx % 2 === 0 ? 'right-4' : 'right-6'} w-2 h-2 rounded-full ${feature.dotColor} opacity-20 group-hover:opacity-40 transition-opacity`} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
