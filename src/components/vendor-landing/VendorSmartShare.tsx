'use client';

import { useTranslations } from 'next-intl';
import { Share2, Image, Languages, MousePointerClick, MapPin, Calendar, Sparkles, Download, Copy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function VendorSmartShare() {
    const t = useTranslations('VendorLanding.SmartShare');

    const features = [
        {
            icon: Image,
            titleKey: 'feature1_title',
            descKey: 'feature1_desc',
            gradient: 'from-violet-500/10 to-fuchsia-500/10',
            iconColor: 'text-violet-600 bg-violet-500/10',
        },
        {
            icon: Languages,
            titleKey: 'feature2_title',
            descKey: 'feature2_desc',
            gradient: 'from-blue-500/10 to-cyan-500/10',
            iconColor: 'text-blue-600 bg-blue-500/10',
        },
        {
            icon: MousePointerClick,
            titleKey: 'feature3_title',
            descKey: 'feature3_desc',
            gradient: 'from-emerald-500/10 to-teal-500/10',
            iconColor: 'text-emerald-600 bg-emerald-500/10',
        },
    ];

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 -right-20 w-[300px] h-[300px] bg-[#2CA58D]/5 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-14 md:mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider border border-violet-500/20 mb-5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('badge')}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 font-medium max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Content: Mockup + Features */}
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Event Card Mockup */}
                    <div className="relative order-2 lg:order-1">
                        <div className="relative mx-auto max-w-[380px]">
                            {/* Phone frame */}
                            <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl shadow-gray-900/20">
                                <div className="bg-white rounded-[2rem] overflow-hidden">
                                    {/* Status bar */}
                                    <div className="bg-gray-900 px-6 py-2 flex justify-between items-center">
                                        <span className="text-white text-[10px] font-semibold">9:41</span>
                                        <div className="w-20 h-5 bg-gray-800 rounded-full" />
                                        <div className="flex gap-1">
                                            <div className="w-3.5 h-2 bg-white/60 rounded-sm" />
                                            <div className="w-1 h-2 bg-white/60 rounded-sm" />
                                        </div>
                                    </div>

                                    {/* App header */}
                                    <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-[#2CA58D] flex items-center justify-center">
                                                    <Share2 className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">Smart Share</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400">nuqta.ist</span>
                                        </div>
                                    </div>

                                    {/* Event Card Preview */}
                                    <div className="p-4">
                                        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                                            {/* Card image area */}
                                            <div className="relative h-44 bg-gradient-to-br from-[#264653] via-[#2A9D8F] to-[#2CA58D]">
                                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNIDAgMTAgTCA0MCAxMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjYSkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
                                                {/* nuqta badge */}
                                                <div className="absolute top-3 start-3 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                                                    <span className="text-[9px] font-bold text-white tracking-wider">NUQTA.IST</span>
                                                </div>
                                                {/* Price badge */}
                                                <div className="absolute top-3 end-3 px-2.5 py-1 bg-white rounded-full shadow-md">
                                                    <span className="text-[11px] font-black text-[#2CA58D]">{t('card_mock_price')}</span>
                                                </div>
                                                {/* Event title on image */}
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                                    <h4 className="text-white font-black text-lg">{t('card_mock_title')}</h4>
                                                </div>
                                            </div>

                                            {/* Card details */}
                                            <div className="p-3.5 bg-white space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Calendar className="w-3.5 h-3.5 text-[#2CA58D]" />
                                                    <span className="text-xs font-medium">{t('card_mock_date')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <MapPin className="w-3.5 h-3.5 text-[#2CA58D]" />
                                                    <span className="text-xs font-medium">{t('card_mock_location')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons mock */}
                                        <div className="mt-3 space-y-2">
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#2CA58D] rounded-xl text-white text-xs font-bold">
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span>Download</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 rounded-xl text-gray-600 text-xs font-bold">
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>Copy Caption</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 rounded-xl text-green-600 text-[11px] font-bold">
                                                    WhatsApp
                                                </div>
                                                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 rounded-xl text-blue-600 text-[11px] font-bold">
                                                    Facebook
                                                </div>
                                                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-pink-50 rounded-xl text-pink-600 text-[11px] font-bold">
                                                    Instagram
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-4 -end-4 md:-end-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 animate-bounce-slow hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Share2 className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-900">Shared! ✨</p>
                                    <p className="text-[9px] text-gray-400">Just now</p>
                                </div>
                            </div>

                            <div className="absolute -bottom-2 -start-4 md:-start-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                                    <Download className="w-4 h-4 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-900">Card saved</p>
                                    <p className="text-[9px] text-gray-400">event_card.png</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Features */}
                    <div className="order-1 lg:order-2 space-y-6">
                        {features.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={idx}
                                    className={`bg-gradient-to-r ${feature.gradient} p-5 md:p-6 rounded-2xl border border-white/50 hover:shadow-md transition-all duration-300 group`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${feature.iconColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 mb-1.5">
                                                {t(feature.titleKey)}
                                            </h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {t(feature.descKey)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* CTA */}
                        <Link
                            href="/register?role=vendor"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2CA58D] text-white font-bold text-sm rounded-xl hover:bg-[#264653] transition-colors shadow-lg hover:shadow-xl"
                        >
                            {t('cta')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Custom animation */}
            <style jsx>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
}
