'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { X, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

interface MobileLoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
    returnUrl?: string;
}

export function MobileLoginDialog({ isOpen, onClose, returnUrl }: MobileLoginDialogProps) {
    const t = useTranslations('Events');
    const tAuth = useTranslations('Auth');

    if (!isOpen) return null;

    const loginUrl = returnUrl ? `/login?redirect=${encodeURIComponent(returnUrl)}` : '/login';
    const registerUrl = returnUrl ? `/register?redirect=${encodeURIComponent(returnUrl)}` : '/register';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Dialog - Centered Layout */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
                <div
                    className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl transform overflow-hidden ring-1 ring-black/5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative Header Background */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-primary/10 via-secondary/20 to-transparent" />

                    {/* Header */}
                    <div className="relative pt-8 px-8 pb-4 text-center">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                            {t('login_to_book')}
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                            {t('login_prompt')}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8 pt-2 space-y-4">
                        {/* Login Button */}
                        <Link
                            href={loginUrl}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 group"
                        >
                            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            <span>{tAuth('login')}</span>
                        </Link>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                                <span className="px-4 bg-white dark:bg-gray-900 text-gray-400">
                                    {tAuth('no_account')}
                                </span>
                            </div>
                        </div>

                        {/* Sign Up Button */}
                        <Link
                            href={registerUrl}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white hover:border-primary/30 hover:text-primary transition-all active:scale-95 group"
                        >
                            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>{tAuth('create_account')}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

