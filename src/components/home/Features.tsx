'use client';

import { useTranslations } from 'next-intl';
import { Search, Users, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Features() {
    const t = useTranslations('Index');

    const features = [
        { title: 'explore', icon: Search, color: 'from-amber-400 to-orange-500' },
        { title: 'connect', icon: Users, color: 'from-primary to-teal-600' },
        { title: 'grow', icon: Star, color: 'from-indigo-500 to-purple-600' }
    ];

    return (
        <section className="py-24 md:py-32 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-full"
                    >
                        <Sparkles className="w-3" />
                        <span>Why Nuqta?</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight"
                    >
                        Everything you need to <span className="text-primary italic">thrive</span> in Istanbul
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative p-8 rounded-[40px] bg-gray-50/50 border border-transparent hover:border-primary/10 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                        >
                            <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr ${feature.color} rounded-3xl flex items-center justify-center shadow-xl shadow-primary/10 mb-8 transform group-hover:rotate-6 transition-transform duration-500`}>
                                <feature.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4 tracking-tight">{t(`features.${feature.title}`)}</h3>
                            <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                                {t(`features.${feature.title}_desc`)}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
