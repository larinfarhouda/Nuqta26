'use client';

import { useTranslations } from 'next-intl';
import { Users, MessageCircle, ShieldCheck, ArrowRight, Check } from 'lucide-react';

export default function VendorPainPoints() {
    const t = useTranslations('VendorLanding.PainPoints');
    const tWhy = useTranslations('VendorLanding.WhyNuqta');

    const sections = [
        {
            painIcon: Users,
            painTitle: t('pain1_title'),
            painDesc: t('pain1_desc'),
            solutionTitle: tWhy('reason1_title'),
            solutionDesc: tWhy('reason1_desc'),
            metric: t('pain1_metric'),
            metricLabel: t('pain1_metric_label'),
            accent: {
                painBg: 'bg-red-50',
                painIcon: 'text-red-500',
                painBorder: 'border-red-100',
                solBg: 'bg-emerald-50',
                solIcon: 'text-[#2CA58D]',
                solBorder: 'border-[#2CA58D]/20',
                metricColor: 'text-[#2CA58D]',
            },
        },
        {
            painIcon: MessageCircle,
            painTitle: t('pain2_title'),
            painDesc: t('pain2_desc'),
            solutionTitle: tWhy('reason2_title'),
            solutionDesc: tWhy('reason2_desc'),
            metric: t('pain2_metric'),
            metricLabel: t('pain2_metric_label'),
            accent: {
                painBg: 'bg-amber-50',
                painIcon: 'text-amber-500',
                painBorder: 'border-amber-100',
                solBg: 'bg-emerald-50',
                solIcon: 'text-[#2CA58D]',
                solBorder: 'border-[#2CA58D]/20',
                metricColor: 'text-[#2CA58D]',
            },
        },
        {
            painIcon: ShieldCheck,
            painTitle: t('pain3_title'),
            painDesc: t('pain3_desc'),
            solutionTitle: tWhy('reason3_title'),
            solutionDesc: tWhy('reason3_desc'),
            metric: t('pain3_metric'),
            metricLabel: t('pain3_metric_label'),
            accent: {
                painBg: 'bg-purple-50',
                painIcon: 'text-purple-500',
                painBorder: 'border-purple-100',
                solBg: 'bg-emerald-50',
                solIcon: 'text-[#2CA58D]',
                solBorder: 'border-[#2CA58D]/20',
                metricColor: 'text-[#2CA58D]',
            },
        },
    ];

    return (
        <section className="py-16 md:py-24 bg-[#fafbfc] relative overflow-hidden">
            <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-red-500/3 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-20 -right-20 w-[300px] h-[300px] bg-[#2CA58D]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-100 mb-5">
                        {t('badge')}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 font-medium max-w-xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Problem → Solution Cards */}
                <div className="max-w-5xl mx-auto space-y-6">
                    {sections.map((section, idx) => {
                        const PainIcon = section.painIcon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group"
                            >
                                <div className="grid md:grid-cols-2">
                                    {/* Problem Side */}
                                    <div className={`p-6 md:p-8 border-b md:border-b-0 md:border-e ${section.accent.painBorder} bg-gray-50/50`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl ${section.accent.painBg} flex items-center justify-center flex-shrink-0`}>
                                                <PainIcon className={`w-5 h-5 ${section.accent.painIcon}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">THE PROBLEM</p>
                                                <h3 className="text-base md:text-lg font-black text-gray-900 mb-2">
                                                    {section.painTitle}
                                                </h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    {section.painDesc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Solution Side */}
                                    <div className="p-6 md:p-8 relative">
                                        {/* Arrow connector (desktop only) */}
                                        <div className="hidden md:flex absolute -start-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-gray-200 items-center justify-center shadow-sm z-10">
                                            <ArrowRight className="w-4 h-4 text-[#2CA58D] rtl:rotate-180" />
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl ${section.accent.solBg} flex items-center justify-center flex-shrink-0`}>
                                                <Check className={`w-5 h-5 ${section.accent.solIcon}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-[#2CA58D] uppercase tracking-widest mb-2">THE SOLUTION</p>
                                                <h3 className="text-base md:text-lg font-black text-gray-900 mb-2">
                                                    {section.solutionTitle}
                                                </h3>
                                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                                    {section.solutionDesc}
                                                </p>

                                                {/* Metric */}
                                                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#2CA58D]/5 rounded-xl border border-[#2CA58D]/10">
                                                    <span className={`text-2xl font-black ${section.accent.metricColor}`}>
                                                        {section.metric}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        {section.metricLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
