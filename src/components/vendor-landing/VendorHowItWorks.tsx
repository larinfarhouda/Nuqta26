'use client';

import { useTranslations } from 'next-intl';
import { UserPlus, CalendarPlus, TrendingUp } from 'lucide-react';

export default function VendorHowItWorks() {
    const t = useTranslations('VendorLanding.HowItWorks');

    const steps = [
        {
            icon: UserPlus,
            num: '01',
            titleKey: 'step1_title',
            descKey: 'step1_desc',
            color: 'from-[#2CA58D]/10 to-[#2CA58D]/5',
            iconColor: 'text-[#2CA58D] bg-[#2CA58D]/10',
        },
        {
            icon: CalendarPlus,
            num: '02',
            titleKey: 'step2_title',
            descKey: 'step2_desc',
            color: 'from-[#264653]/10 to-[#264653]/5',
            iconColor: 'text-[#264653] bg-[#264653]/10',
        },
        {
            icon: TrendingUp,
            num: '03',
            titleKey: 'step3_title',
            descKey: 'step3_desc',
            color: 'from-emerald-500/10 to-emerald-500/5',
            iconColor: 'text-emerald-600 bg-emerald-500/10',
        },
    ];

    return (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#2CA58D]/5 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-14 md:mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2CA58D]/10 text-[#2CA58D] rounded-full text-xs md:text-sm font-bold uppercase tracking-wider border border-[#2CA58D]/20 mb-5">
                        {t('badge')}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Steps */}
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 relative">
                        {/* Connecting line (desktop only) */}
                        <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-[2px] bg-gradient-to-r from-[#2CA58D]/30 via-[#264653]/30 to-emerald-500/30 z-0" />

                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <div key={idx} className="relative z-10 text-center group">
                                    {/* Step number circle */}
                                    <div className="flex justify-center mb-6">
                                        <div className={`relative w-[120px] h-[120px] rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                                            <div className={`w-16 h-16 rounded-2xl ${step.iconColor} flex items-center justify-center`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            {/* Step number */}
                                            <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#264653] text-white text-xs font-black flex items-center justify-center shadow-lg">
                                                {step.num}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">
                                        {t(step.titleKey)}
                                    </h3>
                                    <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-xs mx-auto">
                                        {t(step.descKey)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
