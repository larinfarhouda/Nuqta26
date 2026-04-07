'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/navigation';

export default function VendorFinalCTA() {
    const t = useTranslations('VendorLanding.FinalCTA');

    return (
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#264653] via-[#1a3a47] to-[#264653] relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2CA58D]/10 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-5">
                        {t('title')}
                    </h2>
                    <p className="text-base md:text-lg text-white/60 font-medium mb-10 max-w-xl mx-auto">
                        {t('subtitle')}
                    </p>

                    <Link
                        href="/register?role=vendor"
                        className="inline-flex items-center gap-3 px-10 md:px-14 py-4 md:py-5 bg-[#2CA58D] text-white font-black text-base md:text-lg rounded-2xl transition-all duration-300 shadow-2xl shadow-[#2CA58D]/30 hover:shadow-[#2CA58D]/50 hover:scale-[1.03] hover:bg-[#25917b] active:scale-[0.97] group"
                    >
                        <span>{t('cta')}</span>
                        <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </Link>

                    <p className="mt-5 text-sm text-white/40 font-medium">
                        {t('reassurance')}
                    </p>
                </div>
            </div>
        </section>
    );
}
