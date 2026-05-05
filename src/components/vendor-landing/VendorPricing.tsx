'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ArrowRight, Zap, Sparkles, Crown, TrendingUp, Calendar } from 'lucide-react';
import { Link } from '@/navigation';

export default function VendorPricing() {
    const t = useTranslations('VendorLanding.Pricing');
    const [isAnnual, setIsAnnual] = useState(false);

    const tiers = [
        {
            name: t('starter_tier'),
            price: t('starter_price'),
            priceLabel: t('starter_price_label'),
            period: '',
            eventCount: t('starter_events_count'),
            eventLabel: t('starter_events'),
            desc: t('starter_desc'),
            highlight: false,
            cta: t('get_started'),
            ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
            cardStyle: 'border-gray-200 bg-white hover:border-gray-300',
            icon: Sparkles,
            iconColor: 'text-gray-500',
            iconBg: 'bg-gray-100',
            badge: null,
            savings: null,
            annualTotal: null,
        },
        {
            name: t('growth_tier'),
            price: isAnnual ? t('growth_price_annual') : t('growth_price_monthly'),
            priceLabel: isAnnual ? t('billed_annually') : null,
            period: t('growth_period'),
            eventCount: t('growth_events_count'),
            eventLabel: t('growth_events'),
            desc: t('growth_desc'),
            highlight: true,
            badge: t('growth_badge'),
            cta: t('scale_now'),
            ctaStyle: 'bg-[#2CA58D] text-white shadow-lg hover:shadow-xl hover:bg-[#258f7a]',
            cardStyle: 'border-[#2CA58D] bg-gradient-to-br from-[#2CA58D]/5 to-[#2CA58D]/10 shadow-xl shadow-[#2CA58D]/10',
            icon: TrendingUp,
            iconColor: 'text-[#2CA58D]',
            iconBg: 'bg-[#2CA58D]/20',
            savings: isAnnual ? t('growth_annual_savings') : null,
            annualTotal: isAnnual ? t('growth_annual_total') : null,
        },
        {
            name: t('professional_tier'),
            price: isAnnual ? t('professional_price_annual') : t('professional_price_monthly'),
            priceLabel: isAnnual ? t('billed_annually') : null,
            period: t('professional_period'),
            eventCount: t('professional_events_count'),
            eventLabel: t('professional_events'),
            desc: t('professional_desc'),
            highlight: false,
            cta: t('get_professional'),
            ctaStyle: 'bg-purple-700 text-white hover:bg-purple-800',
            cardStyle: 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-400',
            icon: Crown,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-100',
            badge: null,
            savings: isAnnual ? t('professional_annual_savings') : null,
            annualTotal: isAnnual ? t('professional_annual_total') : null,
        }
    ];

    const freeFeatures = t.raw('features_list') as string[];
    const proFeatures = t.raw('pro_features_list') as string[];
    const businessFeatures = t.raw('business_features_list') as string[];

    return (
        <section id="pricing" className="py-12 md:py-20 lg:py-24 bg-gray-50 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-[#2CA58D]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2CA58D]/10 text-[#2CA58D] rounded-full text-xs md:text-sm font-bold uppercase tracking-wider mb-4">
                        <Zap className="w-4 h-4" />
                        <span>{t('simple_growth')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 font-medium">
                        {t('subtitle')}
                    </p>

                    {/* Billing Toggle */}
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <span className={`text-sm font-bold transition-colors ${!isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
                            {t('billing_monthly')}
                        </span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2CA58D]/50 ${isAnnual ? 'bg-[#2CA58D]' : 'bg-gray-300'}`}
                            aria-label="Toggle billing period"
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'}`} />
                        </button>
                        <span className={`text-sm font-bold transition-colors ${isAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
                            {t('billing_annual')}
                        </span>
                        {isAnnual && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold animate-fade-in">
                                <Calendar className="w-3.5 h-3.5" />
                                {t('annual_savings_badge')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Pricing Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-12 md:mb-16">
                    {tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`relative p-6 md:p-7 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 flex flex-col ${tier.cardStyle} ${tier.highlight ? 'md:scale-105 shadow-2xl' : 'hover:shadow-lg'}`}
                        >
                            {/* Badge */}
                            {tier.highlight && tier.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#2CA58D] text-white rounded-full text-xs font-black uppercase tracking-wide shadow-lg whitespace-nowrap">
                                    {tier.badge}
                                </div>
                            )}

                            {/* Tier Icon & Name */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`p-2.5 rounded-xl ${tier.iconBg}`}>
                                    <tier.icon className={`w-6 h-6 ${tier.iconColor}`} />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-gray-900">{tier.name}</h3>
                                </div>
                            </div>

                            {/* Price — HERO ELEMENT */}
                            <div className="mb-5">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl md:text-5xl font-black text-gray-900">{tier.price}</span>
                                    {tier.period && <span className="text-base text-gray-500 font-medium">{tier.period}</span>}
                                </div>
                                {tier.priceLabel && (
                                    <p className="text-xs text-gray-500 font-medium mt-1">{tier.priceLabel}</p>
                                )}
                                {tier.annualTotal && (
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{tier.annualTotal}</p>
                                )}
                                {tier.savings && (
                                    <span className="inline-flex items-center mt-2 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        {t('save_badge', { amount: tier.savings })}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 mb-4">{tier.desc}</p>

                            {/* Event count — compact line */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-5 ${tier.highlight ? 'bg-[#2CA58D]/10' : 'bg-gray-100'}`}>
                                <span className={`text-lg font-black ${tier.highlight ? 'text-[#2CA58D]' : 'text-gray-900'}`}>
                                    {tier.eventCount}
                                </span>
                                <span className="text-sm text-gray-600 font-medium">{tier.eventLabel}</span>
                            </div>

                            {/* CTA Button */}
                            <div className="mt-auto">
                                <Link
                                    href="/register?role=vendor"
                                    className={`w-full py-3.5 rounded-xl font-black text-sm md:text-base transition-all flex items-center justify-center gap-2 group/btn ${tier.ctaStyle}`}
                                >
                                    {tier.cta}
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover/btn:-translate-x-1" />
                                </Link>
                                {tier.highlight && (
                                    <p className="text-center text-xs text-gray-500 mt-2 font-medium">{t('cta_secondary')}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Feature Comparison — Three Columns */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Free Features */}
                    <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-gray-200 p-5 md:p-7 shadow-sm">
                        <h3 className="text-base font-black text-gray-900 mb-4">
                            {t('all_features_included')}
                        </h3>
                        <div className="space-y-2.5">
                            {freeFeatures.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-gray-600 stroke-[3]" />
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium leading-snug">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Features */}
                    <div className="bg-gradient-to-br from-[#2CA58D]/5 to-[#2CA58D]/10 rounded-2xl md:rounded-3xl border-2 border-[#2CA58D]/30 p-5 md:p-7 shadow-sm">
                        <h3 className="text-base font-black text-[#2CA58D] mb-4">
                            {t('pro_features_title')}
                        </h3>
                        <div className="space-y-2.5">
                            {proFeatures.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-[#2CA58D] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-white stroke-[3]" />
                                    </div>
                                    <span className="text-sm text-gray-800 font-medium leading-snug">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Business Features */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl md:rounded-3xl border-2 border-purple-200 p-5 md:p-7 shadow-sm">
                        <h3 className="text-base font-black text-purple-700 mb-4">
                            {t('business_features_title')}
                        </h3>
                        <div className="space-y-2.5">
                            {businessFeatures.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-white stroke-[3]" />
                                    </div>
                                    <span className="text-sm text-gray-800 font-medium leading-snug">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom note */}
                <div className="mt-8 text-center">
                    <p className="text-xs md:text-sm text-gray-500">
                        💡 {t('no_credit_card')}
                    </p>
                </div>
            </div>
        </section>
    );
}
