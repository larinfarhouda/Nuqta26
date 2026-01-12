'use client';

import { Link, usePathname } from '@/navigation';
import { Home, Calendar, Heart, User, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn'; // Assuming cn utility exists, otherwise I'll use template literals

export default function BottomNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    const t = useTranslations('Navigation');
    const pathname = usePathname();

    const navItems = [
        {
            key: 'home',
            label: t('home'),
            href: '/',
            icon: Home
        },
        {
            key: 'bookings',
            label: t('bookings'),
            href: '/dashboard/user',
            icon: Calendar
        },
        {
            key: 'favorites',
            label: t('favorites'),
            href: '/dashboard/user/favorites',
            icon: Heart
        },
        {
            key: 'profile',
            label: isLoggedIn ? t('profile') : t('login'),
            href: isLoggedIn ? '/dashboard/user/profile' : '/login',
            icon: isLoggedIn ? User : LogIn
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // basic active check - can be improved
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive
                                    ? "text-primary"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Icon className={cn("w-6 h-6", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
