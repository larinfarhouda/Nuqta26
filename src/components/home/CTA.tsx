'use client';

import { useTranslations } from 'next-intl';
import { Users, Calendar } from 'lucide-react';

export default function CTA() {
    const t = useTranslations('Index');
    const tAuth = useTranslations('Auth');

    return (
        <section className="py-12 md:py-20 px-4 md:px-6">
            <div className="container mx-auto bg-gradient-to-r from-teal-900 to-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                {/* Patterns */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <h2 className="text-3xl md:text-6xl font-black mb-4">{t('cta.title')}</h2>

                    <div className="grid md:grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/20 active:bg-white/20 transition group cursor-pointer" onClick={() => window.location.href = '/login'}>
                            <Users className="w-8 h-8 md:w-12 md:h-12 mb-3 mx-auto text-secondary group-hover:scale-110 transition" />
                            <h3 className="text-xl md:text-2xl font-bold mb-2">{t('cta.user_btn')}</h3>
                            <p className="text-teal-100 mb-4 text-sm md:text-base">{t('cta.user_desc')}</p>
                            <span className="inline-block bg-white text-teal-900 px-6 py-2 rounded-full font-bold text-sm w-full md:w-auto">{tAuth('loginUser')}</span>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 active:bg-white/15 transition group cursor-pointer" onClick={() => window.location.href = '/login'}>
                            <Calendar className="w-8 h-8 md:w-12 md:h-12 mb-3 mx-auto text-yellow-300 group-hover:scale-110 transition" />
                            <h3 className="text-xl md:text-2xl font-bold mb-2">{t('cta.vendor_btn')}</h3>
                            <p className="text-teal-100 mb-4 text-sm md:text-base">{t('cta.vendor_desc')}</p>
                            <span className="inline-block border-2 border-white text-white px-6 py-2 rounded-full font-bold text-sm w-full md:w-auto">{tAuth('loginVendor')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
