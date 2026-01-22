'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useRouter, Link } from '@/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, ArrowRight, AlertCircle, Facebook } from 'lucide-react';
import Image from 'next/image';

// Schema creator
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loginSchema = createLoginSchema(t);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback?locale=${locale}`,
                queryParams: {
                    role: 'user' // Default to user for new social signups from login page
                }
            },
        });
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (signInError) throw signInError;

            // Check role to redirect appropriately
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Prioritize user_metadata role (set during signup)
                let role = user.user_metadata?.role;

                // Fallback to profiles table if metadata is missing
                if (!role) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                    role = profile?.role;
                }

                if (role === 'vendor') {
                    router.push('/dashboard/vendor');
                } else if (role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }


            } else {
                router.push('/');
            }

        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">

            {/* Left Side: Visual / Brand */}
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary via-teal-900 to-slate-900 relative items-center justify-center p-12 text-white overflow-hidden"
            >
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

                {/* Animated blobs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px]"
                />

                <div className="relative z-10 max-w-lg text-center lg:text-right" dir="rtl">
                    <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-black/20 mx-auto lg:mr-0 relative overflow-hidden group hover:scale-105 transition-all duration-500">
                        <Image src="/H-logo-removebg.png" alt="Nuqta Logo" fill className="object-contain p-4" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 leading-tight">{t('welcome_title')}</h1>
                    <p className="text-xl text-teal-100 leading-relaxed font-light">
                        {t('welcome_subtitle')}
                    </p>
                </div>
            </motion.div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {/* Decorative background elements for the form side */}
                <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md space-y-8 bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative z-10"
                >
                    <div className={`text-center ${locale === 'ar' ? 'lg:text-right' : 'lg:text-left'}`}>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('signin_title')}</h2>
                        <p className="mt-2 text-gray-500 font-medium">{t('enter_details')}</p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#f9fafb' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOAuthLogin('google')}
                            className="p-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:rotate-12 transition-transform" alt="Google" />
                            <span className="text-sm">{t('continue_google')}</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#166fe5' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOAuthLogin('facebook')}
                            className="p-3 bg-[#1877F2] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-blue-500/25 flex items-center justify-center gap-2 group"
                        >
                            <Facebook className="w-5 h-5 fill-current group-hover:rotate-12 transition-transform" />
                            <span className="text-sm">{t('continue_facebook')}</span>
                        </motion.button>
                    </div>

                    <div className="relative flex items-center gap-4 my-2">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{t('or_email')}</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                <Mail className="w-3.5 h-3.5" />
                                {t('email')}
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className={`w-full p-4 bg-white/50 border ${errors.email ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                placeholder="name@example.com"
                            />
                            {errors.email && <span className="text-red-500 text-xs font-bold ml-1">{errors.email.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5" />
                                    {t('password')}
                                </label>
                                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-teal-700 transition-colors">{t('forgot_password')}</Link>
                            </div>
                            <input
                                {...register('password')}
                                type="password"
                                className={`w-full p-4 bg-white/50 border ${errors.password ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                placeholder="••••••••"
                            />
                            {errors.password && <span className="text-red-500 text-xs font-bold ml-1">{errors.password.message}</span>}
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-gray-900/20 transition-all flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>
                                    <span>{t('login')}</span>
                                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="text-center pt-4">
                        <p className="text-gray-500 text-sm font-medium">
                            {t('no_account')} {' '}
                            <Link href="/register" className="text-primary font-bold hover:underline hover:text-teal-700 transition-colors">
                                {t('create_account')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
