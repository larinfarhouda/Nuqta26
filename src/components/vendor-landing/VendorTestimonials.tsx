'use client';

import { useTranslations } from 'next-intl';
import { Quote, Star, TrendingUp, Clock, Users, Award } from 'lucide-react';

export default function VendorTestimonials() {
    const t = useTranslations('VendorLanding.Testimonials');

    type ColorKey = 'rose' | 'emerald' | 'amber';

    const testimonials: Array<{
        id: string;
        icon: typeof TrendingUp;
        color: ColorKey;
    }> = [
            {
                id: 't1',
                icon: TrendingUp,
                color: 'rose'
            },
            {
                id: 't2',
                icon: Clock,
                color: 'emerald'
            },
            {
                id: 't3',
                icon: Award,
                color: 'amber'
            }
        ];

    const colorClasses: Record<ColorKey, {
        bg: string;
        text: string;
        border: string;
        badge: string;
    }> = {
        rose: {
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            border: 'border-rose-200',
            badge: 'bg-rose-100 text-rose-700'
        },
        emerald: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            border: 'border-emerald-200',
            badge: 'bg-emerald-100 text-emerald-700'
        },
        amber: {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            border: 'border-amber-200',
            badge: 'bg-amber-100 text-amber-700'
        }
    };

    return (
        <section className="py-20 md:py-24 lg:py-32 bg-[#fffcf9] relative overflow-hidden">
            {/* Ambient background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
            <div className="absolute top-40 -left-20 w-60 md:w-80 h-60 md:h-80 bg-primary/5 rounded-full blur-[60px] md:blur-[100px] opacity-50 md:opacity-100" />
            <div className="absolute bottom-40 -right-20 w-60 md:w-80 h-60 md:h-80 bg-secondary/10 rounded-full blur-[60px] md:blur-[100px] opacity-50 md:opacity-100" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-4xl mx-auto text-center mb-16 md:mb-20 space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-white rounded-full text-amber-600 font-black uppercase tracking-widest text-xs md:text-sm shadow-lg md:shadow-xl shadow-amber-600/5 border border-amber-100">
                        <Star className="w-4 h-4 fill-amber-600" />
                        <span>{t('community_voice')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-16 md:mb-20">
                    {testimonials.map((testimonial) => {
                        const Icon = testimonial.icon;
                        const colors = colorClasses[testimonial.color];

                        return (
                            <div
                                key={testimonial.id}
                                className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative group"
                            >
                                {/* Icon Badge */}
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4 md:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                                </div>

                                {/* Before Section */}
                                <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-100">
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{t('before_nuqta')}</div>
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                                        {t(`${testimonial.id}.before`)}
                                    </p>
                                </div>

                                {/* After Section */}
                                <div className="mb-4 md:mb-6">
                                    <div className="text-xs font-black uppercase tracking-widest text-primary mb-2">{t('after_nuqta')}</div>
                                    <p className="text-sm md:text-base text-gray-800 font-bold leading-relaxed">
                                        {t(`${testimonial.id}.after`)}
                                    </p>
                                </div>

                                {/* Result */}
                                <div className={`p-3 md:p-4 ${colors.bg} rounded-xl md:rounded-2xl mb-4 md:mb-6`}>
                                    <p className="text-sm md:text-base font-black text-gray-900 leading-relaxed">
                                        {t(`${testimonial.id}.result`)}
                                    </p>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
                                    <div className="text-center">
                                        <div className={`text-lg md:text-xl font-black ${colors.text}`}>
                                            {t(`${testimonial.id}.metric_1`)}
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase">
                                            {t(`${testimonial.id}.metric_1_label`)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg md:text-xl font-black ${colors.text}`}>
                                            {t(`${testimonial.id}.metric_2`)}
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase">
                                            {t(`${testimonial.id}.metric_2_label`)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg md:text-xl font-black ${colors.text}`}>
                                            {t(`${testimonial.id}.metric_3`)}
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase">
                                            {t(`${testimonial.id}.metric_3_label`)}
                                        </div>
                                    </div>
                                </div>

                                {/* Author */}
                                <div className="flex items-center gap-3 pt-3 md:pt-4 border-t border-gray-100">
                                    <div>
                                        <h4 className="text-sm md:text-base font-black text-gray-900">{t(`${testimonial.id}.author`)}</h4>
                                        <p className="text-xs font-bold text-primary">{t(`${testimonial.id}.role`)}</p>
                                        <p className="text-[10px] text-gray-500">{t(`${testimonial.id}.events_count`)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Case Study Section */}
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary/5 to-secondary/5 p-8 md:p-12 lg:p-16 rounded-3xl md:rounded-[4rem] border border-primary/20 shadow-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-6 md:mb-8">
                        <Users className="w-4 h-4" />
                        <span>{t('case_study.tag')}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-3 md:mb-4">
                        {t('case_study.title')}
                    </h3>
                    <p className="text-base md:text-lg text-gray-600 font-medium mb-2">
                        {t('case_study.organizer_name')} • {t('case_study.organizer_type')}
                    </p>
                    <p className="text-sm md:text-base text-gray-500 font-bold mb-8 md:mb-12">
                        {t('case_study.event_name')}
                    </p>

                    {/* Before/After Comparison */}
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                        <div className="bg-gray-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-200">
                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4 md:mb-6">
                                {t('case_study.before_title')}
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-gray-500 text-xs font-bold mb-1">{t('case_study.metric_1_label')}</div>
                                    <div className="text-3xl md:text-4xl font-black text-gray-400">{t('case_study.metric_1_before')}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs font-bold mb-1">{t('case_study.metric_2_label')}</div>
                                    <div className="text-3xl md:text-4xl font-black text-gray-400">{t('case_study.metric_2_before')}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs font-bold mb-1">{t('case_study.metric_3_label')}</div>
                                    <div className="text-3xl md:text-4xl font-black text-gray-400">{t('case_study.metric_3_before')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-primary shadow-xl">
                            <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4 md:mb-6">
                                {t('case_study.after_title')}
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-gray-600 text-xs font-bold mb-1">{t('case_study.metric_1_label')}</div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-3xl md:text-4xl font-black text-primary">{t('case_study.metric_1_after')}</div>
                                        <div className="text-lg font-black text-emerald-600">{t('case_study.metric_1_change')}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-xs font-bold mb-1">{t('case_study.metric_2_label')}</div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-3xl md:text-4xl font-black text-primary">{t('case_study.metric_2_after')}</div>
                                        <div className="text-lg font-black text-emerald-600">{t('case_study.metric_2_change')}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-xs font-bold mb-1">{t('case_study.metric_3_label')}</div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-3xl md:text-4xl font-black text-primary">{t('case_study.metric_3_after')}</div>
                                        <div className="text-lg font-black text-emerald-600">{t('case_study.metric_3_change')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quote */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl relative">
                        <Quote className="absolute top-4 right-4 w-12 h-12 md:w-16 md:h-16 text-primary/10" />
                        <p className="text-lg md:text-xl font-bold text-gray-800 italic leading-relaxed relative z-10">
                            "{t('case_study.quote')}"
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 md:mt-20 text-center">
                    <p className="text-base md:text-lg font-black text-gray-400 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                        <span>{t('loved_by_prefix')}</span>
                        <span className="px-4 md:px-5 py-1.5 md:py-2 bg-secondary/20 text-primary rounded-xl md:rounded-2xl border border-secondary/30 scale-105 md:scale-110">{t('organizers')}</span>
                        <span>{t('loved_by_suffix')}</span>
                    </p>
                </div>
            </div>
        </section>
    );
}
