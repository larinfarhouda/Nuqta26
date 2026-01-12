'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import Image from 'next/image';

export default function Footer() {
    const t = useTranslations('Index');

    return (
        <footer className="bg-white py-12 md:py-20 border-t border-gray-100 pb-24 md:pb-12">
            <div className="container mx-auto px-6 flex flex-col items-center gap-12">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative w-32 h-12">
                        <Image
                            src="/images/logo_nav.png"
                            alt="Nuqta Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-2xl text-gray-900 tracking-tighter">Nuqta<span className="text-primary italic">.ist</span></span>
                        <p className="text-sm text-gray-400 font-medium max-w-sm mt-2">Connecting the Arab community in the heart of Istanbul.</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-bold text-gray-500">
                    <Link href="#" className="hover:text-primary transition">{t('footer.about')}</Link>
                    <Link href="#" className="hover:text-primary transition">{t('footer.contact')}</Link>
                    <Link href="#" className="hover:text-primary transition">{t('footer.privacy')}</Link>
                </div>

                <div className="text-xs text-gray-400 font-medium">
                    {t('footer.rights')}
                </div>
            </div>
        </footer>
    );
}
