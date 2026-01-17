'use client';

import { useTranslations } from 'next-intl';
import { Search, Users, Star, Sparkles, Orbit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Features() {
    const t = useTranslations('Index');

    const features = [
        { title: 'explore', icon: Search, color: 'text-amber-500', bg: 'bg-amber-50' },
        { title: 'connect', icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
        { title: 'grow', icon: Star, color: 'text-rose-500', bg: 'bg-rose-50' }
    ];

    return (
        <section className="py-32 bg-[#fffdfa] relative overflow-hidden">
            {/* Background Decor Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 right-10 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-20 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-100 shadow-sm rounded-full"
                    >
                        <Orbit className="w-4 h-4 text-primary animate-spin-slow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Our Ecosystem</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight"
                    >
                        Everything you need to <br />
                        <span className="relative inline-block">
                            <span className="relative z-10 text-primary italic">thrive</span>
                            <div className="absolute -bottom-1 left-0 w-full h-4 bg-secondary/20 -rotate-1 z-0" />
                        </span>
                        &nbsp;in Istanbul
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative p-10 rounded-[3rem] bg-white/50 backdrop-blur-md border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(45,116,116,0.15)] transition-all duration-500 overflow-hidden"
                        >
                            {/* Inner Accent */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 rounded-full ${feature.bg}`} />

                            <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center shadow-lg mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                                <feature.icon className={`w-8 h-8 ${feature.color}`} />
                            </div>

                            <div className="space-y-4 relative z-10">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none italic">{t(`features.${feature.title}`)}</h3>
                                <p className="text-base text-gray-500 font-medium leading-relaxed">
                                    {t(`features.${feature.title}_desc`)}
                                </p>
                            </div>

                            {/* Decorative Nuqta (Dot) */}
                            <div className={`absolute bottom-8 right-8 w-2 h-2 rounded-full transition-all duration-500 ${feature.color} opacity-20 group-hover:scale-[10] group-hover:opacity-5 group-hover:blur-sm`} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
