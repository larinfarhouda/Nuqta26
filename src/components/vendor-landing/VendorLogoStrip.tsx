'use client';

import { useTranslations } from 'next-intl';

export default function VendorLogoStrip() {
    const t = useTranslations('VendorLanding.LogoStrip');

    return (
        <section className="py-10 md:py-14 bg-[#fffcf9] relative z-10">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    {/* Avatars + text */}
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex -space-x-3 rtl:space-x-reverse">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 md:w-11 md:h-11 rounded-full border-[3px] border-[#fffcf9] bg-gray-200 overflow-hidden shadow-sm"
                                >
                                    <img
                                        src={`https://i.pravatar.cc/100?u=vendor${i}`}
                                        alt={`Event organizer ${i}`}
                                        loading="lazy"
                                        width="44"
                                        height="44"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm md:text-base font-bold text-gray-600">
                            {t('title')}
                        </p>
                    </div>

                    {/* Category tags */}
                    <p className="text-xs md:text-sm font-medium text-gray-400 tracking-wide">
                        {t('subtitle')}
                    </p>
                </div>
            </div>
        </section>
    );
}
