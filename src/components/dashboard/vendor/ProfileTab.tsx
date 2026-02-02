'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Edit3, CheckCircle, AlertCircle, ImageIcon, Layout, ExternalLink, Camera } from 'lucide-react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { slugify } from '@/utils/slugify';
import { useEffect } from 'react';
import PhoneInput from '@/components/ui/PhoneInput';
import { COUNTRIES } from '@/constants/locations';
import { TURKISH_BANKS } from '@/constants/banks';

const detailsSchema = (t: any) => z.object({
    business_name: z.string().min(2, t('validation.business_name_min')),
    slug: z.string().min(3, t('validation.slug_min')).regex(/^[a-z0-9-]+$/, t('validation.slug_format')).optional(),
    instagram: z.string().optional(),
    website: z.string().url(t('validation.invalid_url')).optional().or(z.literal("")),
    whatsapp_number: z.string().optional(),
    category: z.string().min(2),
    description_ar: z.string().optional(),
    bank_name: z.string().min(2, t('validation.bank_name_required')),
    bank_account_name: z.string().min(3, t('validation.bank_account_name_required')),
    bank_iban: z.string()
        .min(16, t('validation.bank_iban_min'))
        .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, t('validation.bank_iban_format')),
});

// CITIES moved to constants/locations.ts

const ImageWithFallback = ({ src, alt, className, fallback }: { src?: string | null, alt: string, className?: string, fallback: React.ReactNode }) => {
    const [error, setError] = useState(false);
    if (!src || error) return <>{fallback}</>;
    return (
        <div className={`relative ${className} overflow-hidden`}>
            <NextImage src={src} alt={alt} fill className="object-cover" onError={() => setError(true)} />
        </div>
    );
};

// Error Message Component
const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
        <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {message}
        </p>
    );
};

export default function ProfileTab({ vendorData, setVendorData, showAlert, demoMode = false }: any) {
    const supabase = createClient();
    const t = useTranslations('Dashboard.vendor.profile');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(detailsSchema(t)),
        defaultValues: vendorData,
        mode: 'onBlur' // Validate on blur
    });

    const businessName = watch('business_name');
    const slug = watch('slug');

    // Auto-generate slug when business name changes, if slug is not manually edited
    useEffect(() => {
        if (!vendorData.slug && businessName && (!slug || slug === slugify(businessName) || slugify(businessName).startsWith(slug))) {
            setValue('slug', slugify(businessName), { shouldValidate: true });
        }
    }, [businessName, setValue, vendorData.slug]);

    const onDetailsSubmit = async (data: any) => {
        const { error } = await supabase.from('vendors').update(data).eq('id', vendorData.id);
        if (!error) {
            setVendorData((prev: any) => ({ ...prev, ...data }));
            showAlert(t("save_success"), 'success');
        } else showAlert(error.message, 'error');
    };

    const handleLocationSubmit = async () => {
        if (!vendorData?.lat || !vendorData?.lng) return;
        const { error } = await supabase.from('vendors').update({
            location_lat: vendorData.lat,
            location_long: vendorData.lng
        }).eq('id', vendorData.id);
        if (!error) showAlert(t("location_success"), 'success');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        if (!e.target.files?.length) return;

        const isCover = type === 'cover';
        isCover ? setUploadingCover(true) : setUploadingLogo(true);

        const file = e.target.files[0];
        const fileName = `${vendorData.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;

        try {
            const { error: uploadError } = await supabase.storage.from('vendor-public').upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('vendor-public').getPublicUrl(fileName);
            const updateData = isCover ? { cover_image: publicUrl } : { company_logo: publicUrl };

            const { error: dbError } = await supabase.from('vendors').update(updateData).eq('id', vendorData.id);

            if (!dbError) {
                setVendorData((prev: any) => ({ ...prev, ...updateData }));
                showAlert(t(isCover ? "save_success" : "logo_success"), 'success');
            }
        } catch (err: any) {
            showAlert(err.message, 'error');
        } finally {
            isCover ? setUploadingCover(false) : setUploadingLogo(false);
        }
    };

    const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        // setUploading(true); // Re-use simpler state if needed or local
        const file = e.target.files[0];
        const fileName = `${vendorData.id}/tax-id.${file.name.split('.').pop()}`;

        try {
            await supabase.storage.from('vendor-documents').upload(fileName, file, { upsert: true });
            await supabase.from('vendors').update({ tax_id_document: fileName, status: 'approved' }).eq('id', vendorData.id);
            setVendorData((prev: any) => ({ ...prev, tax_id_document: fileName, status: 'approved' }));
            showAlert(t("upload_success"), 'success');
        } catch (err: any) { showAlert(err.message, 'error'); }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">

            {/* 1. Header & Live Preview Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('page_title')}</h2>
                    <p className="text-gray-500 text-sm">{t('page_subtitle')}</p>
                </div>
                {vendorData.slug && (
                    <a
                        href={`/v/${vendorData.slug}`}
                        target="_blank"
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full font-bold text-sm shadow-xl hover:bg-gray-800 transition-all hover:-translate-y-1"
                    >
                        <span>{t('view_live_profile')}</span>
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>

            {/* 2. Visual Identity Section (Cover + Logo) */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm relative group">
                {/* Cover Image */}
                <div className="relative h-48 md:h-64 bg-gray-100 group/cover">
                    <ImageWithFallback
                        src={vendorData?.cover_image}
                        alt="Cover Image"
                        className="w-full h-full object-cover"
                        fallback={<div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 bg-[url('/images/grid.svg')]"><ImageIcon className="w-8 h-8 opacity-50 mb-2" />{t('cover_image')}</div>}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <label className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-full font-bold text-sm text-gray-900 cursor-pointer hover:bg-white shadow-lg transition-all">
                            {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            {uploadingCover ? t('uploading') : t('change_cover')}
                            <input type="file" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" accept="image/*" disabled={uploadingCover} />
                        </label>
                    </div>
                </div>

                {/* Logo (Overlapping) */}
                <div className="px-8 relative -mt-16 mb-6 flex items-end justify-between">
                    <div className="relative group/logo">
                        <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                            <div className="w-full h-full rounded-2xl overflow-hidden relative bg-gray-50">
                                <ImageWithFallback
                                    src={vendorData?.company_logo}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                    fallback={<div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8" /></div>}
                                />
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${uploadingLogo ? 'opacity-100' : 'opacity-0 group-hover/logo:opacity-100'}`}>
                                    <label className="cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white transition-colors">
                                        {uploadingLogo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Edit3 className="w-6 h-6" />}
                                        <input type="file" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" accept="image/*" disabled={uploadingLogo} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Form Sections Grid */}
            <form onSubmit={handleSubmit(onDetailsSubmit)} className="grid md:grid-cols-2 gap-8">

                {/* Left Column: Core Identity */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                        <div className="p-2 bg-primary/5 rounded-xl text-primary"><Layout className="w-5 h-5" /></div>
                        <h3 className="font-bold text-gray-900">{t('brand_identity')}</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('business_name')}</label>
                            <input
                                {...register('business_name')}
                                className={`input-field py-3 font-bold text-lg text-gray-900 ${errors.business_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            <ErrorMessage message={errors.business_name?.message as string} />
                        </div>

                        {/* Slug / Link */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('profile_link')}</label>
                            <div className={`bg-gray-50 rounded-xl p-1 flex items-center text-sm border ${errors.slug ? 'border-red-500' : 'border-gray-200'}`}>
                                <span className="text-gray-400 font-medium px-3 select-none">nuqta.ist/v/</span>
                                <input
                                    {...register('slug')}
                                    className="flex-1 bg-transparent border-none outline-none text-gray-900 font-mono focus:ring-0 p-2"
                                    placeholder="my-brand"
                                />
                            </div>
                            <ErrorMessage message={errors.slug?.message as string} />
                            {!errors.slug && <p className="text-[10px] text-gray-400 font-medium">{t('profile_link_helper')}</p>}
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('category')}</label>
                            <div className="relative">
                                <select {...register('category')} className="input-field appearance-none cursor-pointer">
                                    <option value="cultural">{t('category_cultural')}</option>
                                    <option value="entertainment">{t('category_entertainment')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('description')}</label>
                            <textarea
                                {...register('description_ar')}
                                className="input-field min-h-[140px] text-gray-900 leading-relaxed resize-none p-4"
                                placeholder={t('description_placeholder')}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact & Location */}
                <div className="space-y-8">
                    {/* Contact / Socials */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><ExternalLink className="w-5 h-5" /></div>
                            <h3 className="font-bold text-gray-900">{t('contact_social')}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">{t('instagram')}</label>
                                    <input {...register('instagram')} className="input-field" placeholder={t('instagram_placeholder')} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">{t('whatsapp')}</label>
                                    <PhoneInput
                                        register={register}
                                        setValue={setValue}
                                        name="whatsapp_number"
                                        initialValue={vendorData.whatsapp_number}
                                        className="text-left"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">{t('website')}</label>
                                <input
                                    {...register('website')}
                                    className={`input-field ${errors.website ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder={t('website_placeholder')}
                                />
                                <ErrorMessage message={errors.website?.message as string} />
                            </div>
                        </div>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><AlertCircle className="w-5 h-5" /></div>
                            <h3 className="font-bold text-gray-900">{t('bank_details')}</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[11px] text-gray-500 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                                {t('bank_note')}
                            </p>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">
                                    {t('bank_name')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('bank_name')}
                                    className={`input-field appearance-none cursor-pointer ${errors.bank_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                >
                                    <option value="">{t('bank_name_placeholder')}</option>
                                    {TURKISH_BANKS.map((bank) => (
                                        <option key={bank} value={bank}>
                                            {bank}
                                        </option>
                                    ))}
                                </select>
                                <ErrorMessage message={errors.bank_name?.message as string} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">
                                    {t('bank_account_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('bank_account_name')}
                                    className={`input-field ${errors.bank_account_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder={t('bank_account_name_placeholder')}
                                />
                                <ErrorMessage message={errors.bank_account_name?.message as string} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">
                                    {t('bank_iban')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('bank_iban')}
                                    className={`input-field font-mono uppercase ${errors.bank_iban ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder={t('bank_iban_placeholder')}
                                />
                                <ErrorMessage message={errors.bank_iban?.message as string} />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Layout className="w-5 h-5" /></div>
                            <h3 className="font-bold text-gray-900">{t('location')}</h3>
                        </div>

                        <div className="space-y-4">
                            <select
                                className="input-field w-full"
                                onChange={(e) => {
                                    const allCities = COUNTRIES.flatMap(c => c.cities);
                                    const district = allCities.find(d => d.id === e.target.value);
                                    if (district) setVendorData({ ...vendorData, district: district.id });
                                }}
                                value={vendorData?.district || ""}
                            >
                                <option value="" disabled>{t('select_district')}</option>
                                {COUNTRIES.flatMap(c => c.cities).map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                            </select>
                            <button type="button" onClick={handleLocationSubmit} disabled={!vendorData?.district} className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition-colors text-sm">
                                {t('update_location')}
                            </button>
                        </div>
                    </div>

                    {/* Verification Mini-Card */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${vendorData?.status === 'approved' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center gap-3">
                            {vendorData?.status === 'approved' ? <CheckCircle className="text-green-600 w-5 h-5" /> : <AlertCircle className="text-amber-600 w-5 h-5" />}
                            <div>
                                <p className={`font-bold text-sm ${vendorData?.status === 'approved' ? 'text-green-800' : 'text-amber-800'}`}>{t('tax_record')}</p>
                                <p className={`text-xs ${vendorData?.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{vendorData?.status === 'approved' ? t('verified') : t('pending')}</p>
                            </div>
                        </div>
                        {vendorData?.status !== 'approved' && (
                            <label className="text-xs font-bold bg-white/50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white transition-colors text-amber-700">
                                {t('upload_file')}
                                <input type="file" onChange={handleVerificationUpload} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="md:col-span-2 sticky bottom-4 z-20">
                    <button className="w-full md:w-auto md:ml-auto block px-12 py-4 bg-primary text-white text-lg font-bold rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        {t('save_changes')}
                    </button>
                </div>
            </form>
        </div>
    );
}
