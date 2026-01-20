'use client';

import { useTranslations } from 'next-intl';
import { Target, ShieldCheck, BarChart3, Users2, Zap, Palette, Globe } from 'lucide-react';

export default function VendorBenefits() {
    const t = useTranslations('VendorLanding.WhyNuqta');
    const tBenefits = useTranslations('VendorLanding.Benefits');

    const benefits = [
        {
            icon: <Target className="w-6 h-6 md:w-8 md:h-8" />,
            title: t('reason1_title'),
            desc: t('reason1_desc'),
            color: "text-rose-500 bg-rose-50"
        },
        {
            icon: <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />,
            title: t('reason2_title'),
            desc: t('reason2_desc'),
            color: "text-emerald-500 bg-emerald-50"
        },
        {
            icon: <BarChart3 className="w-6 h-6 md:w-8 md:h-8" />,
            title: t('reason3_title'),
            desc: t('reason3_desc'),
            color: "text-amber-500 bg-amber-50"
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
            {/* Added warm decorative shapes - Reduced on mobile */}
            <div className="absolute top-0 right-0 w-[30%] md:w-[40%] h-[30%] md:h-[40%] bg-secondary/10 rounded-full blur-[80px] md:blur-[120px] -mr-16 md:-mr-32 -mt-16 md:-mt-32 opacity-50 md:opacity-100" />
            <div className="absolute bottom-0 left-0 w-[20%] md:w-[30%] h-[20%] md:h-[30%] bg-primary/5 rounded-full blur-[60px] md:blur-[100px] -ml-12 md:-ml-24 -mb-12 md:-mb-24 opacity-50 md:opacity-100" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16 md:mb-20 space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-black uppercase tracking-widest border border-primary/20">
                        <span>{tBenefits('advantage')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight">
                        {t('title')}
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
                    {benefits.map((benefit, idx) => (
                        <div
                            key={idx}
                            className="group p-8 md:p-10 rounded-3xl md:rounded-[3.5rem] bg-[#fffcf9] border border-secondary/20 hover:border-primary transition-all duration-500 hover:shadow-[0_30px_70px_-15px_rgba(45,116,116,0.15)] md:hover:shadow-[0_50px_100px_-20px_rgba(45,116,116,0.15)] relative overflow-hidden h-full flex flex-col items-center text-center"
                        >
                            <div className={`p-5 md:p-6 rounded-2xl md:rounded-[2rem] ${benefit.color} mb-6 md:mb-8 shadow-lg md:shadow-xl transition-all duration-500 md:group-hover:scale-110 md:group-hover:rotate-6`}>
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 md:mb-4 tracking-tight">{benefit.title}</h3>
                            <p className="text-base md:text-lg text-gray-500 font-medium leading-relaxed">{benefit.desc}</p>

                            {/* Decorative line */}
                            <div className="w-12 h-2 bg-secondary/50 rounded-full mt-auto pt-8 md:pt-10" />
                        </div>
                    ))}
                </div>

                {/* Integration/Trust Row */}
                <div className="mt-16 md:mt-20 pt-12 md:pt-16 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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
