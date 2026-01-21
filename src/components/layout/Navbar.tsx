'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import LogoutButton from '../auth/LogoutButton';

export default function Navbar({ user }: { user?: any }) {
    const tAuth = useTranslations('Auth');
    const tNav = useTranslations('Navigation');
    const locale = useLocale();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    return (
        <nav
            className="fixed top-0 w-full px-4 md:px-12 flex justify-between items-center z-50 bg-background-alt/90 md:bg-background-alt/80 backdrop-blur-xl border-b border-secondary/10 shadow-sm transition-all h-16 md:h-24"
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
        >
            <Link href="/" className="flex items-center group">
                <div className="relative w-24 md:w-40 h-12 md:h-16 transform group-hover:scale-105 transition-transform duration-300">
                    <Image
                        src="/images/logo_nav.png"
                        alt="Nuqta Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </Link>

            <div className="flex gap-6 items-center">
                {/* Desktop Buttons */}
                <div className="hidden md:flex gap-4 items-center">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard/user" className="px-6 py-3 text-sm font-black uppercase tracking-widest bg-accent text-white rounded-2xl shadow-xl shadow-accent/10 hover:bg-primary transition-all active:scale-95">
                                {tAuth('profile')}
                            </Link>
                            <LogoutButton variant="icon" />
                        </div>
                    ) : (
                        <>
                            <Link href="/for-vendors" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                                {tNav('for_vendors')}
                            </Link>
                            <div className="h-4 w-px bg-gray-200" />
                            <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">{tAuth('login')}</Link>
                            <div className="h-4 w-px bg-gray-200" />
                            <Link href="/register" className="px-6 py-3 text-sm font-black uppercase tracking-widest bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                                {tAuth('register') || 'تسجيل جديد'}
                            </Link>
                        </>
                    )}
                </div>

                {/* Language Switch */}
                <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                    <Link
                        href={pathname}
                        locale="en"
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl transition-all ${locale === 'en'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        EN
                    </Link>
                    <Link
                        href={pathname}
                        locale="ar"
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl transition-all ${locale === 'ar'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        AR
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="absolute top-20 left-0 w-full bg-white border-b shadow-lg p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-4">
                    {user ? (
                        <div className="space-y-3">
                            <Link href="/dashboard/user/profile" className="w-full block py-4 text-center font-bold bg-primary text-white rounded-xl shadow-md">{tAuth('profile')}</Link>
                            <LogoutButton className="w-full py-4 flex justify-center items-center gap-2 font-bold text-red-600 bg-red-50 rounded-xl" />
                        </div>
                    ) : (
                        <>
                            <Link href="/for-vendors" className="w-full py-4 text-center font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                                {tNav('for_vendors')}
                            </Link>
                            <Link href="/login" className="w-full py-4 text-center font-bold bg-primary text-white rounded-xl shadow-md">{tAuth('login')}</Link>
                        </>
                    )}

                    <div className="flex justify-center gap-4 pt-4 border-t">
                        <Link href={pathname} locale="ar" className="text-sm font-bold text-gray-600">عربي</Link>
                        <span className="text-gray-300">|</span>
                        <Link href={pathname} locale="en" className="text-sm font-bold text-gray-600">English</Link>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="absolute top-[-3rem] right-4 p-2 bg-gray-100 rounded-full">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </nav>
    );
}
