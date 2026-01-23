'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Link } from '@/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const createForgotPasswordSchema = (t: any) => z.object({
    email: z.string().email(t('validation_email_invalid')),
});

type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export default function ForgotPasswordPage() {
    const t = useTranslations('Auth');
    const locale = useLocale();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [error, setError] = useState<string | null>(null);

    const forgotPasswordSchema = createForgotPasswordSchema(t);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password&locale=${locale}`,
            });

            if (error) throw error;

            setSubmittedEmail(data.email);
            setIsSuccess(true);
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
                <div className="mb-8">
                    <Link href="/login" className="inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors mb-6 group">
                        <ArrowLeft className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium text-sm">{t('back_to_login')}</span>
                    </Link>
                </div>

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
                            <h2 className="text-2xl font-black text-gray-900 mb-3">{t('email_sent_title')}</h2>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                {t('email_sent_desc', {
                                    email: submittedEmail
                                })}
                            </p>
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="text-primary font-bold hover:underline"
                            >
                                {t('try_different_email')}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="mb-8">
                                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{t('forgot_password_title')}</h1>
                                <p className="text-gray-500 font-medium">{t('forgot_password_desc')}</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        {t('email')}
                                    </label>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className={`w-full p-4 bg-gray-50 border ${errors.email ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                        placeholder="name@example.com"
                                    />
                                    {errors.email && <span className="text-red-500 text-xs font-bold ml-1">{errors.email.message}</span>}
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
                                            <span>{t('send_reset_link')}</span>
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
