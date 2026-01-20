'use client';

import { useTranslations } from 'next-intl';
import { Search, Users, Star, Orbit } from 'lucide-react';

export default function Features() {
    const t = useTranslations('Index');

    const features = [
        { title: 'explore', icon: Search, color: 'text-amber-500', bg: 'bg-amber-50' },
        { title: 'connect', icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
        { title: 'grow', icon: Star, color: 'text-rose-500', bg: 'bg-rose-50' }
    ];

    return (
        <section className="py-24 md:py-32 bg-[#fffdfa] relative overflow-hidden">
            {/* Background Decor Elements - Reduced on mobile */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-0 opacity-10 md:opacity-20 pointer-events-none">
                <div className="absolute top-0 right-10 w-48 h-48 md:w-64 md:h-64 bg-secondary/20 rounded-full blur-[80px] md:blur-[100px]" />
                <div className="absolute bottom-0 left-10 w-64 h-64 md:w-96 md:h-96 bg-primary/10 rounded-full blur-[100px] md:blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20 space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-white border border-gray-100 shadow-sm rounded-full">
                        <Orbit className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('features_section.our_ecosystem')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        {t.rich('features_section.thrive_title', {
                            highlight: (chunks) => (
                                <span className="relative inline-block mx-1 md:mx-2">
                                    <span className="relative z-10 text-primary italic">{chunks}</span>
                                    <div className="absolute -bottom-1 left-0 w-full h-3 md:h-4 bg-secondary/20 -rotate-1 z-0" />
                                </span>
                            )
                        })}
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group relative p-8 md:p-10 rounded-3xl md:rounded-[3rem] bg-white/50 backdrop-blur-sm md:backdrop-blur-md border border-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] md:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(45,116,116,0.15)] transition-all duration-500 overflow-hidden"
                        >
                            {/* Inner Accent */}
                            <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 blur-[40px] md:blur-[60px] opacity-10 rounded-full ${feature.bg}`} />

                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${feature.bg} flex items-center justify-center shadow-md md:shadow-lg mb-6 md:mb-8 transition-transform duration-500 md:group-hover:scale-110 md:group-hover:rotate-6`}>
                                <feature.icon className={`w-7 h-7 md:w-8 md:h-8 ${feature.color}`} />
                            </div>

                            <div className="space-y-3 md:space-y-4 relative z-10">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none italic">{t(`features.${feature.title}`)}</h3>
                                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                                    {t(`features.${feature.title}_desc`)}
                                </p>
                            </div>

                            {/* Decorative Nuqta (Dot) */}
                            <div className={`absolute bottom-6 md:bottom-8 right-6 md:right-8 w-2 h-2 rounded-full transition-all duration-500 ${feature.color} opacity-20 md:group-hover:scale-[10] md:group-hover:opacity-5 md:group-hover:blur-sm`} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
