'use client';

import { Link, usePathname } from '@/navigation';
import { Home, Calendar, Heart, User, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

export default function BottomNav({ isLoggedIn, role }: { isLoggedIn: boolean; role?: string }) {
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
            href: !isLoggedIn ? '/login' : (role === 'vendor' ? '/dashboard/vendor' : '/dashboard/user'),
            icon: Calendar
        },
        {
            key: 'favorites',
            label: t('favorites'),
            href: !isLoggedIn ? '/login' : (role === 'vendor' ? '/dashboard/vendor' : '/dashboard/user/favorites'),
            icon: Heart
        },
        {
            key: 'profile',
            label: isLoggedIn ? t('profile') : t('login'),
            href: (isLoggedIn && role === 'vendor') ? '/dashboard/vendor' : (isLoggedIn ? '/dashboard/user/profile' : '/login'),
            icon: isLoggedIn ? User : LogIn
        }
    ];

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {/* iOS-style frosted glass backdrop */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl border-t border-gray-200/50 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]" />

            {/* Navigation items */}
            <nav className="relative flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-xl transition-all duration-200 active:scale-95 active:bg-gray-100/50",
                                isActive && "text-primary",
                                !isActive && "text-gray-500 active:text-gray-700"
                            )}
                        >
                            {/* Icon with native-like animation */}
                            <div className={cn(
                                "relative transition-all duration-200",
                                isActive && "scale-110"
                            )}>
                                <Icon
                                    className="w-6 h-6"
                                    strokeWidth={isActive ? 2.5 : 2}
                                    fill={isActive ? "currentColor" : "none"}
                                    fillOpacity={isActive ? 0.15 : 0}
                                />
                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </div>

                            {/* Label */}
                            <span className={cn(
                                "text-[10px] font-semibold tracking-tight transition-all duration-200",
                                isActive && "font-bold"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
