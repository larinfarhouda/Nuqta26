'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useRouter, Link } from '@/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Users } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import GoogleSignInButton, { GoogleIcon } from '@/components/auth/GoogleSignInButton';

const createLoginSchema = (t: any) => z.object({
    email: z.string().email(t('validation_email_invalid')),
    password: z.string().min(1, t('validation_password_required')),
});

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginPage() {
    const t = useTranslations('Auth');
    const locale = useLocale();
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [emailForResend, setEmailForResend] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);

    const loginSchema = createLoginSchema(t);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (signInError) throw signInError;

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                if (!user.email_confirmed_at) {
                    await supabase.auth.signOut();
                    throw new Error('Email not confirmed');
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = profile?.role || user.user_metadata?.role || 'user';

                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else if (role === 'vendor') {
                    window.location.href = '/dashboard/vendor';
                } else if (role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/';
                }
            } else {
                window.location.href = redirectUrl || '/';
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const message = err.message || '';
            if (message.includes('Email not confirmed')) {
                setError(t('error_email_not_confirmed'));
                setEmailForResend(data.email);
            } else if (message.includes('Invalid login credentials')) {
                setError(t('error_invalid_credentials'));
            } else {
                setError(t('error_generic'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        if (!emailForResend) return;
        setResendStatus('loading');
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: emailForResend,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?locale=${locale}`
                }
            });
            if (error) throw error;
            setResendStatus('success');
            setError(t('resend_success'));
        } catch (err: any) {
            console.error('Resend confirmation error:', err);
            setResendStatus('error');
            setError(t('resend_error'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-teal-50/30" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Ambient decorative blurs */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[440px] relative z-10">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Top accent gradient */}
                    <div className="h-1.5 bg-gradient-to-r from-primary via-[#2CA58D] to-teal-400" />

                    <div className="p-8 md:p-10">
                        {/* Logo + Header */}
                        <div className="text-center mb-8">
                            <Link href="/" className="inline-block mb-5">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                                    <Image src="/H-logo-removebg.png" alt="Nuqta" width={36} height={36} className="object-contain" />
                                </div>
                            </Link>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                {t('signin_title')}
                            </h1>
                            <p className="mt-2 text-gray-500 text-sm font-medium">
                                {t('enter_details')}
                            </p>
                        </div>

                        {/* Google Sign-In */}
                        <GoogleSignInButton
                            locale={locale}
                            redirectUrl={redirectUrl || undefined}
                            onError={(msg) => setError(msg)}
                            className="w-full p-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:border-gray-300 hover:shadow-md flex items-center justify-center gap-3 group active:scale-[0.98]"
                        >
                            <GoogleIcon className="w-5 h-5" />
                            <span className="text-sm">{t('continue_google')}</span>
                        </GoogleSignInButton>

                        {/* Divider */}
                        <div className="relative flex items-center gap-4 my-7">
                            <div className="h-px bg-gray-200 flex-1" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('or_email')}</span>
                            <div className="h-px bg-gray-200 flex-1" />
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    {t('email')}
                                </label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className={`w-full px-4 py-3.5 bg-gray-50 border ${errors.email ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                />
                                {errors.email && <span className="text-red-500 text-xs font-bold px-1">{errors.email.message}</span>}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5" />
                                        {t('password')}
                                    </label>
                                    <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-teal-700 transition-colors">
                                        {t('forgot_password')}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        className={`w-full px-4 py-3.5 bg-gray-50 border ${errors.password ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white ltr:pr-12 rtl:pl-12`}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                                {errors.password && <span className="text-red-500 text-xs font-bold px-1">{errors.password.message}</span>}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className={`p-4 ${resendStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'} border text-sm rounded-2xl`}>
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <span className="font-medium flex-1">{error}</span>
                                        {error === t('error_email_not_confirmed') && resendStatus !== 'loading' && resendStatus !== 'success' && (
                                            <button
                                                type="button"
                                                onClick={handleResendConfirmation}
                                                className="text-xs font-bold underline hover:text-red-900 transition-colors whitespace-nowrap"
                                            >
                                                {t('resend_confirmation')}
                                            </button>
                                        )}
                                        {resendStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-gray-900/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <>
                                        <span>{t('login')}</span>
                                        <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Switch to Register */}
                        <div className="text-center mt-8 pt-6 border-t border-gray-100">
                            <p className="text-gray-500 text-sm font-medium">
                                {t('no_account')}{' '}
                                <Link href="/register" className="text-primary font-bold hover:underline hover:text-teal-700 transition-colors">
                                    {t('create_account')}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trust Signal */}
                <div className="flex items-center justify-center gap-2 mt-6 text-gray-400 text-xs font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('trusted_signal')}</span>
                </div>
            </div>
        </div>
    );
}
