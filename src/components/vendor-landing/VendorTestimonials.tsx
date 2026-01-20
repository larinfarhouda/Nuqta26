'use client';

import { useTranslations } from 'next-intl';
import { Quote, Star } from 'lucide-react';

export default function VendorTestimonials() {
    const t = useTranslations('VendorLanding.Testimonials');

    const testimonials = [
        {
            quote: t('t1_quote'),
            author: t('t1_author'),
            role: t('t1_role'),
            avatar: "https://i.pravatar.cc/150?u=sarah"
        },
        {
            quote: t('t2_quote'),
            author: t('t2_author'),
            role: t('t2_role'),
            avatar: "https://i.pravatar.cc/150?u=ahmed"
        }
    ];

    return (
        <section className="py-20 md:py-24 lg:py-32 bg-[#fffcf9] relative overflow-hidden">
            {/* Ambient background decoration - Reduced on mobile */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
            <div className="absolute top-40 -left-20 w-60 md:w-80 h-60 md:h-80 bg-primary/5 rounded-full blur-[60px] md:blur-[100px] opacity-50 md:opacity-100" />
            <div className="absolute bottom-40 -right-20 w-60 md:w-80 h-60 md:h-80 bg-secondary/10 rounded-full blur-[60px] md:blur-[100px] opacity-50 md:opacity-100" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16 md:mb-20 space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-white rounded-full text-amber-600 font-black uppercase tracking-widest text-xs md:text-sm shadow-lg md:shadow-xl shadow-amber-600/5 border border-amber-100">
                        <Star className="w-4 h-4 fill-amber-600" />
                        <span>{t('community_voice')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight">
                        {t('title')}
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 max-w-5xl mx-auto">
                    {testimonials.map((test, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-8 md:p-10 lg:p-14 rounded-3xl md:rounded-[4rem] border border-gray-100 shadow-xl md:shadow-2xl shadow-gray-200/50 relative group hover:shadow-2xl md:hover:shadow-3xl transition-shadow duration-500"
                        >
                            <div className="absolute top-6 md:top-10 right-6 md:right-10 opacity-10 md:group-hover:scale-125 md:group-hover:rotate-12 transition-transform duration-500">
                                <Quote className="w-14 h-14 md:w-20 md:h-20 text-primary" />
                            </div>

                            <div className="space-y-6 md:space-y-8 relative z-10">
                                <p className="text-base md:text-lg lg:text-xl font-bold text-gray-800 leading-relaxed italic">
                                    "{test.quote}"
                                </p>

                                <div className="flex items-center gap-4 md:gap-5 pt-3 md:pt-4">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl overflow-hidden border-3 md:border-4 border-secondary/20 shadow-md md:shadow-lg shadow-secondary/10">
                                        <img src={test.avatar} alt={test.author} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg md:text-xl font-black text-gray-900">{test.author}</h4>
                                        <p className="text-xs md:text-sm font-bold text-primary uppercase tracking-widest">{test.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

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
