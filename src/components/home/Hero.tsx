'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
    const t = useTranslations('Index');

    return (
        <div className="relative pt-20 pb-12 px-4 container mx-auto z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">

                {/* Text Content */}
                <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/50 backdrop-blur-md text-primary rounded-full text-xs font-bold border border-primary/20 shadow-sm"
                    >
                        <Sparkles className="w-3" />
                        <span>Istanbul's Arab Community Hub</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight"
                    >
                        {t.rich('title', {
                            br: () => <br className="hidden md:block" />,
                            highlight: (chunks) => <span className="text-primary italic relative">
                                {chunks}
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="2" fill="transparent" className="opacity-30" />
                                </svg>
                            </span>
                        })}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0"
                    >
                        {t('description')}
                    </motion.p>
                </div>

                {/* Illustration / Image */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="flex-1 relative w-full max-w-[500px] aspect-square"
                >
                    <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-3 transition-transform group-hover:rotate-0" />
                    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                        <Image
                            src="/images/hero_community.png"
                            alt="Community illustration"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    {/* Floating decoration */}
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100 animate-bounce-slow">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <MapPin className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Located in</p>
                            <p className="font-bold text-gray-900">Istanbul, Turkey</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
