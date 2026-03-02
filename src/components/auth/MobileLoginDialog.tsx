'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import { X, ShieldCheck, LogIn, Loader2, Mail, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import GoogleSignInButton, { GoogleIcon } from '@/components/auth/GoogleSignInButton';

interface MobileLoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess?: () => void;
    returnUrl?: string;
}

export function MobileLoginDialog({ isOpen, onClose, onAuthSuccess, returnUrl }: MobileLoginDialogProps) {
    const t = useTranslations('Events');
    const tAuth = useTranslations('Auth');
    const locale = useLocale();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [fullName, setFullName] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState(false);

    // 300ms guard — prevents the touch that opened the dialog from immediately closing it
    const [ready, setReady] = useState(false);
    useEffect(() => {
        if (isOpen) {
            setReady(false);
            const timer = setTimeout(() => setReady(true), 300);
            // Lock body scroll while dialog is open
            document.body.style.overflow = 'hidden';
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    // Ref-based backdrop detection: only close if pointer started AND ended on the backdrop
    const pointerDownOnBackdrop = useRef(false);

    // For portal — ensure we only render on the client
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!isOpen || !mounted) return null;

    const handleInlineLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setIsLoading(true);
        setError(null);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
            if (onAuthSuccess) onAuthSuccess();
            else window.location.reload();
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('Email not confirmed')) setError(tAuth('error_email_not_confirmed'));
            else if (msg.includes('Invalid login credentials')) setError(tAuth('error_invalid_credentials'));
            else setError(tAuth('error_generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleInlineRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !fullName) return;
        setIsLoading(true);
        setError(null);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?locale=${locale}&role=user${returnUrl ? `&next=${encodeURIComponent(returnUrl)}` : ''}`,
                    data: { role: 'user', full_name: fullName },
                },
            });
            if (signUpError) throw signUpError;
            setRegisterSuccess(true);
            fetch('/api/notify-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: fullName, userEmail: email, userRole: 'user', signupMethod: 'email' }),
            }).catch(() => { });
        } catch (err: any) {
            const msg = err.message || '';
            setError(msg.includes('User already registered') ? tAuth('error_user_already_registered') : tAuth('error_generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = (newMode: 'login' | 'register') => {
        setMode(newMode);
        setError(null);
        setEmail('');
        setPassword('');
        setFullName('');
        setRegisterSuccess(false);
    };

    // scrollIntoView on input focus to fight the keyboard
    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    const dialog = (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 animate-in fade-in duration-200"
            style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
            onPointerDown={(e) => {
                pointerDownOnBackdrop.current = e.target === e.currentTarget;
            }}
            onPointerUp={(e) => {
                if (ready && pointerDownOnBackdrop.current && e.target === e.currentTarget) {
                    onClose();
                }
                pointerDownOnBackdrop.current = false;
            }}
            onClick={(e) => {
                if (ready && e.target === e.currentTarget) onClose();
            }}
        >
            {/* Dialog card — rendered via Portal at document.body, completely outside EventBookingForm */}
            <div
                className="relative w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-[1.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-black/5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
            >
                {/* Decorative bg */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-primary/10 via-secondary/20 to-transparent" />

                {/* Header */}
                <div className="relative pt-5 px-6 pb-2 text-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/50 hover:bg-white transition-colors z-10"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>

                    <div className="w-12 h-12 bg-white rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>

                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                        {t('login_to_book')}
                    </h2>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('login_prompt')}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 pb-4 pt-1 space-y-3">
                    {registerSuccess ? (
                        <div className="text-center py-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Mail className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="text-base font-black text-gray-900 mb-1">
                                {tAuth('registration_success_title')}
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {tAuth('registration_success_desc', { email })}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Google Sign-In */}
                            <GoogleSignInButton
                                locale={locale}
                                redirectUrl={returnUrl}
                                onError={(msg) => setError(msg)}
                                className="w-full p-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group hover:bg-gray-50 active:scale-[0.98]"
                            >
                                <GoogleIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                <span className="text-sm">{tAuth('continue_google')}</span>
                            </GoogleSignInButton>

                            {/* Divider */}
                            <div className="relative py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100 dark:border-gray-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                                    <span className="px-4 bg-white dark:bg-gray-900 text-gray-400">
                                        {tAuth('or_email')}
                                    </span>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={mode === 'login' ? handleInlineLogin : handleInlineRegister} className="space-y-2.5">
                                {mode === 'register' && (
                                    <div className="relative">
                                        <UserPlus className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            onFocus={handleInputFocus}
                                            placeholder={tAuth('label_fullname')}
                                            className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                            required
                                            autoComplete="name"
                                        />
                                    </div>
                                )}
                                <div className="relative">
                                    <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={handleInputFocus}
                                        placeholder={tAuth('email')}
                                        className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                        required
                                        autoComplete="email"
                                        inputMode="email"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={handleInputFocus}
                                        placeholder={tAuth('password')}
                                        className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                        required
                                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                        minLength={mode === 'register' ? 6 : undefined}
                                    />
                                </div>

                                {error && (
                                    <p className="text-xs font-bold text-rose-600 text-center px-2">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                            <span>{mode === 'login' ? tAuth('login') : tAuth('create_account')}</span>
                                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Toggle Login / Register */}
                            <div className="text-center pt-1 pb-2">
                                {mode === 'login' ? (
                                    <p className="text-sm text-gray-500">
                                        {tAuth('no_account')}{' '}
                                        <button type="button" onClick={() => switchMode('register')} className="text-primary font-bold hover:underline">
                                            {tAuth('create_account')}
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {tAuth('have_account')}{' '}
                                        <button type="button" onClick={() => switchMode('login')} className="text-primary font-bold hover:underline">
                                            {tAuth('login')}
                                        </button>
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // Render via Portal directly on document.body — completely outside any parent component tree
    return createPortal(dialog, document.body);
}
