'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from '@/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, User, Mail, Lock, CheckCircle, ArrowRight, Sparkles, Facebook, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/navigation';
import { Calendar, UserCircle, MapPin, Check, Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PhoneInput from '@/components/ui/PhoneInput';
import { COUNTRIES } from '@/constants/locations';

// Schemas
const createUserSchema = (t: any) => z.object({
    fullName: z.string().min(2, t('validation_full_name_required')),
    email: z.string().email(t('validation_email_invalid')),
    password: z.string().min(6, t('validation_password_min')),
    age: z.string().optional(),
    gender: z.enum(['Male', 'Female']).optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    phone: z.string().optional(),
});

const createVendorSchema = (t: any) => z.object({
    businessName: z.string().min(2, t('validation_business_name_required')),
    email: z.string().email(t('validation_email_invalid')),
    password: z.string().min(6, t('validation_password_min')),
});

type UserFormData = z.infer<ReturnType<typeof createUserSchema>>;
type VendorFormData = z.infer<ReturnType<typeof createVendorSchema>>;

export default function RegisterPage() {
    const t = useTranslations('Auth');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const initialRole = searchParams.get('role') === 'vendor' ? 'vendor' : 'user';
    const [role, setRole] = useState<'user' | 'vendor'>(initialRole);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const userSchema = createUserSchema(t);
    const vendorSchema = createVendorSchema(t);

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<UserFormData & VendorFormData>({
        resolver: zodResolver(role === 'user' ? userSchema : vendorSchema) as any,
        defaultValues: {
            country: 'tr'
        }
    });

    // Reset form when switching roles
    const handleRoleChange = (newRole: 'user' | 'vendor') => {
        setRole(newRole);
        reset();
        setError(null);
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError(null);

        const fullName = role === 'user' ? data.fullName : data.businessName;

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        role: role,
                        full_name: fullName,
                        ...(role === 'user' && {
                            age: data.age ? parseInt(data.age) : null,
                            gender: data.gender,
                            country: data.country,
                            city: data.city,
                            phone: data.phone,
                        })
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Successful signup
            setIsSuccess(true);
            setSubmittedEmail(data.email);

        } catch (err: any) {
            console.error('Registration error:', err);
            const message = err.message || '';
            if (message.includes('User already registered')) {
                setError(t('error_user_already_registered'));
            } else {
                setError(t('error_generic'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?locale=${locale}&role=${role}`,
                    queryParams: {
                        role: role
                    }
                },
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('OAuth error:', err);
            setError(t('error_generic'));
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">

            {/* --- MARKETING SIDE (Left) --- */}
            <div className="lg:w-1/2 relative bg-gray-900 overflow-hidden text-white flex flex-col justify-center p-8 lg:p-16 transition-colors duration-500">

                {/* Dynamic Backgrounds based on Role */}
                <AnimatePresence mode="wait">
                    {role === 'user' ? (
                        <motion.div
                            key="user-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-teal-900 to-slate-900"
                        />
                    ) : (
                        <motion.div
                            key="vendor-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 z-0 bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900"
                        />
                    )}
                </AnimatePresence>

                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 pointer-events-none" />

                <div className="relative z-10 max-w-lg text-right" dir="rtl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={role}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-bold border border-white/20 mb-8">
                                {role === 'user' ? <Sparkles className="w-4 h-4 text-secondary" /> : <Building2 className="w-4 h-4 text-emerald-300" />}
                                <span className={role === 'user' ? "text-secondary" : "text-emerald-100"}>
                                    {role === 'user' ? t('for_explorers') : t('for_organizers')}
                                </span>
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight">
                                {role === 'user' ? t('user_hero_title') : t('vendor_hero_title')}
                            </h1>

                            <p className="text-lg text-gray-200 mb-10 leading-relaxed font-light">
                                {role === 'user'
                                    ? t('user_hero_desc')
                                    : t('vendor_hero_desc')}
                            </p>

                            <div className="space-y-4">
                                {(role === 'user' ? [
                                    t('user_feature_1'),
                                    t('user_feature_2'),
                                    t('user_feature_3')
                                ] : [
                                    t('vendor_feature_1'),
                                    t('vendor_feature_2'),
                                    t('vendor_feature_3')
                                ]).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle className={`w-6 h-6 ${role === 'user' ? 'text-secondary' : 'text-emerald-400'}`} />
                                        <span className="text-lg font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* --- FORM SIDE (Right) --- */}
            <div className="lg:w-1/2 p-4 lg:p-12 flex items-center justify-center bg-gray-50 relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {/* Decorative background elements */}
                <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative z-10"
                >
                    {/* Success State or Form */}
                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-4">{t('registration_success_title')}</h2>
                                <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-sm mx-auto">
                                    {t('registration_success_desc', {
                                        email: submittedEmail
                                    })}
                                </p>
                                <Link
                                    href="/login"
                                    className={`inline-flex items-center justify-center px-8 py-4 font-bold text-white rounded-2xl shadow-lg transition-all active:scale-95 ${role === 'user' ? 'bg-primary hover:bg-teal-700 shadow-primary/30' : 'bg-teal-700 hover:bg-teal-800 shadow-teal-700/30'
                                        }`}
                                >
                                    {t('back_to_login')}
                                </Link>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="mb-8 text-center">
                                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{t('create_account_heading')}</h2>
                                    <p className="text-gray-500 font-medium">{t('start_journey')}</p>
                                </div>

                                {/* Role Toggle */}
                                <div className="flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl mb-8 relative border border-gray-200/50">
                                    <button
                                        type="button"
                                        onClick={() => handleRoleChange('user')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl z-10 transition-colors font-bold text-sm relative ${role === 'user' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {role === 'user' && (
                                            <motion.div
                                                layoutId="role-indicator"
                                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 z-[-1]"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <User className="w-4 h-4" />
                                        {t('visitor')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRoleChange('vendor')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl z-10 transition-colors font-bold text-sm relative ${role === 'vendor' ? 'text-teal-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {role === 'vendor' && (
                                            <motion.div
                                                layoutId="role-indicator"
                                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 z-[-1]"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <Building2 className="w-4 h-4" />
                                        {t('organizer')}
                                    </button>
                                </div>

                                {/* Social Login */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
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

                                <div className="relative flex items-center gap-4 mb-6">
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    <span className="text-xs font-extra bold text-gray-400 uppercase tracking-widest">{t('or_email')}</span>
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={role}
                                            initial={{ opacity: 0, x: role === 'user' ? -20 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: role === 'user' ? 20 : -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-5"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                                    {role === 'user' ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                                                    {role === 'user' ? t('label_fullname') : t('business_name_label')}
                                                </label>
                                                <input
                                                    {...register(role === 'user' ? 'fullName' : 'businessName')}
                                                    type="text"
                                                    className={`w-full p-4 bg-white/50 border ${errors.fullName || errors.businessName ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                                    placeholder={role === 'user' ? t('label_fullname') : t('business_name_placeholder')}
                                                />
                                                {(errors.fullName || errors.businessName) && (
                                                    <span className="text-red-500 text-xs font-bold ml-1">
                                                        {role === 'user' ? errors.fullName?.message : errors.businessName?.message}
                                                    </span>
                                                )}
                                            </div>

                                            {role === 'user' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {t('age_label')}
                                                            </label>
                                                            <input
                                                                {...register('age')}
                                                                type="number"
                                                                min="13"
                                                                max="100"
                                                                className="w-full p-4 bg-white/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white"
                                                                placeholder="18"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                                                <UserCircle className="w-3.5 h-3.5" />
                                                                {t('gender_label')}
                                                            </label>
                                                            <select
                                                                {...register('gender')}
                                                                className="w-full p-4 bg-white/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all font-medium text-gray-900 focus:bg-white appearance-none"
                                                            >
                                                                <option value="">{t('select_placeholder')}</option>
                                                                <option value="Male">{t('gender_male')}</option>
                                                                <option value="Female">{t('gender_female')}</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            {t('phone_label')}
                                                        </label>
                                                        <PhoneInput
                                                            register={register}
                                                            setValue={setValue}
                                                            name="phone"
                                                            error={errors.phone?.message as string}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {t('city')}
                                                        </label>
                                                        <select
                                                            {...register('city')}
                                                            className="w-full p-4 bg-white/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all font-medium text-gray-900 focus:bg-white appearance-none"
                                                        >
                                                            <option value="">{t('select_placeholder')}</option>
                                                            {COUNTRIES[0]?.cities?.map(city => (
                                                                <option key={city.id} value={city.id}>
                                                                    {locale === 'ar' ? city.name_ar : city.name_en}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <input type="hidden" {...register('country')} value="tr" />
                                                </>
                                            )}

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
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 ml-1">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    {t('password')}
                                                </label>
                                                <input
                                                    {...register('password')}
                                                    type="password"
                                                    className={`w-full p-4 bg-white/50 border ${errors.password ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`}
                                                    placeholder="••••••••"
                                                />
                                                {errors.password && <span className="text-red-500 text-xs font-bold ml-1">{errors.password.message}</span>}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {error && (
                                        <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-4 text-white font-bold rounded-2xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg ${role === 'user'
                                            ? 'bg-primary hover:bg-teal-700 shadow-primary/30'
                                            : 'bg-teal-700 hover:bg-teal-800 shadow-teal-700/30'
                                            }`}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                            <>
                                                <span>{t('create_account_heading')}</span>
                                                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                            </>
                                        )}
                                    </motion.button>
                                </form>

                                {/* Footer */}
                                <div className="mt-8 text-center pt-6 border-t border-gray-200/50">
                                    <p className="text-gray-500 text-sm font-medium">
                                        {t('have_account')} {' '}
                                        <Link href="/login" className={`font-bold hover:underline transition-colors ${role === 'user' ? 'text-primary' : 'text-teal-700'}`}>
                                            {t('login')}
                                        </Link>
                                    </p>
                                </div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
