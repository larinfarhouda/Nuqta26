'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/navigation';

export default function Hero() {
    const t = useTranslations('Index');

    return (
        <section className="relative h-[450px] md:h-[550px] w-full rounded-[2.5rem] overflow-hidden group bg-black shadow-2xl">
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src="/images/hero_community.png"
                    alt="Nuqta Community"
                    fill
                    className="object-cover opacity-65 transition-transform duration-[15s] group-hover:scale-105"
                    priority
                />
            </div>

            {/* Standard Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent z-10" />

            <div className="absolute inset-0 flex items-center z-20">
                <div className="container mx-auto px-8 md:px-16">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight [text-shadow:0_4px_12px_rgba(0,0,0,0.5)]">
                                {t.rich('title', {
                                    br: () => <br className="hidden md:block" />,
                                    highlight: (chunks) => <span className="text-primary italic">{chunks}</span>
                                })}
                            </h1>

                            <p className="text-sm md:text-base text-white/90 font-bold max-w-xl leading-relaxed [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
                                {t('description')}
                            </p>

                            <div className="pt-4 flex flex-wrap gap-4 items-center">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:bg-white hover:text-gray-900 transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest"
                                >
                                    <span>{t('hero.discover_more')}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Link>

                                <div className="hidden lg:flex items-center gap-3 px-6 py-3.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 text-white font-bold text-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{t('hero.connected_community')}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
