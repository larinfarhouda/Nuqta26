'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    CreditCard,
    Shield,
    UserPlus,
    Activity,
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
            style={{
                width: sidebarWidth,
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.2s ease, transform 0.2s ease',
                position: isMobile ? 'fixed' : 'sticky',
                top: 0,
                left: 0,
                zIndex: 50,
                transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: (!isMobile && collapsed) ? '20px 12px' : '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {(isMobile || !collapsed) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                color: '#fff',
                                fontSize: '14px',
                            }}
                        >
                            N
                        </div>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>
                            Nuqta Admin
                        </span>
                    </div>
                )}
                {isMobile ? (
                    <button
                        onClick={() => setMobileOpen(false)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <X size={16} />
                    </button>
                ) : (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                )}
            </div>

            {/* Nav Items */}
            <nav style={{ flex: 1, padding: '12px 8px' }}>
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    const showLabel = isMobile || !collapsed;
                    return (
                        <Link
                            key={item.href}
                            href={`/${locale}${item.href}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: (!isMobile && collapsed) ? '12px 14px' : '12px 16px',
                                borderRadius: '10px',
                                marginBottom: '4px',
                                textDecoration: 'none',
                                color: active ? '#fff' : '#94a3b8',
                                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                                fontWeight: active ? 600 : 400,
                                fontSize: '14px',
                                transition: 'all 0.15s ease',
                                position: 'relative',
                            }}
                            title={(!isMobile && collapsed) ? item.label : undefined}
                        >
                            {active && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '3px',
                                        height: '20px',
                                        borderRadius: '0 3px 3px 0',
                                        background: '#8b5cf6',
                                    }}
                                />
                            )}
                            <Icon size={20} style={{ flexShrink: 0 }} />
                            {showLabel && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div
                style={{
                    padding: (!isMobile && collapsed) ? '16px 8px' : '16px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                {(isMobile || !collapsed) && (
                    <div
                        style={{
                            color: '#64748b',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '8px',
                        }}
                    >
                        {userEmail}
                    </div>
                )}
                <Link
                    href={`/${locale}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#94a3b8',
                        fontSize: '13px',
                        textDecoration: 'none',
                        padding: '6px 8px',
                        borderRadius: '6px',
                    }}
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
                    style={{
                        position: 'fixed',
                        top: '16px',
                        left: '16px',
                        zIndex: 45,
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#0f172a',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Mobile backdrop */}
            {isMobile && mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 45,
                    }}
                />
            )}

            {sidebarContent}
        </>
    );
}

