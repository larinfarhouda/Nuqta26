'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { useState } from 'react';
import Image from 'next/image';
import LogoutButton from '../auth/LogoutButton';

export default function Navbar({ user }: { user?: any }) {
    const tAuth = useTranslations('Auth');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full p-4 md:px-12 flex justify-between items-center z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50 transition-all h-24">
            <Link href="/" className="flex items-center group">
                <div className="relative w-32 md:w-40 h-16 transform group-hover:scale-105 transition-transform duration-300">
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
                            <Link href="/dashboard/user" className="px-6 py-3 text-sm font-black uppercase tracking-widest bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200 hover:bg-primary transition-all active:scale-95">
                                {tAuth('welcome_title')}
                            </Link>
                            <LogoutButton variant="icon" />
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">{tAuth('loginVendor')}</Link>
                            <Link href="/login" className="px-6 py-3 text-sm font-black uppercase tracking-widest bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200 hover:bg-primary transition-all active:scale-95">
                                {tAuth('loginUser')}
                            </Link>
                        </>
                    )}
                </div>

                {/* Language Switch */}
                <div className="hidden md:flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
                    <Link href="/en" className="text-[10px] font-black hover:text-primary px-3 py-1.5 rounded-xl hover:bg-white transition-all">EN</Link>
                    <Link href="/ar" className="text-[10px] font-black hover:text-primary px-3 py-1.5 rounded-xl hover:bg-white transition-all">AR</Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden p-2 text-gray-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
                            <Link href="/login" className="w-full py-4 text-center font-bold bg-primary text-white rounded-xl shadow-md">{tAuth('loginUser')}</Link>
                            <Link href="/login" className="w-full py-4 text-center font-bold border-2 border-primary text-primary rounded-xl">{tAuth('loginVendor')}</Link>
                        </>
                    )}

                    <div className="flex justify-center gap-4 pt-4 border-t">
                        <Link href="/ar" className="text-sm font-bold text-gray-600">عربي</Link>
                        <span className="text-gray-300">|</span>
                        <Link href="/en" className="text-sm font-bold text-gray-600">English</Link>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="absolute top-[-3rem] right-4 p-2 bg-gray-100 rounded-full">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </nav>
    );
}
