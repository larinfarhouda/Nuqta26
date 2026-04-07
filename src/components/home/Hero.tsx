'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountryName } from '@/hooks/useCountry';
import { useEffect, useState } from 'react';

const FLOATING_EMOJIS = ['🎨', '🎵', '🛍️', '🎪', '✨', '📸', '🎭', '🍽️'];

export default function Hero() {
    const t = useTranslations('Index');
    const countryName = useCountryName();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <section className="relative w-full min-h-[55vh] md:min-h-[70vh] flex flex-col items-center justify-center overflow-hidden pt-24 md:pt-32">
            {/* Warm gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-secondary via-white to-white" />

            {/* Teal glow accents */}
            <div className="absolute top-0 right-[-10%] w-[60%] h-[60%] bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-[80px] pointer-events-none" />

            {/* Floating emojis — desktop & larger mobile only */}
            {mounted && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {FLOATING_EMOJIS.map((emoji, i) => (
                        <FloatingEmoji key={i} emoji={emoji} index={i} />
                    ))}
                </div>
            )}

            {/* Dashed path decoration (like the logo) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12]" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="xMidYMid slice">
                <motion.path
                    d="M-100,500 C200,300 600,600 900,200 S1200,400 1540,300"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeDasharray="12 12"
                    strokeLinecap="round"
                    animate={{ strokeDashoffset: [0, -200] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
                <motion.path
                    d="M-50,700 C300,500 500,800 800,500 S1100,600 1500,400"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    strokeDasharray="8 16"
                    strokeLinecap="round"
                    animate={{ strokeDashoffset: [0, 200] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                {/* Small "nuqta" dots along the paths */}
                {[
                    { cx: 200, cy: 400 },
                    { cx: 600, cy: 500 },
                    { cx: 1000, cy: 300 },
                    { cx: 1300, cy: 350 },
                ].map((dot, i) => (
                    <motion.circle
                        key={i}
                        cx={dot.cx}
                        cy={dot.cy}
                        r="5"
                        fill="var(--color-primary)"
                        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                    />
                ))}
            </svg>

            {/* Content */}
            <div className="relative z-10 text-center px-6 md:px-8 max-w-3xl mx-auto flex flex-col items-center gap-4 md:gap-6">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary/15 shadow-sm"
                >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-accent tracking-wide uppercase">
                        {t('hero.connected_community')}
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-accent leading-snug md:leading-[1.12]"
                >
                    {t.rich('title', {
                        country: countryName,
                        br: () => <br className="hidden md:block" />,
                        highlight: (chunks) => (
                            <span className="relative inline-block text-primary">
                                {chunks}
                                <motion.span
                                    className="absolute -bottom-1 left-0 w-full h-2 bg-secondary rounded-full -z-10"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                    style={{ originX: 0 }}
                                />
                            </span>
                        )
                    })}
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-sm md:text-lg text-accent/60 max-w-xl mx-auto leading-relaxed font-medium"
                >
                    {t('description')}
                </motion.p>

                {/* Scroll indicator on mobile */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-2 md:mt-4"
                >
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center gap-1 text-primary/40"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

function FloatingEmoji({ emoji, index }: { emoji: string; index: number }) {
    // Deterministic positions based on index for SSR consistency
    const positions = [
        { top: '12%', left: '8%' },
        { top: '20%', right: '12%' },
        { top: '55%', left: '6%' },
        { top: '60%', right: '8%' },
        { top: '35%', left: '15%' },
        { top: '75%', right: '15%' },
        { top: '45%', right: '20%' },
        { top: '80%', left: '18%' },
    ];

    const pos = positions[index % positions.length];

    return (
        <motion.span
            className="absolute text-xl md:text-2xl select-none hidden sm:block"
            style={pos}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
                opacity: [0, 0.6, 0.3, 0.6, 0],
                y: [0, -15, 5, -10, 0],
                rotate: [0, 8, -5, 3, 0],
            }}
            transition={{
                duration: 8 + index * 1.5,
                repeat: Infinity,
                delay: index * 0.6,
                ease: "easeInOut"
            }}
        >
            {emoji}
        </motion.span>
    );
}
