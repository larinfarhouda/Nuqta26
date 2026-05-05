'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Users, Zap, Clock, CheckCircle2, Calendar, TrendingUp, Star } from 'lucide-react';
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
                    const numMatch = target.replace(/[^0-9.]/g, '');
                    const finalNum = parseFloat(numMatch) || 0;
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
        { value: t('stat_organizers'), label: t('stat_organizers_label'), icon: Users },
        { value: t('stat_community'), label: t('stat_community_label'), icon: Zap },
        { value: t('stat_saved'), label: t('stat_saved_label'), icon: Clock },
    ];

    return (
        <section className="relative overflow-hidden bg-[#fffdfa] pt-28 md:pt-36 lg:pt-40 pb-16 md:pb-24">
            {/* Subtle ambient decorations */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#2CA58D]/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#2CA58D]/5 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-purple-500/3 rounded-full blur-[80px]" />
                {/* Dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.4) 1px, transparent 1px)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
                    {/* Left: Copy */}
                    <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Trust chip */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2CA58D]/8 border border-[#2CA58D]/15 rounded-full text-xs font-bold text-[#2CA58D] mb-6">
                            <div className="flex -space-x-1.5 rtl:space-x-reverse">
                                <div className="w-5 h-5 rounded-full bg-[#2CA58D] flex items-center justify-center ring-2 ring-[#fffdfa]">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                                <div className="w-5 h-5 rounded-full bg-emerald-400 ring-2 ring-[#fffdfa]" />
                                <div className="w-5 h-5 rounded-full bg-teal-300 ring-2 ring-[#fffdfa]" />
                            </div>
                            <span>300+ organizers already automated</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-black text-gray-900 leading-[1.08] tracking-tight mb-6">
                            {t('title')}
                        </h1>

                        <p className="text-base md:text-lg text-gray-500 font-medium leading-relaxed max-w-xl mb-8 md:mb-10">
                            {t('subtitle')}
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
                            <Link
                                href="/register?role=vendor"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-[#2CA58D] text-white font-bold text-base rounded-xl transition-all duration-300 shadow-xl shadow-[#2CA58D]/20 hover:shadow-[#2CA58D]/35 hover:bg-[#25917b] active:scale-[0.97] group"
                            >
                                {t('cta')}
                                <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/demo/vendor"
                                className="inline-flex items-center gap-2 px-6 py-4 text-gray-500 hover:text-gray-900 font-medium text-sm transition-all border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-white hover:shadow-sm"
                            >
                                {t('demo_cta')}
                            </Link>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 md:gap-6 pt-8 border-t border-gray-200/60">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="group">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Icon className="w-4 h-4 text-[#2CA58D]" />
                                            <span className="text-xl md:text-2xl font-black text-gray-900">
                                                <AnimatedCounter target={stat.value} />
                                            </span>
                                        </div>
                                        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            {stat.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Dashboard Mockup */}
                    <div className={`relative transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        <div className="relative">
                            {/* Glow behind mockup */}
                            <div className="absolute inset-0 bg-[#2CA58D]/8 rounded-3xl blur-[40px] scale-95" />

                            {/* Main dashboard card */}
                            <div className="relative bg-gray-900 rounded-2xl md:rounded-3xl border border-gray-800 p-5 md:p-6 shadow-2xl shadow-gray-900/30">
                                {/* Dashboard header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#2CA58D] flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Event Dashboard</p>
                                            <p className="text-[10px] text-white/40">Live overview</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] text-green-400 font-bold">LIVE</span>
                                    </div>
                                </div>

                                {/* Stats grid */}
                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[10px] text-white/40 font-medium mb-1">Bookings</p>
                                        <p className="text-xl font-black text-white">247</p>
                                        <p className="text-[10px] text-green-400 font-bold">+18% ↑</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[10px] text-white/40 font-medium mb-1">Revenue</p>
                                        <p className="text-xl font-black text-white">₺12.4K</p>
                                        <p className="text-[10px] text-green-400 font-bold">+24% ↑</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[10px] text-white/40 font-medium mb-1">Rating</p>
                                        <div className="flex items-center gap-1">
                                            <p className="text-xl font-black text-white">4.9</p>
                                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        </div>
                                        <p className="text-[10px] text-white/40 font-bold">142 reviews</p>
                                    </div>
                                </div>

                                {/* Mini chart */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-white/60">Monthly Bookings</p>
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="w-3.5 h-3.5 text-[#2CA58D]" />
                                            <span className="text-xs font-bold text-[#2CA58D]">+34%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1.5 h-16">
                                        {[35, 45, 30, 55, 40, 65, 50, 75, 60, 85, 70, 95].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-sm transition-all duration-500"
                                                style={{
                                                    height: `${h}%`,
                                                    background: i >= 10 ? '#2CA58D' : i >= 8 ? 'rgba(44,165,141,0.6)' : 'rgba(255,255,255,0.08)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Recent booking */}
                                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#2CA58D]/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-[#2CA58D]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">New booking confirmed</p>
                                            <p className="text-[10px] text-white/40">Email sent automatically • Just now</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-[#2CA58D]">₺150</span>
                                </div>
                            </div>

                            {/* Floating cards */}
                            <div className="absolute -top-3 -end-3 md:-end-6 bg-white rounded-xl shadow-xl shadow-black/8 p-3 flex items-center gap-2.5 animate-float-slow z-20 border border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-900">Booking Confirmed ✨</p>
                                    <p className="text-[9px] text-gray-400">Email sent in AR + EN</p>
                                </div>
                            </div>

                            <div className="absolute -bottom-2 -start-3 md:-start-6 bg-white rounded-xl shadow-xl shadow-black/8 p-3 flex items-center gap-2.5 animate-float-delayed z-20 border border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-900">New Review ⭐</p>
                                    <p className="text-[9px] text-gray-400">&quot;Amazing experience!&quot; — 5.0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom edge fade into next section */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fafbfc] to-transparent" />

            {/* Float animations */}
            <style jsx>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 4s ease-in-out infinite;
                    animation-delay: 1.5s;
                }
            `}</style>
        </section>
    );
}
