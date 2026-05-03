'use client';

import { useEffect, useRef } from 'react';
import { Image as ImageIcon, Star, Tag, Settings, ExternalLink, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface MoreSheetProps {
    open: boolean;
    onClose: () => void;
    onNavigate: (tab: string) => void;
    vendorSlug?: string | null;
}

export default function MoreSheet({ open, onClose, onNavigate, vendorSlug }: MoreSheetProps) {
    const t = useTranslations('Dashboard.vendor.tabs');
    const locale = useLocale();
    const backdropRef = useRef<HTMLDivElement>(null);

    // Close on escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const menuItems = [
        { id: 'GALLERY', icon: ImageIcon, label: t('gallery'), color: '#8b5cf6', bg: '#ede9fe' },
        { id: 'REVIEWS', icon: Star, label: t('reviews'), color: '#d97706', bg: '#fef3c7' },
        { id: 'DISCOUNTS', icon: Tag, label: t('discounts'), color: '#059669', bg: '#d1fae5' },
        { id: 'PROFILE', icon: Settings, label: t('settings'), color: '#64748b', bg: '#f1f5f9' },
    ];

    const handleItemClick = (tabId: string) => {
        onNavigate(tabId);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                ref={backdropRef}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 90,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease',
                }}
            />

            {/* Sheet */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 91,
                    background: '#fff',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    boxShadow: '0 -4px 40px rgba(0,0,0,0.12)',
                    padding: '12px 20px 32px',
                    transform: open ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                    maxHeight: '70vh',
                }}
            >
                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '36px', height: '4px', borderRadius: '2px',
                        background: '#d1d5db',
                    }} />
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', left: '16px',
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: 'none', background: '#f1f5f9', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X size={16} color="#64748b" />
                </button>

                {/* Menu Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '16px',
                }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '20px 12px',
                                borderRadius: '16px',
                                border: '1px solid #f1f5f9',
                                background: '#fafbfc',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: item.bg, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <item.icon size={22} color={item.color} />
                            </div>
                            <span style={{
                                fontSize: '13px', fontWeight: 600,
                                color: '#1e293b',
                            }}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* View Profile Button */}
                {vendorSlug && (
                    <a
                        href={`/${locale}/v/${vendorSlug}`}
                        target="_blank"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '14px',
                            borderRadius: '14px',
                            background: '#2CA58D',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <ExternalLink size={16} />
                        {t('gallery') ? 'عرض الصفحة العامة' : 'View Public Profile'}
                    </a>
                )}
            </div>
        </>
    );
}
