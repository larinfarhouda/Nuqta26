'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';

export default function Hero() {
    const t = useTranslations('Index');

    return (
        <section className="relative w-[calc(100%-1rem)] md:w-full h-[32vh] md:h-[650px] m-2 md:m-0 rounded-[2rem] md:rounded-b-[2.5rem] md:rounded-t-none overflow-hidden bg-white border border-secondary/20 md:border-b md:border-secondary/20 md:border-x-0 md:border-t-0 mx-auto shadow-sm md:shadow-none">
            {/* 1. Enhanced Gradients (More Visible) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -right-[10%] w-[800px] h-[800px] bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-[80px]" />
                <div className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-secondary to-secondary/50 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-20%] right-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[60px]" />
            </div>

            {/* 2. Logo-Inspired Pattern: Animated Dashed Paths */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
                <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="xMidYMid slice">
                    {/* Path 1: Curving from left */}
                    <motion.path
                        d="M-100,600 C200,600 400,200 800,400"
                        stroke="url(#gradient-line)"
                        strokeWidth="5"
                        strokeDasharray="15 15"
                        strokeLinecap="round"
                        style={{ pathLength: 1, opacity: 1 }}
                        animate={{ strokeDashoffset: [0, -1000] }}
                        transition={{
                            strokeDashoffset: { duration: 20, repeat: Infinity, ease: "linear" }
                        }}
                    />
                    {/* Path 2: Curving from bottom right */}
                    <motion.path
                        d="M1540,700 C1200,700 1000,100 600,200"
                        stroke="url(#gradient-line-2)"
                        strokeWidth="5"
                        strokeDasharray="15 15"
                        strokeLinecap="round"
                        style={{ pathLength: 1, opacity: 1 }}
                        animate={{ strokeDashoffset: [0, 1000] }}
                        transition={{
                            strokeDashoffset: { duration: 25, repeat: Infinity, ease: "linear" }
                        }}
                    />
                    <defs>
                        <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gradient-line-2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
                            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* 3. Floating "Nodes" (Circles from logo) */}
            <div className="absolute inset-0 pointer-events-none">
                <FloatingNode className="top-[15%] left-[10%]" size={20} delay={0} />
                <FloatingNode className="top-[45%] right-[15%]" size={30} delay={1.5} />
                <FloatingNode className="bottom-[20%] left-[20%]" size={15} delay={3} />
            </div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 md:px-6 max-w-5xl mx-auto">
                {/* Brand Badge - Visible on all screens again to fill space */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white border border-secondary/20 text-accent mb-2 md:mb-8 shadow-md shadow-accent/5 backdrop-blur-sm"
                >
                    <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                    <span className="text-xs md:text-sm font-semibold tracking-wide uppercase">
                        {t('hero.connected_community')}
                    </span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-2xl md:text-5xl lg:text-6xl font-black tracking-tight text-accent mb-2 md:mb-6 leading-tight md:leading-[1.1]"
                >
                    {t.rich('title', {
                        br: () => <br className="hidden md:block" />,
                        highlight: (chunks) => (
                            <span className="text-primary relative inline-block">
                                {chunks}
                            </span>
                        )
                    })}
                </motion.h1>

                {/* Description - Visible again on mobile, but smaller */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xs md:text-xl text-accent/70 max-w-2xl mx-auto leading-relaxed mb-0 md:mb-10 font-medium px-4 md:px-0"
                >
                    {t('description')}
                </motion.p>

                {/* Actions - Hidden on mobile */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="hidden md:flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <Link
                        href="/register"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white text-sm md:text-base font-bold rounded-full hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25 ring-4 ring-primary/5"
                    >
                        <span>{t('hero.discover_more')}</span>
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

function FloatingNode({ className, size, delay }: { className: string, size: number, delay: number }) {
    return (
        <motion.div
            className={`absolute rounded-full border-[3px] border-primary/20 ${className}`}
            style={{ width: size, height: size }}
            animate={{
                y: [0, -20, 0],
                rotate: [0, 90, 0],
                scale: [1, 1.1, 1]
            }}
            transition={{
                duration: 6,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
            }}
        >
            <div className="w-full h-full rounded-full bg-primary/5" />
        </motion.div>
    );
}
