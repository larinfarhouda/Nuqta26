'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sparkles, Target, History, Heart, Users, MapPin } from 'lucide-react';

export default function AboutPage() {
    const t = useTranslations('StaticPages.About');

    return (
        <main className="min-h-screen bg-[#fffdfa]"> {/* Warmer Background */}
            {/* Hero Section with Richer Warmth */}
            <div className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32 bg-gradient-to-b from-secondary/20 via-white to-transparent">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-secondary/10 to-transparent blur-3xl opacity-50" />
                    {/* Abstract Blobs */}
                    <div className="absolute top-20 left-10 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-white/80 backdrop-blur-xl text-primary rounded-full text-xs md:text-sm font-black border border-secondary/30 shadow-xl shadow-secondary/10"
                        >
                            <Heart className="w-4 h-4 fill-primary" />
                            <span>{t('title')}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight"
                        >
                            {t.rich('subtitle_rich', {
                                highlight: (chunks) => (
                                    <span className="text-primary italic relative inline-block">
                                        {chunks}
                                        <svg className="absolute -bottom-2 left-0 w-full h-2 text-secondary/60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                            <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                                        </svg>
                                    </span>
                                )
                            })}
                        </motion.h1>
                    </div>
                </div>
            </div>

            {/* Content Section with Warmer Accents */}
            <div className="container mx-auto px-4 pb-32 relative">
                <div className="max-w-5xl mx-auto space-y-32">

                    {/* Mission Card - More Life */}
                    <motion.section
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative grid lg:grid-cols-2 gap-16 items-center p-8 md:p-12 rounded-[3.5rem] bg-white border border-secondary/20 shadow-2xl shadow-secondary/5"
                    >
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold">
                                <Target className="w-5 h-5" />
                                <span>{t('mission_title')}</span>
                            </div>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                                {t('mission_desc')}
                            </p>
                            <div className="flex items-center gap-6 pt-4">
                                <div className="flex -space-x-3">
                                    {['A', 'M', 'S', 'H'].map((initial, i) => (
                                        <div key={i} className={`w-12 h-12 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-sm shadow-sm ${['bg-primary', 'bg-secondary', 'bg-accent', 'bg-emerald-500'][i]
                                            }`}>
                                            {initial}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm font-bold text-gray-400">
                                    {t('join_members', { count: '15,000' })}
                                </p>
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-[2.5rem] overflow-hidden group shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary mix-blend-multiply opacity-20 group-hover:opacity-10 transition-opacity" />
                            <img src="/images/hero_community.png" alt="Community" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
                            <div className="absolute inset-0 border-[12px] border-white/20 rounded-[2.5rem]" />
                        </div>
                    </motion.section>

                    {/* Story - Centered Warmth */}
                    <motion.section
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-secondary/10 rounded-[4rem] p-12 md:p-24 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/patterns/natural-paper.png')] opacity-20" />
                        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-primary mx-auto rotate-3">
                                <History className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900">{t('story_title')}</h2>
                            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium">
                                {t('story_desc')}
                            </p>
                        </div>
                    </motion.section>

                    {/* Name Section - Creative Typography */}
                    <motion.section
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-12 items-center"
                    >
                        <div className="md:col-span-1">
                            <div className="bg-primary text-white p-12 rounded-[3rem] aspect-square flex flex-col items-center justify-center text-center shadow-2xl shadow-primary/20 rotate-2">
                                <span className="text-8xl font-black mb-2">.</span>
                                <span className="text-4xl font-black tracking-widest uppercase">Nuqta</span>
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-6">
                            <h2 className="text-4xl font-black text-gray-900 italic">
                                {t('name_title')}
                            </h2>
                            <p className="text-xl text-gray-600 leading-relaxed font-medium">
                                {t('name_desc')}
                            </p>
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                    <MapPin className="w-4 h-4" />
                                    <span>{t('location')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                                    <Users className="w-4 h-4" />
                                    <span>{t('forCommunity')}</span>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                </div>
            </div>
        </main>
    );
}
