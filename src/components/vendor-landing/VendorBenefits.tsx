'use client';

import { useTranslations } from 'next-intl';
import { X, Check, Zap, Users2, Palette, Globe, Share2 } from 'lucide-react';

export default function VendorBenefits() {
    const t = useTranslations('VendorLanding.WhyNuqta');
    const tBenefits = useTranslations('VendorLanding.Benefits');

    const comparisons = [
        {
            label: t('reason1.problem_title'),
            without: t('reason1.problem_desc').split('.')[0] + '.',
            with: t('reason1.solution_title'),
        },
        {
            label: t('reason2.problem_title'),
            without: t('reason2.problem_desc').split('.')[0] + '.',
            with: t('reason2.solution_title'),
        },
        {
            label: t('reason3.problem_title'),
            without: t('reason3.problem_desc').split('.')[0] + '.',
            with: t('reason3.solution_title'),
        },
    ];

    const extraPerks = [
        { icon: <Zap className="w-5 h-5" />, label: tBenefits('express_setup') },
        { icon: <Users2 className="w-5 h-5" />, label: tBenefits('community_focus') },
        { icon: <Palette className="w-5 h-5" />, label: tBenefits('brand_customization') },
        { icon: <Globe className="w-5 h-5" />, label: tBenefits('multi_language') },
        { icon: <Share2 className="w-5 h-5" />, label: tBenefits('social_media_ready') },
    ];

    return (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#2CA58D]/5 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2CA58D]/10 text-[#2CA58D] rounded-full text-xs md:text-sm font-bold uppercase tracking-wider border border-[#2CA58D]/20 mb-5">
                        {tBenefits('advantage')}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Before/After Comparison Cards */}
                <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 mb-16 md:mb-20">
                    {comparisons.map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-[#fffcf9] rounded-2xl md:rounded-3xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                        >
                            <div className="grid md:grid-cols-2">
                                {/* Without */}
                                <div className="p-5 md:p-7 border-b md:border-b-0 md:border-e border-gray-100 bg-gray-50/50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <X className="w-4 h-4 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">Without Nuqta</p>
                                            <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                                                {item.without}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* With */}
                                <div className="p-5 md:p-7">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-4 h-4 text-[#2CA58D]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#2CA58D] uppercase tracking-wider mb-1.5">With Nuqta</p>
                                            <p className="text-sm md:text-base text-gray-900 font-semibold leading-relaxed">
                                                {item.with}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Extra Perks Row */}
                <div className="pt-12 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 max-w-4xl mx-auto">
                    {extraPerks.map((perk, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 group">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#2CA58D]/10 group-hover:text-[#2CA58D] transition-all duration-300 border border-transparent group-hover:border-[#2CA58D]/20">
                                {perk.icon}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#2CA58D] transition-colors text-center">
                                {perk.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
