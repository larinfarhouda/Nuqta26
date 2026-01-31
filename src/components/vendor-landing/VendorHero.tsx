'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, TrendingUp, Users, Calendar, CheckCircle2, Zap, Heart } from 'lucide-react';
import { Link } from '@/navigation';
import { useState, useEffect } from 'react';

export default function VendorHero() {
    const t = useTranslations('VendorLanding.Hero');
    const tCommon = useTranslations('VendorHero');
    const [isLoaded, setIsLoaded] = useState(false);
    const [chartBars, setChartBars] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    useEffect(() => {
        setIsLoaded(true);
        // Animate chart bars
        const timeout = setTimeout(() => {
            setChartBars([30, 50, 45, 80, 60, 40, 95, 70, 85, 90]);
        }, 600);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="relative overflow-hidden bg-[#fffcf9] pt-24 md:pt-32 lg:pt-40 pb-12 md:pb-16 lg:pb-24">
            {/* Rich Ambient Background Elements - Reduced on mobile */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-[10%] -right-[5%] w-[40%] md:w-[50%] aspect-square bg-primary/10 rounded-full blur-[80px] md:blur-[120px] opacity-40 md:opacity-60" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] md:w-[40%] aspect-square bg-secondary/30 rounded-full blur-[60px] md:blur-[100px] opacity-30 md:opacity-40" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col gap-10 md:gap-12 lg:flex-row lg:items-center lg:gap-20">

                        {/* Content Section */}
                        <div className={`flex-1 text-center lg:text-start space-y-5 md:space-y-6 lg:space-y-10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="inline-flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 bg-secondary/40 backdrop-blur-sm md:backdrop-blur-md text-primary rounded-full text-xs md:text-sm font-black border border-secondary/40 shadow-lg md:shadow-xl shadow-secondary/10">
                                <Heart className="w-4 h-4 fill-primary" />
                                <span>{tCommon('join_hub')}</span>
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight">
                                {t('title')}
                            </h1>

                            <p className="text-base md:text-lg lg:text-xl text-gray-600 font-medium leading-relaxed max-w-xl mx-auto lg:ms-0 lg:me-auto">
                                {t('subtitle')}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 md:gap-6">
                                <Link
                                    href="/register?role=vendor"
                                    className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-primary text-white font-black rounded-2xl md:rounded-[2rem] transition-all shadow-xl md:shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-2 md:gap-3 group text-lg md:text-xl"
                                >
                                    <span>{t('cta')}</span>
                                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rtl:rotate-180 group-hover:translate-x-2 transition-transform rtl:group-hover:-translate-x-2" />
                                </Link>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                                                <img src={`https://i.pravatar.cc/100?u=v${i}`} alt="Vendor" loading="lazy" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest">{tCommon('trusted_partners')}</span>
                                </div>
                            </div>

                            {/* Trust Perks */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 md:gap-x-8 gap-y-2 md:gap-y-3 pt-3 md:pt-4 border-t border-gray-100">
                                {['audience', 'setup_fee', 'analytics'].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-gray-500 text-xs md:text-sm lg:text-base font-bold">
                                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                                        </div>
                                        <span>{tCommon(`perks.${item}`)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive UI Display */}
                        <div className={`flex-1 relative transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className="relative mx-auto max-w-[500px] lg:max-w-none">
                                <div className="bg-white rounded-3xl md:rounded-[4rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] md:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-secondary/10 overflow-hidden relative group">
                                    {/* Mock App Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-white px-6 md:px-8 py-4 md:py-6 border-b border-gray-50 flex items-center justify-between">
                                        <div className="flex gap-1.5 md:gap-2">
                                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400" />
                                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-400" />
                                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em]">{tCommon('mock.dashboard_title')}</div>
                                    </div>

                                    {/* Mock Content */}
                                    <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 lg:space-y-10">
                                        {/* Stats Row */}
                                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                                            <div className="bg-secondary/10 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex flex-col gap-1.5 md:gap-2 border border-secondary/20 hover:bg-secondary/20 transition-colors">
                                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                                <span className="text-2xl md:text-3xl font-black text-gray-900">+127%</span>
                                                <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest leading-none">{tCommon('mock.monthly_growth')}</span>
                                            </div>
                                            <div className="bg-primary/5 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex flex-col gap-1.5 md:gap-2 border border-primary/10 hover:bg-primary/10 transition-colors">
                                                <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                                <span className="text-2xl md:text-3xl font-black text-gray-900">1.2k</span>
                                                <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest leading-none">{tCommon('mock.direct_inquiries')}</span>
                                            </div>
                                        </div>

                                        {/* Chart Area */}
                                        <div className="space-y-4 md:space-y-5">
                                            <h4 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                {tCommon('mock.performance_trend')}
                                            </h4>
                                            <div className="flex justify-between items-end h-32 md:h-40 gap-1 md:gap-2 px-1">
                                                {chartBars.map((h, i) => (
                                                    <div
                                                        key={i}
                                                        style={{ height: isLoaded ? `${h}%` : '0%' }}
                                                        className={`flex-1 rounded-t-xl md:rounded-t-2xl shadow-md md:shadow-lg transition-all duration-700 ease-out ${i === 8 ? 'bg-primary' : 'bg-primary/10'}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-[8px] md:text-[10px] font-black text-gray-300 px-1 uppercase tracking-tighter">
                                                <span>{tCommon('mock.jan')}</span><span>{tCommon('mock.feb')}</span><span>{tCommon('mock.mar')}</span><span>{tCommon('mock.apr')}</span><span>{tCommon('mock.may')}</span><span>{tCommon('mock.jun')}</span><span>{tCommon('mock.jul')}</span><span>{tCommon('mock.aug')}</span><span>{tCommon('mock.sep')}</span><span className="text-primary">{tCommon('mock.today')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badges - Hidden on mobile for performance */}
                                <div className="absolute -top-10 -right-6 hidden lg:flex bg-white p-4 md:p-5 rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 gap-3 md:gap-4 items-center z-20 animate-float">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                        <Zap className="w-6 h-6 md:w-8 md:h-8 fill-white" />
                                    </div>
                                    <div className="pr-4 md:pr-6">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{tCommon('mock.verified')}</p>
                                        <p className="text-lg md:text-xl font-black text-gray-900">{tCommon('mock.premium_account')}</p>
                                    </div>
                                </div>

                                <div className="absolute -bottom-10 -left-10 hidden xl:flex bg-white p-5 md:p-6 rounded-2xl md:rounded-[3rem] shadow-2xl border border-gray-100 gap-4 md:gap-5 items-center z-20 animate-float-slow">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-secondary flex items-center justify-center shadow-xl shadow-secondary/20">
                                        <Calendar className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                                    </div>
                                    <div className="pr-6 md:pr-8">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{tCommon('mock.total_sales')}</p>
                                        <p className="text-2xl md:text-3xl font-black text-gray-900">2.4k {tCommon('mock.tickets')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(2deg); }
                    50% { transform: translateY(-15px) rotate(-2deg); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(15px) rotate(2deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-slow {
                    animation: float-slow 7s ease-in-out 1s infinite;
                }
            `}</style>
        </div>
    );
}
