'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Users, Zap, Clock } from 'lucide-react';
import { Link } from '@/navigation';
import { useState, useEffect, useRef } from 'react';

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
    const [display, setDisplay] = useState(target);
    const ref = useRef<HTMLSpanElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    // Extract number from target string
                    const numMatch = target.replace(/[^0-9]/g, '');
                    const finalNum = parseInt(numMatch) || 0;
                    if (finalNum === 0) { setDisplay(target); return; }

                    const duration = 1500;
                    const steps = 40;
                    const stepTime = duration / steps;
                    let step = 0;

                    const interval = setInterval(() => {
                        step++;
                        const progress = step / steps;
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = Math.round(finalNum * eased);
                        // Preserve original format
                        setDisplay(target.replace(numMatch, current.toLocaleString()));
                        if (step >= steps) {
                            clearInterval(interval);
                            setDisplay(target);
                        }
                    }, stepTime);

                    return () => clearInterval(interval);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, hasAnimated]);

    return <span ref={ref}>{display}{suffix}</span>;
}

export default function VendorHero() {
    const t = useTranslations('VendorLanding.Hero');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const stats = [
        {
            value: t('stat_organizers'),
            label: t('stat_organizers_label'),
            icon: Users,
        },
        {
            value: t('stat_community'),
            label: t('stat_community_label'),
            icon: Zap,
        },
        {
            value: t('stat_saved'),
            label: t('stat_saved_label'),
            icon: Clock,
        },
    ];

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#264653] via-[#1a3a47] to-[#264653] pt-28 md:pt-36 lg:pt-44 pb-20 md:pb-28 lg:pb-36">
            {/* Decorative elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-[#2CA58D]/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] bg-[#2CA58D]/10 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[80px]" />
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Headline */}
                    <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6 md:mb-8">
                            {t('title')}
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <div className={`transition-all duration-700 delay-150 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                        <p className="text-base sm:text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl mx-auto mb-10 md:mb-12">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* CTA */}
                    <div className={`transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href="/register?role=vendor"
                                className="inline-flex flex-col items-center gap-1.5 px-10 md:px-14 py-4 md:py-5 bg-[#2CA58D] text-white font-black text-base md:text-lg rounded-2xl transition-all duration-300 shadow-2xl shadow-[#2CA58D]/30 hover:shadow-[#2CA58D]/50 hover:scale-[1.03] hover:bg-[#25917b] active:scale-[0.97] group"
                            >
                                <div className="flex items-center gap-3">
                                    <span>{t('cta')}</span>
                                    <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                                </div>
                                <span className="text-xs text-white/70 font-medium">{t('cta_subtitle')}</span>
                            </Link>
                            <Link
                                href="/demo/vendor"
                                className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-4 decoration-white/20 hover:decoration-white/60"
                            >
                                {t('demo_cta')}
                            </Link>
                        </div>
                    </div>

                    {/* Stats Strip */}
                    <div className={`mt-16 md:mt-20 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="text-center group">
                                        <div className="flex justify-center mb-3">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-[#2CA58D]/30 transition-colors duration-300">
                                                <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#2CA58D]" />
                                            </div>
                                        </div>
                                        <div className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1">
                                            <AnimatedCounter target={stat.value} />
                                        </div>
                                        <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest">
                                            {stat.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom wave */}
            <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24">
                <svg viewBox="0 0 1440 96" fill="none" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0 96V32C240 64 480 80 720 64C960 48 1200 32 1440 48V96H0Z" fill="#fffcf9" />
                </svg>
            </div>
        </section>
    );
}
