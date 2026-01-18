'use client';

import { Link } from '@/navigation';
import { usePathname } from '@/navigation'; // Or usePathname from next/navigation? The user uses '@/navigation' for Link, let's assume it provides usePathname too or use next/navigation
import { LayoutDashboard, Heart, Calendar, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname as useNextPathname } from 'next/navigation'; // Use standard one if '@/navigation' not confirmed
import LogoutButton from '../auth/LogoutButton';

export default function UserSidebar() {
    const pathname = useNextPathname();
    const t = useTranslations('Dashboard'); // Assuming we have or will add dashboard translations

    const links = [
        { href: '/dashboard/user', label: t('my_registrations'), icon: Calendar },
        { href: '/dashboard/user/favorites', label: t('favorites'), icon: Heart },
        { href: '/dashboard/user/profile', label: t('my_profile'), icon: User },
    ];

    // Simple check if active
    const isActive = (href: string) => pathname === href || pathname?.endsWith(href);

    return (
        <aside className="w-64 bg-white/50 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl h-full p-4 flex flex-col">

            <div className="px-4 py-4 mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('menu')}</span>
            </div>

            <div className="flex-1 space-y-1">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive(link.href)
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-500 hover:bg-white hover:text-gray-900'
                            }`}
                    >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
                <LogoutButton className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all" />
            </div>
        </aside>
    );
}
