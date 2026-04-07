'use client';

import { useTranslations } from 'next-intl';
import { Quote, Star, Users } from 'lucide-react';

export default function VendorTestimonials() {
    const t = useTranslations('VendorLanding.Testimonials');

    const testimonials = [
        { id: 't1', avatar: 'v10' },
        { id: 't2', avatar: 'v20' },
        { id: 't3', avatar: 'v30' },
    ];

    return (
        <section className="py-16 md:py-24 bg-[#fffcf9] relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="absolute top-40 -left-20 w-60 h-60 bg-[#2CA58D]/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-40 -right-20 w-60 h-60 bg-[#264653]/5 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full text-amber-600 font-bold uppercase tracking-wider text-xs md:text-sm shadow-lg shadow-amber-600/5 border border-amber-100 mb-5">
                        <Star className="w-4 h-4 fill-amber-600" />
                        <span>{t('community_voice')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Testimonial Cards */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-16 md:mb-20">
                    {testimonials.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-400 group flex flex-col"
                        >
                            {/* Quote */}
                            <div className="relative mb-6 flex-1">
                                <Quote className="absolute -top-1 -left-1 w-8 h-8 text-[#2CA58D]/10" />
                                <p className="text-sm md:text-base text-gray-700 leading-relaxed font-medium pt-6 italic">
                                    &ldquo;{t(`${testimonial.id}.result`)}&rdquo;
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-[#fffcf9] rounded-xl border border-gray-50">
                                {[1, 2, 3].map((num) => (
                                    <div key={num} className="text-center">
                                        <div className="text-base md:text-lg font-black text-[#2CA58D]">
                                            {t(`${testimonial.id}.metric_${num}`)}
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase leading-tight">
                                            {t(`${testimonial.id}.metric_${num}_label`)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img
                                        src={`https://i.pravatar.cc/100?u=${testimonial.avatar}`}
                                        alt={t(`${testimonial.id}.author`)}
                                        loading="lazy"
                                        width="40"
                                        height="40"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">
                                        {t(`${testimonial.id}.author`)}
                                    </h4>
                                    <p className="text-xs font-semibold text-[#2CA58D]">
                                        {t(`${testimonial.id}.role`)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Case Study */}
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#264653]/5 to-[#2CA58D]/5 p-8 md:p-12 lg:p-16 rounded-3xl border border-[#2CA58D]/20 shadow-lg">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2CA58D]/10 text-[#2CA58D] rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                        <Users className="w-4 h-4" />
                        <span>{t('case_study.tag')}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
                        {t('case_study.title')}
                    </h3>
                    <p className="text-base md:text-lg text-gray-600 font-medium mb-2">
                        {t('case_study.organizer_name')} • {t('case_study.organizer_type')}
                    </p>
                    <p className="text-sm text-gray-500 font-bold mb-10">
                        {t('case_study.event_name')}
                    </p>

                    {/* Before/After Metrics */}
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">
                        <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-5">
                                {t('case_study.before_title')}
                            </h4>
                            <div className="space-y-4">
                                {[1, 2, 3].map((num) => (
                                    <div key={num}>
                                        <div className="text-xs font-bold text-gray-400 mb-1">{t(`case_study.metric_${num}_label`)}</div>
                                        <div className="text-2xl md:text-3xl font-black text-gray-300">{t(`case_study.metric_${num}_before`)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-[#2CA58D] shadow-lg">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-[#2CA58D] mb-5">
                                {t('case_study.after_title')}
                            </h4>
                            <div className="space-y-4">
                                {[1, 2, 3].map((num) => (
                                    <div key={num}>
                                        <div className="text-xs font-bold text-gray-500 mb-1">{t(`case_study.metric_${num}_label`)}</div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-2xl md:text-3xl font-black text-[#2CA58D]">{t(`case_study.metric_${num}_after`)}</div>
                                            <div className="text-base font-black text-emerald-600">{t(`case_study.metric_${num}_change`)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quote */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl relative">
                        <Quote className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-12 h-12 text-[#2CA58D]/10" />
                        <p className="text-base md:text-lg font-bold text-gray-800 italic leading-relaxed relative z-10">
                            &ldquo;{t('case_study.quote')}&rdquo;
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
