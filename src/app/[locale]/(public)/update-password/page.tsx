'use client';

import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useRouter } from '@/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const createUpdatePasswordSchema = (t: any) => z.object({
    password: z.string().min(6, t('validation_password_min')),
    confirmPassword: z.string().min(1, t('validation_password_required')),
}).refine((data) => data.password === data.confirmPassword, {
    message: t('validation_passwords_match'),
    path: ["confirmPassword"],
});

type UpdatePasswordFormData = z.infer<ReturnType<typeof createUpdatePasswordSchema>>;

export default function UpdatePasswordPage() {
    const t = useTranslations('Auth');
    const supabase = createClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const updatePasswordSchema = createUpdatePasswordSchema(t);

    const { register, handleSubmit, formState: { errors } } = useForm<UpdatePasswordFormData>({
        resolver: zodResolver(updatePasswordSchema),
    });

    const onSubmit = async (data: UpdatePasswordFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) throw error;

            setIsSuccess(true);

            // Redirect after a short delay
            timeoutRef.current = setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative z-10"
            >
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-3">{t('password_updated_title')}</h2>
                            <p className="text-gray-500 mb-4">
                                {t('password_updated_desc')}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="mb-8">
                                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{t('update_password_title')}</h1>
                                <p className="text-gray-500 font-medium">{t('update_password_desc')}</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="password" title={t('new_password')} className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                        <Lock className="w-3.5 h-3.5" />
                                        {t('new_password')}
                                    </label>
                                    <input
                                        {...register('password')}
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        className={`w-full p-4 bg-gray-50 border ${errors.password ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                        placeholder="••••••••"
                                    />
                                    {errors.password && <span className="text-red-500 text-xs font-bold ml-1">{errors.password.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" title={t('confirm_password')} className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                        <Lock className="w-3.5 h-3.5" />
                                        {t('confirm_password')}
                                    </label>
                                    <input
                                        {...register('confirmPassword')}
                                        id="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        className={`w-full p-4 bg-gray-50 border ${errors.confirmPassword ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                        placeholder="••••••••"
                                    />
                                    {errors.confirmPassword && <span className="text-red-500 text-xs font-bold ml-1">{errors.confirmPassword.message}</span>}
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
                                            <span>{t('update_password_btn')}</span>
                                            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
