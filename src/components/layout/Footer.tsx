'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import Image from 'next/image';

export default function Footer() {
    const t = useTranslations('Index');
    const tNav = useTranslations('Navigation');

    return (
        <footer className="bg-[#fffdfa] py-12 border-t border-secondary/10 pb-32 md:pb-12 px-6">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

                    {/* Brand Section */}
                    <div className="flex items-center gap-6">
                        <Link href="/" className="relative w-28 h-10 transition-opacity hover:opacity-80">
                            <Image
                                src="/images/logo_nav.png"
                                alt="Nuqta Logo"
                                fill
                                className="object-contain"
                            />
                        </Link>
                        <div className="hidden md:block h-6 w-px bg-gray-100" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            © {new Date().getFullYear()} Nuqta Istanbul
                        </span>
                    </div>

                    {/* Minimal Navigation */}
                    <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                        {[
                            { label: tNav('home'), href: '/' },
                            { label: tNav('for_vendors'), href: '/for-vendors' },
                            { label: t('footer.about'), href: '/about' },
                            { label: t('footer.contact'), href: '/contact' },
                            { label: t('footer.privacy'), href: '/privacy' }
                        ].map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.href}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Subtle Social/Extra - Placeholder for future */}
                    <div className="flex items-center gap-4 text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">{t('footer.rights')}</span>
                    </div>

                </div>
            </div>
        </footer>
    );
}
