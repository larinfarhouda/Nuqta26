'use client';

import { useTranslations } from 'next-intl';
import { Check, ArrowRight, Zap, Sparkles, Crown, TrendingUp } from 'lucide-react';
import { Link } from '@/navigation';

export default function VendorPricing() {
    const t = useTranslations('VendorLanding.Pricing');

    const tiers = [
        {
            name: t('starter_tier'),
            price: t('starter_price'),
            period: "",
            eventCount: t('starter_events_count'),
            eventLabel: t('starter_events'),
            desc: t('starter_desc'),
            highlight: false,
            cta: t('get_started'),
            color: "border-gray-200 bg-white hover:border-gray-300",
            icon: Sparkles,
            iconColor: "text-gray-500"
        },
        {
            name: t('growth_tier'),
            price: t('growth_price'),
            period: t('growth_period'),
            eventCount: t('growth_events_count'),
            eventLabel: t('growth_events'),
            desc: t('growth_desc'),
            highlight: true,
            badge: t('growth_badge'),
            cta: t('scale_now'),
            color: "border-[#2CA58D] bg-gradient-to-br from-[#2CA58D]/5 to-[#2CA58D]/10 shadow-xl shadow-[#2CA58D]/10",
            icon: TrendingUp,
            iconColor: "text-[#2CA58D]"
        },
        {
            name: t('professional_tier'),
            price: t('professional_price'),
            period: t('professional_period'),
            eventCount: t('professional_events_count'),
            eventLabel: t('professional_events'),
            desc: t('professional_desc'),
            highlight: false,
            cta: t('get_professional'),
            color: "border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-400",
            icon: Crown,
            iconColor: "text-purple-600"
        }
    ];

    const allFeatures = t.raw('features_list');

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

                    {/* Trial + Founder Banner */}
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 mt-4 bg-[#2CA58D]/10 border-2 border-[#2CA58D]/30 rounded-2xl">
                        <Sparkles className="w-5 h-5 text-[#2CA58D]" />
                        <span className="text-xs md:text-sm font-bold text-[#2CA58D]">{t('trial_founder_banner')}</span>
                    </div>
                </div>

                {/* Pricing Tiers - Mobile-first grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-12 md:mb-16">
                    {tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`relative p-6 md:p-7 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 ${tier.color} ${tier.highlight ? 'md:scale-105 shadow-2xl' : 'hover:shadow-lg'}`}
                            dir="rtl"
                        >
                            {tier.highlight && tier.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#2CA58D] text-white rounded-full text-xs font-black uppercase tracking-wide shadow-lg">
                                    {tier.badge}
                                </div>
                            )}

                            {/* Tier Icon & Name */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 rounded-xl ${tier.highlight ? 'bg-[#2CA58D]/20' : 'bg-gray-100'}`}>
                                    <tier.icon className={`w-6 h-6 ${tier.iconColor}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg md:text-xl font-black text-gray-900">{tier.name}</h3>
                                    <p className="text-xs text-gray-600">{tier.desc}</p>
                                </div>
                            </div>

                            {/* Event Count - HERO ELEMENT */}
                            <div className={`p-6 rounded-2xl mb-5 text-center ${tier.highlight ? 'bg-[#2CA58D]/10 border-2 border-[#2CA58D]/30' : 'bg-gray-50 border-2 border-gray-200'}`}>
                                <div className={`text-5xl md:text-6xl font-black mb-2 ${tier.highlight ? 'text-[#2CA58D]' : 'text-gray-900'}`}>
                                    {tier.eventCount}
                                </div>
                                <div className="text-sm font-bold text-gray-700">{tier.eventLabel}</div>
                            </div>

                            {/* Price */}
                            <div className="text-center mb-6">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-3xl md:text-4xl font-black text-gray-900">{tier.price}</span>
                                    {tier.period && <span className="text-sm text-gray-500 font-medium">{tier.period}</span>}
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Link
                                href="/register?role=vendor"
                                className={`w-full py-3.5 rounded-xl font-black text-sm md:text-base transition-all flex items-center justify-center gap-2 group/btn ${tier.highlight ? 'bg-[#2CA58D] text-white shadow-lg hover:shadow-xl hover:bg-[#258f7a]' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                            >
                                {tier.cta}
                                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover/btn:-translate-x-1" />
                            </Link>
                        </div>
                    ))}
                </div>

                {/* All Features Included - Single List */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 md:p-10 shadow-lg">
                        <div className="text-center mb-8">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
                                {t('all_features_included')}
                            </h3>
                            <p className="text-sm md:text-base text-gray-600">
                                احصل على كل هذه الميزات في أي باقة تختارها
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" dir="rtl">
                            {allFeatures.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="w-6 h-6 rounded-full bg-[#2CA58D] flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-white stroke-[3]" />
                                    </div>
                                    <span className="text-sm md:text-base text-gray-800 font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-xs md:text-sm text-gray-500">
                                💡 {t('no_credit_card')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
