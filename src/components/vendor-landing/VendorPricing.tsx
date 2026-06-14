'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ArrowRight, Zap, Sparkles, Crown, TrendingUp, Calendar, Shield } from 'lucide-react';
import { Link } from '@/navigation';
import { useCountryId } from '@/hooks/useCountry';
import { getCurrencySymbol } from '@/utils/country-helpers';
import { COUNTRY_PRICING } from '@/lib/constants/subscription';

export default function VendorPricing() {
    const t = useTranslations('VendorLanding.Pricing');
    const [isAnnual, setIsAnnual] = useState(true);

    const countryId = useCountryId();
    const currency = getCurrencySymbol(countryId);
    const prices = COUNTRY_PRICING[countryId] || COUNTRY_PRICING['tr'];

    // Computed price strings
    const proMonthly = `${currency}${prices.pro.monthly}`;
    const proAnnualMonthly = `${currency}${Math.round(prices.pro.annual / 12)}`;
    const proAnnualTotal = `${currency}${prices.pro.annual.toLocaleString()}/yr`;
    const proSavings = `${currency}${(prices.pro.monthly * 12 - prices.pro.annual).toLocaleString()}`;

    const bizMonthly = `${currency}${prices.business.monthly}`;
    const bizAnnualMonthly = `${currency}${Math.round(prices.business.annual / 12)}`;
    const bizAnnualTotal = `${currency}${prices.business.annual.toLocaleString()}/yr`;
    const bizSavings = `${currency}${(prices.business.monthly * 12 - prices.business.annual).toLocaleString()}`;

    const freePrice = `${currency}0`;

    const freeFeatures = t.raw('features_list') as string[];
    const proFeatures = t.raw('pro_features_list') as string[];
    const businessFeatures = t.raw('business_features_list') as string[];

    return (
        <section id="pricing" className="py-16 md:py-24 lg:py-28 bg-[#fafbfc] relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#2CA58D]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-2xl mx-auto text-center mb-10 md:mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2CA58D]/10 text-[#2CA58D] rounded-full text-xs font-bold uppercase tracking-wider mb-5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{t('simple_growth')}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 font-medium max-w-lg mx-auto">
                        {t('subtitle')}
                    </p>

                    {/* Billing Toggle */}
                    <div className="mt-8 inline-flex items-center p-1.5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                !isAnnual
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t('billing_monthly')}
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                                isAnnual
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t('billing_annual')}
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isAnnual ? 'bg-green-400 text-green-900' : 'bg-green-100 text-green-700'
                            }`}>
                                -17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 lg:gap-5 max-w-6xl mx-auto items-start">

                    {/* === FREE TIER === */}
                    <div className="relative bg-white rounded-3xl border border-gray-200 p-7 md:p-8 hover:border-gray-300 transition-all duration-300 hover:shadow-lg flex flex-col">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-gray-100">
                                <Sparkles className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">{t('starter_tier')}</h3>
                                <p className="text-xs text-gray-500 font-medium">{t('starter_desc')}</p>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-gray-900">{freePrice}</span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mt-1">{t('starter_price_label')}</p>
                        </div>

                        {/* Event limit pill */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                            <span className="text-xl font-black text-gray-900">{t('starter_events_count')}</span>
                            <span className="text-sm text-gray-600 font-medium">{t('starter_events')}</span>
                        </div>

                        {/* CTA */}
                        <Link
                            href="/register?role=vendor"
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 group mb-6"
                        >
                            {t('get_started')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                        </Link>

                        {/* Features */}
                        <div className="border-t border-gray-100 pt-5">
                            <div className="space-y-3">
                                {freeFeatures.map((feature: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-gray-400 stroke-[3] flex-shrink-0 mt-0.5" />
                                        <span className="text-[13px] text-gray-600 leading-snug">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* === PRO TIER (HIGHLIGHTED) === */}
                    <div className="relative bg-gray-900 rounded-3xl p-7 md:p-8 shadow-2xl shadow-gray-900/20 md:-mt-4 md:mb-0 flex flex-col ring-1 ring-gray-900">
                        {/* Most Popular Badge */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                            <div className="px-5 py-1.5 bg-[#2CA58D] text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-[#2CA58D]/30 whitespace-nowrap">
                                {t('growth_badge')}
                            </div>
                        </div>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-[#2CA58D]/20">
                                <TrendingUp className="w-5 h-5 text-[#2CA58D]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">{t('growth_tier')}</h3>
                                <p className="text-xs text-gray-400 font-medium">{t('growth_desc')}</p>
                            </div>
                        </div>

                        {/* Price with anchoring */}
                        <div className="mb-6">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white">
                                    {isAnnual ? proAnnualMonthly : proMonthly}
                                </span>
                                <span className="text-base text-gray-400 font-medium">{t('growth_period')}</span>
                            </div>
                            {isAnnual && (
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-sm text-gray-500 line-through font-medium">{proMonthly}{t('growth_period')}</span>
                                    <span className="inline-flex px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                                        {t('save_badge', { amount: proSavings })}
                                    </span>
                                </div>
                            )}
                            {isAnnual && (
                                <p className="text-xs text-gray-500 mt-1">{proAnnualTotal} · {t('billed_annually')}</p>
                            )}
                        </div>

                        {/* Event limit pill */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl border border-white/10 mb-6">
                            <span className="text-xl font-black text-[#2CA58D]">{t('growth_events_count')}</span>
                            <span className="text-sm text-gray-300 font-medium">{t('growth_events')}</span>
                        </div>

                        {/* CTA */}
                        <Link
                            href="/register?role=vendor"
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#2CA58D] text-white hover:bg-[#25917b] transition-all duration-200 shadow-lg shadow-[#2CA58D]/25 hover:shadow-xl hover:shadow-[#2CA58D]/30 flex items-center justify-center gap-2 group mb-6"
                        >
                            {t('scale_now')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                        </Link>

                        {/* Features */}
                        <div className="border-t border-white/10 pt-5">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">{t('pro_features_title')}</p>
                            <div className="space-y-3">
                                {proFeatures.map((feature: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-[#2CA58D] stroke-[3] flex-shrink-0 mt-0.5" />
                                        <span className="text-[13px] text-gray-300 leading-snug">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* === BUSINESS TIER === */}
                    <div className="relative bg-white rounded-3xl border border-purple-200 p-7 md:p-8 hover:border-purple-300 transition-all duration-300 hover:shadow-lg flex flex-col bg-gradient-to-br from-white via-white to-purple-50/50">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-purple-100">
                                <Crown className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">{t('professional_tier')}</h3>
                                <p className="text-xs text-gray-500 font-medium">{t('professional_desc')}</p>
                            </div>
                        </div>

                        {/* Price with anchoring */}
                        <div className="mb-6">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900">
                                    {isAnnual ? bizAnnualMonthly : bizMonthly}
                                </span>
                                <span className="text-base text-gray-500 font-medium">{t('professional_period')}</span>
                            </div>
                            {isAnnual && (
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-sm text-gray-400 line-through font-medium">{bizMonthly}{t('professional_period')}</span>
                                    <span className="inline-flex px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        {t('save_badge', { amount: bizSavings })}
                                    </span>
                                </div>
                            )}
                            {isAnnual && (
                                <p className="text-xs text-gray-500 mt-1">{bizAnnualTotal} · {t('billed_annually')}</p>
                            )}
                        </div>

                        {/* Event limit pill */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 rounded-xl border border-purple-100 mb-6">
                            <span className="text-xl font-black text-purple-700">{t('professional_events_count')}</span>
                            <span className="text-sm text-gray-600 font-medium">{t('professional_events')}</span>
                        </div>

                        {/* CTA */}
                        <Link
                            href="/register?role=vendor"
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-purple-700 text-white hover:bg-purple-800 transition-all duration-200 shadow-lg shadow-purple-700/15 flex items-center justify-center gap-2 group mb-6"
                        >
                            {t('get_professional')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                        </Link>

                        {/* Features */}
                        <div className="border-t border-purple-100 pt-5">
                            <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-3">{t('business_features_title')}</p>
                            <div className="space-y-3">
                                {businessFeatures.map((feature: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-purple-500 stroke-[3] flex-shrink-0 mt-0.5" />
                                        <span className="text-[13px] text-gray-600 leading-snug">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust bar */}
                <div className="mt-10 md:mt-14 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">{t('cta_secondary')}</span>
                    </div>
                    <div className="hidden md:block w-1 h-1 rounded-full bg-gray-300" />
                    <span className="font-medium">💡 {t('no_credit_card')}</span>
                </div>
            </div>
        </section>
    );
}
