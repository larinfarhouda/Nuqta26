'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    CreditCard,
    Shield,
    UserPlus,
    Users,
    Activity,
    Globe,
    Crown,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminSidebarProps {
    locale: string;
    userEmail: string;
}

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Vendors', icon: Store, href: '/admin/vendors' },
    { label: 'Bookings', icon: CreditCard, href: '/admin/bookings' },
    { label: 'Moderation', icon: Shield, href: '/admin/moderation' },
    { label: 'Prospects', icon: UserPlus, href: '/admin/prospects' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Countries', icon: Globe, href: '/admin/countries' },
    { label: 'Subscriptions', icon: Crown, href: '/admin/subscriptions' },
    { label: 'Activity', icon: Activity, href: '/admin/activity' },
];

export default function AdminSidebar({ locale, userEmail }: AdminSidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const isActive = (href: string) => {
        const fullPath = `/${locale}${href}`;
        if (href === '/admin') return pathname === fullPath;
        return pathname.startsWith(fullPath);
    };

    const sidebarWidth = isMobile ? '280px' : collapsed ? '72px' : '260px';

    const sidebarContent = (
        <aside
            className="flex flex-col bg-gradient-to-b from-zinc-950 to-zinc-900 transition-all duration-200 ease-out"
            style={{
                width: sidebarWidth,
                minHeight: '100vh',
                position: isMobile ? 'fixed' : 'sticky',
                top: 0,
                left: 0,
                zIndex: 50,
                transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center justify-between border-b border-white/[0.08]"
                style={{ padding: (!isMobile && collapsed) ? '20px 12px' : '20px 24px' }}
            >
                {(isMobile || !collapsed) && (
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2CA58D] to-[#1e7866] flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-[#2CA58D]/20">
                            N
                        </div>
                        <span className="text-white font-semibold text-base">
                            Nuqta Admin
                        </span>
                    </div>
                )}
                {isMobile ? (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center p-1.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-400 hover:text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Close sidebar"
                    >
                        <X size={16} />
                    </button>
                ) : (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center p-1.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-400 hover:text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 py-3 px-2">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    const showLabel = isMobile || !collapsed;
                    return (
                        <Link
                            key={item.href}
                            href={`/${locale}${item.href}`}
                            className={`flex items-center gap-3 rounded-xl mb-1 no-underline text-sm transition-all duration-150 relative group ${
                                active
                                    ? 'text-white font-semibold bg-[#2CA58D]/15'
                                    : 'text-zinc-400 font-normal hover:text-zinc-200 hover:bg-white/[0.06]'
                            }`}
                            style={{ padding: (!isMobile && collapsed) ? '12px 14px' : '12px 16px' }}
                            title={(!isMobile && collapsed) ? item.label : undefined}
                        >
                            {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-sm bg-[#2CA58D]" />
                            )}
                            <Icon size={20} className="shrink-0" />
                            {showLabel && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div
                className="border-t border-white/[0.08]"
                style={{ padding: (!isMobile && collapsed) ? '16px 8px' : '16px 20px' }}
            >
                {(isMobile || !collapsed) && (
                    <div className="text-zinc-500 text-xs overflow-hidden text-ellipsis whitespace-nowrap mb-2">
                        {userEmail}
                    </div>
                )}
                <Link
                    href={`/${locale}`}
                    className="flex items-center gap-2 text-zinc-400 text-[13px] no-underline p-1.5 rounded-md hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    title="Back to site"
                >
                    <LogOut size={16} />
                    {(isMobile || !collapsed) && <span>Exit Admin</span>}
                </Link>
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            {isMobile && !mobileOpen && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className="fixed top-4 left-4 z-[45] w-11 h-11 rounded-xl bg-zinc-950 border-none cursor-pointer flex items-center justify-center text-white shadow-lg shadow-black/20 hover:bg-zinc-800 transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Mobile backdrop */}
            {isMobile && mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45]"
                />
            )}

            {sidebarContent}
        </>
    );
}
