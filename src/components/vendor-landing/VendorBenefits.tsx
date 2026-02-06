'use client';

import { useTranslations } from 'next-intl';
import { Target, Zap, ShieldCheck, Users2, Palette, Globe, AlertCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function VendorBenefits() {
    const t = useTranslations('VendorLanding.WhyNuqta');
    const tBenefits = useTranslations('VendorLanding.Benefits');
    const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);

    const benefits = [
        {
            id: 'reason1',
            icon: Target,
            color: {
                primary: "text-rose-500",
                bg: "bg-rose-50",
                border: "border-rose-200",
                hover: "hover:border-rose-300"
            }
        },
        {
            id: 'reason2',
            icon: Zap,
            color: {
                primary: "text-emerald-500",
                bg: "bg-emerald-50",
                border: "border-emerald-200",
                hover: "hover:border-emerald-300"
            }
        },
        {
            id: 'reason3',
            icon: ShieldCheck,
            color: {
                primary: "text-amber-500",
                bg: "bg-amber-50",
                border: "border-amber-200",
                hover: "hover:border-amber-300"
            }
        }
    ];

    const extraPerks = [
        { icon: <Zap />, label: tBenefits("express_setup") },
        { icon: <Users2 />, label: tBenefits("community_focus") },
        { icon: <Palette />, label: tBenefits("brand_customization") },
        { icon: <Globe />, label: tBenefits("multi_language") }
    ];

    return (
        <section className="py-20 md:py-24 lg:py-32 bg-white relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-[30%] md:w-[40%] h-[30%] md:h-[40%] bg-secondary/10 rounded-full blur-[80px] md:blur-[120px] -mr-16 md:-mr-32 -mt-16 md:-mt-32 opacity-50 md:opacity-100" />
            <div className="absolute bottom-0 left-0 w-[20%] md:w-[30%] h-[20%] md:h-[30%] bg-primary/5 rounded-full blur-[60px] md:blur-[100px] -ml-12 md:-ml-24 -mb-12 md:-mb-24 opacity-50 md:opacity-100" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-4xl mx-auto text-center mb-16 md:mb-20 space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-black uppercase tracking-widest border border-primary/20">
                        <span>{tBenefits('advantage')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Benefits Grid - PAS Framework */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12">
                    {benefits.map((benefit, idx) => {
                        const Icon = benefit.icon;
                        const isExpanded = expandedBenefit === idx;

                        return (
                            <div
                                key={benefit.id}
                                className={`group p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] bg-[#fffcf9] border-2 ${benefit.color.border} ${benefit.color.hover} transition-all duration-500 hover:shadow-[0_30px_70px_-15px_rgba(45,116,116,0.15)] relative overflow-hidden h-full flex flex-col`}
                            >
                                {/* Icon */}
                                <div className={`p-5 md:p-6 rounded-2xl md:rounded-[2rem] ${benefit.color.bg} ${benefit.color.primary} mb-6 md:mb-8 shadow-lg md:shadow-xl transition-all duration-500 md:group-hover:scale-110 md:group-hover:rotate-6 w-fit`}>
                                    <Icon className="w-6 h-6 md:w-8 md:h-8" />
                                </div>

                                {/* Problem (Always visible) */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-xs font-black uppercase tracking-widest text-red-600">المشكلة</span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">{t(`${benefit.id}.problem_title`)}</h3>
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{t(`${benefit.id}.problem_desc`)}</p>
                                </div>

                                {/* Agitate */}
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    <p className="text-xs md:text-sm text-gray-500 italic">{t(`${benefit.id}.agitate`)}</p>
                                </div>

                                {/* Solution */}
                                <div className={`p-4 md:p-5 ${benefit.color.bg} rounded-xl md:rounded-2xl mb-4`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className={`w-4 h-4 ${benefit.color.primary}`} />
                                        <span className={`text-xs font-black uppercase tracking-widest ${benefit.color.primary}`}>الحل</span>
                                    </div>
                                    <h4 className="text-base md:text-lg font-black text-gray-900 mb-2">{t(`${benefit.id}.solution_title`)}</h4>
                                    <p className="text-sm md:text-base text-gray-700 leading-relaxed font-medium">{t(`${benefit.id}.solution_desc`)}</p>
                                </div>

                                {/* Metric */}
                                <div className="mt-auto pt-4 border-t border-gray-200 text-center">
                                    <div className={`text-2xl md:text-3xl font-black ${benefit.color.primary}`}>
                                        {t(`${benefit.id}.metric`)}
                                    </div>
                                    <div className="text-xs md:text-sm font-bold text-gray-600 uppercase">
                                        {t(`${benefit.id}.metric_label`)}
                                    </div>
                                </div>

                                {/* Verified Badge for benefit 3 */}
                                {idx === 2 && (
                                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>{t('verified_badge')}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTAs */}
                <div className="text-center mb-16 md:mb-20">
                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                        <a
                            href="#pricing"
                            className="px-6 md:px-8 py-3 md:py-4 bg-primary text-white font-black rounded-xl md:rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-sm md:text-base"
                        >
                            {t('cta_benefits')}
                        </a>
                        <a
                            href="/register"
                            className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-primary text-primary font-black rounded-xl md:rounded-2xl hover:bg-primary/5 transition-all text-sm md:text-base"
                        >
                            {t('cta_demo')}
                        </a>
                    </div>
                </div>

                {/* Extra Perks Row */}
                <div className="pt-12 md:pt-16 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {extraPerks.map((perk, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 md:gap-3 group">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500 border border-transparent group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5">
                                {perk.icon}
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-primary transition-colors text-center">{perk.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
