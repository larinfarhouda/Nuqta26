'use client';

import { useTranslations } from 'next-intl';
import { Users, MessageCircle, ShieldCheck } from 'lucide-react';

export default function VendorPainPoints() {
    const t = useTranslations('VendorLanding.PainPoints');

    const pains = [
        {
            icon: Users,
            titleKey: 'pain1_title',
            descKey: 'pain1_desc',
            metricKey: 'pain1_metric',
            metricLabelKey: 'pain1_metric_label',
            color: {
                icon: 'bg-rose-50 text-rose-500',
                metric: 'text-rose-500',
                border: 'border-rose-100 hover:border-rose-200',
            },
        },
        {
            icon: MessageCircle,
            titleKey: 'pain2_title',
            descKey: 'pain2_desc',
            metricKey: 'pain2_metric',
            metricLabelKey: 'pain2_metric_label',
            color: {
                icon: 'bg-amber-50 text-amber-500',
                metric: 'text-amber-600',
                border: 'border-amber-100 hover:border-amber-200',
            },
        },
        {
            icon: ShieldCheck,
            titleKey: 'pain3_title',
            descKey: 'pain3_desc',
            metricKey: 'pain3_metric',
            metricLabelKey: 'pain3_metric_label',
            color: {
                icon: 'bg-emerald-50 text-emerald-500',
                metric: 'text-emerald-600',
                border: 'border-emerald-100 hover:border-emerald-200',
            },
        },
    ];

    return (
        <section className="py-16 md:py-24 bg-[#fffcf9]">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider border border-rose-100 mb-5">
                        {t('badge')}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Pain Point Cards */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    {pains.map((pain, idx) => {
                        const Icon = pain.icon;
                        return (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl md:rounded-3xl p-7 md:p-9 border-2 ${pain.color.border} transition-all duration-400 hover:shadow-xl group flex flex-col`}
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${pain.color.icon} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-7 h-7 md:w-8 md:h-8" />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg md:text-xl font-black text-gray-900 mb-3">
                                    {t(pain.titleKey)}
                                </h3>

                                {/* Description */}
                                <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-6 flex-1">
                                    {t(pain.descKey)}
                                </p>

                                {/* Metric */}
                                <div className="pt-5 border-t border-gray-100">
                                    <div className={`text-3xl md:text-4xl font-black ${pain.color.metric} mb-1`}>
                                        {t(pain.metricKey)}
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {t(pain.metricLabelKey)}
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
