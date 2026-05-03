'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from '@/navigation';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, User, Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, Users, Check, Calendar, UserCircle, Phone, Globe, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import PhoneInput from '@/components/ui/PhoneInput';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import GoogleSignInButton, { GoogleIcon } from '@/components/auth/GoogleSignInButton';
import { getCountryFlag } from '@/utils/country-helpers';
import Image from 'next/image';

// Schemas
const createUserSchema = (t: any) => z.object({
    fullName: z.string().min(2, t('validation_full_name_required')),
    email: z.string().email(t('validation_email_invalid')),
    password: z.string().min(6, t('validation_password_min')),
    age: z.string().min(1, t('validation_full_name_required')),
    gender: z.enum(['Male', 'Female'], { message: t('validation_full_name_required') }),
    country: z.string().min(1, 'Required'),
    city: z.string().min(1, 'Required'),
    phone: z.string().min(1, t('validation_full_name_required')),
});

const createVendorSchema = (t: any) => z.object({
    businessName: z.string().min(2, t('validation_business_name_required')),
    email: z.string().email(t('validation_email_invalid')),
    password: z.string().min(6, t('validation_password_min')),
    country: z.string().min(2, 'Please select a country'),
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
    const redirectUrl = searchParams.get('redirect');
    const [role, setRole] = useState<'user' | 'vendor'>(initialRole);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [referralSource, setReferralSource] = useState<Record<string, string> | null>(null);
    const [countries, setCountries] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('tr');
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1); // Two-step flow for users

    // Load countries
    useEffect(() => {
        const supabaseLocal = createSupabaseClient();
        supabaseLocal.from('countries').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
            setCountries(data || []);
        });
    }, []);

    // Load cities when country changes
    useEffect(() => {
        const supabaseLocal = createSupabaseClient();
        supabaseLocal.from('cities').select('*').eq('country_id', selectedCountry).eq('is_active', true).order('sort_order').then(({ data }) => {
            setCities(data || []);
        });
    }, [selectedCountry]);

    // Read referral cookie
    useEffect(() => {
        try {
            const cookies = document.cookie.split('; ');
            const refCookie = cookies.find((c) => c.startsWith('__nuqta_ref='));
            if (refCookie) {
                const value = decodeURIComponent(refCookie.split('=').slice(1).join('='));
                setReferralSource(JSON.parse(value));
            }
        } catch { /* ignore parse errors */ }
    }, []);

    const userSchema = createUserSchema(t);
    const vendorSchema = createVendorSchema(t);

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset, trigger } = useForm<UserFormData & VendorFormData>({
        resolver: zodResolver(role === 'user' ? userSchema : vendorSchema) as any,
        defaultValues: {
            country: 'tr'
        }
    });

    const handleRoleChange = (newRole: 'user' | 'vendor') => {
        setRole(newRole);
        setStep(1);
        reset();
        setError(null);
    };

    // Step 1 → Step 2: validate first 3 fields
    const handleContinueToStep2 = async () => {
        const isValid = await trigger(['fullName', 'email', 'password']);
        if (isValid) {
            setStep(2);
            setError(null);
        }
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
                    emailRedirectTo: `${window.location.origin}/auth/callback?locale=${locale}&role=${role}${redirectUrl ? `&next=${encodeURIComponent(redirectUrl)}` : ''}`,
                    data: {
                        role: role,
                        full_name: fullName,
                        country: data.country || selectedCountry,
                        ...(role === 'user' && {
                            age: data.age ? parseInt(data.age) : null,
                            gender: data.gender,
                            city: data.city,
                            phone: data.phone,
                        }),
                        ...(referralSource && { referral_source: referralSource }),
                    },
                },
            });

            if (signUpError) throw signUpError;

            setIsSuccess(true);
            setSubmittedEmail(data.email);

            // Admin notification (fire-and-forget)
            fetch('/api/notify-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: fullName,
                    userEmail: data.email,
                    userRole: role,
                    signupMethod: 'email',
                    additionalInfo: {
                        ...(role === 'user' ? {
                            ...(data.phone ? { Phone: data.phone } : {}),
                            ...(data.city ? { City: data.city } : {}),
                            ...(data.gender ? { Gender: data.gender } : {}),
                            ...(data.age ? { Age: data.age } : {}),
                        } : {}),
                        ...(referralSource?.utm_source ? { 'Referral Source': referralSource.utm_source } : {}),
                        ...(referralSource?.utm_medium ? { 'Referral Medium': referralSource.utm_medium } : {}),
                        ...(referralSource?.utm_campaign ? { 'Referral Campaign': referralSource.utm_campaign } : {}),
                        ...(referralSource?.landing_page ? { 'Landing Page': referralSource.landing_page } : {}),
                    },
                }),
            }).catch(() => { /* silently ignore */ });

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

    const inputClasses = (hasError: boolean) =>
        `w-full px-4 py-3.5 bg-gray-50 border ${hasError ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'} rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white`;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-teal-50/30" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Ambient blurs */}
            <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[440px] relative z-10">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Top accent */}
                    <div className={`h-1.5 bg-gradient-to-r ${role === 'user' ? 'from-primary via-[#2CA58D] to-teal-400' : 'from-teal-700 via-emerald-600 to-teal-400'} transition-colors duration-500`} />

                    <div className="p-8 md:p-10">
                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                /* ---- SUCCESS STATE ---- */
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-3">{t('registration_success_title')}</h2>
                                    <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-8">
                                        {t('registration_success_desc', { email: submittedEmail })}
                                    </p>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center px-8 py-4 font-bold text-white rounded-2xl shadow-lg transition-all active:scale-95 bg-primary hover:bg-teal-700 shadow-primary/30"
                                    >
                                        {t('back_to_login')}
                                    </Link>
                                </motion.div>
                            ) : (
                                /* ---- FORM STATE ---- */
                                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {/* Logo + Header */}
                                    <div className="text-center mb-6">
                                        <Link href="/" className="inline-block mb-4">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                                                <Image src="/H-logo-removebg.png" alt="Nuqta" width={36} height={36} className="object-contain" />
                                            </div>
                                        </Link>
                                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                            {role === 'user' && step === 2 ? t('step_2_title') : t('step_1_title')}
                                        </h1>
                                        <p className="mt-1.5 text-gray-500 text-sm font-medium">
                                            {role === 'user' && step === 2 ? t('step_2_subtitle') : t('step_1_subtitle')}
                                        </p>
                                    </div>

                                    {/* Step indicator for user flow */}
                                    {role === 'user' && (
                                        <div className="flex items-center justify-center gap-2 mb-6">
                                            <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                                            <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                                        </div>
                                    )}

                                    {/* Role Toggle */}
                                    {step === 1 && (
                                        <div className="flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl mb-6 relative border border-gray-200/50">
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
                                    )}

                                    {/* Google Sign-In — step 1 only */}
                                    {step === 1 && (
                                        <>
                                            <GoogleSignInButton
                                                locale={locale}
                                                role={role}
                                                redirectUrl={redirectUrl || undefined}
                                                onError={(msg) => setError(msg)}
                                                className="w-full p-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:border-gray-300 hover:shadow-md flex items-center justify-center gap-3 group active:scale-[0.98]"
                                            >
                                                <GoogleIcon className="w-5 h-5" />
                                                <span className="text-sm">{t('continue_google')}</span>
                                            </GoogleSignInButton>

                                            <div className="relative flex items-center gap-4 my-6">
                                                <div className="h-px bg-gray-200 flex-1" />
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('or_email')}</span>
                                                <div className="h-px bg-gray-200 flex-1" />
                                            </div>
                                        </>
                                    )}

                                    {/* Form */}
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <AnimatePresence mode="wait" initial={false}>
                                            {/* ===== STEP 1 ===== */}
                                            {step === 1 && (
                                                <motion.div
                                                    key={`step1-${role}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="space-y-4"
                                                >
                                                    {/* Name */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                            {role === 'user' ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                                                            {role === 'user' ? t('label_fullname') : t('business_name_label')}
                                                        </label>
                                                        <input
                                                            {...register(role === 'user' ? 'fullName' : 'businessName')}
                                                            type="text"
                                                            className={inputClasses(!!(errors.fullName || errors.businessName))}
                                                            placeholder={role === 'user' ? t('label_fullname') : t('business_name_placeholder')}
                                                        />
                                                        {(errors.fullName || errors.businessName) && (
                                                            <span className="text-red-500 text-xs font-bold px-1">
                                                                {role === 'user' ? errors.fullName?.message : errors.businessName?.message}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Country — vendor only on step 1 */}
                                                    {role === 'vendor' && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                                <Globe className="w-3.5 h-3.5" />
                                                                {t('country') || 'Country'}
                                                            </label>
                                                            <select
                                                                {...register('country')}
                                                                value={selectedCountry}
                                                                onChange={e => {
                                                                    setSelectedCountry(e.target.value);
                                                                    setValue('country', e.target.value);
                                                                }}
                                                                className={inputClasses(false) + ' appearance-none'}
                                                            >
                                                                {countries.map(c => (
                                                                    <option key={c.id} value={c.id}>{getCountryFlag(c.id)} {locale === 'ar' ? c.name_ar : c.name_en}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Email */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            {t('email')}
                                                        </label>
                                                        <input
                                                            {...register('email')}
                                                            type="email"
                                                            className={inputClasses(!!errors.email)}
                                                            placeholder="name@example.com"
                                                            autoComplete="email"
                                                        />
                                                        {errors.email && <span className="text-red-500 text-xs font-bold px-1">{errors.email.message}</span>}
                                                    </div>

                                                    {/* Password */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                            <Lock className="w-3.5 h-3.5" />
                                                            {t('password')}
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                {...register('password')}
                                                                type={showPassword ? 'text' : 'password'}
                                                                className={inputClasses(!!errors.password) + ' ltr:pr-12 rtl:pl-12'}
                                                                placeholder="••••••••"
                                                                autoComplete="new-password"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                                                                tabIndex={-1}
                                                            >
                                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                        {errors.password && <span className="text-red-500 text-xs font-bold px-1">{errors.password.message}</span>}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* ===== STEP 2 (user only) ===== */}
                                            {step === 2 && role === 'user' && (
                                                <motion.div
                                                    key="step2"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="space-y-4"
                                                >
                                                    {/* Phone */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
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

                                                    {/* Age + Gender */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {t('age_label')}
                                                            </label>
                                                            <input
                                                                {...register('age')}
                                                                type="number"
                                                                min="13"
                                                                max="100"
                                                                className={inputClasses(!!errors.age)}
                                                                placeholder="18"
                                                            />
                                                            {errors.age && <span className="text-red-500 text-xs font-bold px-1">{errors.age.message}</span>}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                                <UserCircle className="w-3.5 h-3.5" />
                                                                {t('gender_label')}
                                                            </label>
                                                            <select
                                                                {...register('gender')}
                                                                className={inputClasses(!!errors.gender) + ' appearance-none'}
                                                            >
                                                                <option value="">{t('select_placeholder')}</option>
                                                                <option value="Male">{t('gender_male')}</option>
                                                                <option value="Female">{t('gender_female')}</option>
                                                            </select>
                                                            {errors.gender && <span className="text-red-500 text-xs font-bold px-1">{errors.gender.message}</span>}
                                                        </div>
                                                    </div>

                                                    {/* Country */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                            <Globe className="w-3.5 h-3.5" />
                                                            {t('country') || 'Country'}
                                                        </label>
                                                        <select
                                                            {...register('country')}
                                                            value={selectedCountry}
                                                            onChange={e => {
                                                                setSelectedCountry(e.target.value);
                                                                setValue('country', e.target.value);
                                                                setValue('city', '');
                                                            }}
                                                            className={inputClasses(false) + ' appearance-none'}
                                                        >
                                                            {countries.map(c => (
                                                                <option key={c.id} value={c.id}>{getCountryFlag(c.id)} {locale === 'ar' ? c.name_ar : c.name_en}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* City */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {t('city')}
                                                        </label>
                                                        <select
                                                            {...register('city')}
                                                            className={inputClasses(!!errors.city) + ' appearance-none'}
                                                        >
                                                            <option value="">{t('select_placeholder')}</option>
                                                            {cities.map(city => (
                                                                <option key={city.id} value={city.id}>
                                                                    {locale === 'ar' ? city.name_ar : city.name_en}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors.city && <span className="text-red-500 text-xs font-bold px-1">{errors.city.message}</span>}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Error */}
                                        {error && (
                                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                                <span className="font-medium">{error}</span>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {role === 'user' && step === 1 ? (
                                            /* User Step 1: Continue button (not submit) */
                                            <button
                                                type="button"
                                                onClick={handleContinueToStep2}
                                                className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-gray-900/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                                            >
                                                <span>{t('continue_btn')}</span>
                                                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                            </button>
                                        ) : role === 'user' && step === 2 ? (
                                            /* User Step 2: Back + Submit */
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    className="px-5 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center gap-2"
                                                >
                                                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                                                    <span className="hidden sm:inline">{t('back_btn')}</span>
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="flex-1 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-gray-900/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60"
                                                >
                                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                                        <>
                                                            <span>{t('create_account_heading')}</span>
                                                            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            /* Vendor: single submit */
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-4 bg-gradient-to-r from-teal-800 to-teal-700 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-teal-800/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                                    <>
                                                        <span>{t('create_account_heading')}</span>
                                                        <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </form>

                                    {/* Switch to Login */}
                                    <div className="text-center mt-8 pt-6 border-t border-gray-100">
                                        <p className="text-gray-500 text-sm font-medium">
                                            {t('have_account')}{' '}
                                            <Link href="/login" className="text-primary font-bold hover:underline transition-colors">
                                                {t('login')}
                                            </Link>
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
