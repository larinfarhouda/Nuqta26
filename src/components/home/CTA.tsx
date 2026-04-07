'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@/navigation';

export default function CTA() {
    const t = useTranslations('Index');

    return (
        <section className="py-16 md:py-24 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative bg-gradient-to-br from-accent via-accent to-primary/80 rounded-3xl md:rounded-[3rem] p-8 md:p-16 text-center text-white overflow-hidden"
                >
                    {/* Background decorations */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 800 400" fill="none">
                            <path
                                d="M-50,350 C100,200 300,100 400,200 S600,350 850,150"
                                stroke="white"
                                strokeWidth="3"
                                strokeDasharray="10 10"
                            />
                            <circle cx="200" cy="280" r="6" fill="white" />
                            <circle cx="500" cy="220" r="4" fill="white" />
                            <circle cx="700" cy="180" r="5" fill="white" />
                        </svg>
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/30 rounded-full blur-[60px]" />
                        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-secondary/10 rounded-full blur-[50px]" />
                    </div>

                    <div className="relative z-10 space-y-6 md:space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15">
                            <Sparkles className="w-3.5 h-3.5 text-secondary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {t('cta.ready_to_start')}
                            </span>
                        </div>

                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                            {t('cta.title')}
                        </h2>

                        <p className="text-white/60 text-sm md:text-lg max-w-md mx-auto font-medium">
                            {t('cta.user_desc')}
                        </p>

                        {/* Primary attendee CTA */}
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent font-bold rounded-2xl shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm md:text-base"
                        >
                            <span>{t('joinNow')}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        {/* Subtle organizer bridge */}
                        <p className="text-white/30 text-xs md:text-sm font-medium pt-2">
                            {t('cta.organizer_bridge')}{' '}
                            <Link
                                href="/for-vendors"
                                className="text-white/50 hover:text-white underline underline-offset-2 transition-colors"
                            >
                                {t('cta.organizer_bridge_link')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
