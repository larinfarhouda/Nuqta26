'use client';

import { useTranslations } from 'next-intl';
import { Check, ArrowRight, Zap, Star } from 'lucide-react';
import { Link } from '@/navigation';

export default function VendorPricing() {
    const t = useTranslations('VendorLanding.Pricing');

    const tiers = [
        {
            name: t('free_tier'),
            price: "Free",
            period: "",
            desc: t('free_desc'),
            features: t.raw('free_features'),
            highlight: false,
            cta: t('get_started'),
            color: "border-secondary/20 bg-white"
        },
        {
            name: t('pro_tier'),
            price: "999 TL",
            period: t('pro_period'),
            desc: t('pro_desc'),
            features: t.raw('pro_features'),
            highlight: true,
            cta: t('scale_now'),
            color: "border-primary/20 bg-white shadow-xl md:shadow-2xl shadow-primary/20"
        }
    ];

    return (
        <section id="pricing" className="py-20 md:py-24 lg:py-32 bg-background-alt relative">
            {/* Added ambient glow - Reduced on mobile */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] md:w-[80%] h-[60%] md:h-[80%] bg-secondary/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none opacity-50 md:opacity-100" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-secondary text-primary rounded-full text-xs md:text-sm font-black uppercase tracking-widest">
                        <Zap className="w-4 h-4 fill-primary" />
                        <span>{t('simple_growth')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-accent tracking-tight">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-accent/70 font-medium max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
                    {tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`p-8 md:p-10 lg:p-14 rounded-3xl md:rounded-[3.5rem] border-2 relative flex flex-col items-center text-center group transition-all duration-500 hover:scale-[1.02] ${tier.color} ${tier.highlight ? 'ring-4 md:ring-8 ring-primary/5' : ''}`}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 md:px-6 py-1.5 md:py-2 bg-primary text-white rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg md:shadow-xl">
                                    <Star className="w-3 h-3 md:w-4 md:h-4 fill-secondary text-secondary" />
                                    <span>{t('most_popular')}</span>
                                </div>
                            )}

                            <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 w-full">
                                <h3 className="text-xl md:text-2xl font-black text-accent group-hover:text-primary transition-colors">{tier.name}</h3>
                                <div className="flex items-baseline justify-center">
                                    <span className="text-3xl md:text-4xl lg:text-5xl font-black text-accent leading-none">{tier.price}</span>
                                    <span className="text-gray-400 font-bold ml-1 uppercase text-xs md:text-sm tracking-widest">{tier.period}</span>
                                </div>
                                <p className="text-base md:text-lg text-gray-500 font-medium">{tier.desc}</p>
                            </div>

                            <div className="w-12 h-1 bg-secondary/20 mb-8 md:mb-10 group-hover:bg-primary/20 transition-colors" />

                            <ul className="space-y-4 md:space-y-6 mb-10 md:mb-12 w-full">
                                {tier.features.map((feature: string, fIdx: number) => (
                                    <li key={fIdx} className="flex items-center gap-3 md:gap-4 text-accent/80 font-bold justify-center">
                                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500 ${tier.highlight ? 'bg-primary border-primary text-white' : 'bg-white border-secondary/20 text-accent/50 group-hover:border-primary/50'}`}>
                                            <Check className="w-3 h-3 md:w-4 md:h-4 stroke-[3]" />
                                        </div>
                                        <span className="text-sm md:text-base lg:text-lg">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/register?role=vendor"
                                className={`w-full py-5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-base md:text-lg transition-all shadow-lg md:shadow-xl flex items-center justify-center gap-2 md:gap-3 group/btn hover:scale-[1.03] active:scale-95 ${tier.highlight ? 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50' : 'bg-accent text-white shadow-gray-900/10 hover:shadow-gray-900/30'}`}
                            >
                                {tier.cta}
                                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:translate-x-2 transition-transform rtl:rotate-180 rtl:group-hover/btn:-translate-x-2" />
                            </Link>
                        </div>
                    ))}
                </div>

                <p className="text-center mt-10 md:mt-12 text-gray-400 font-bold text-xs md:text-sm uppercase tracking-[0.2em]">
                    {t('no_credit_card')}
                </p>
            </div>
        </section>
    );
}
