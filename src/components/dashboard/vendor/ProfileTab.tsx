'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Edit3, CheckCircle, AlertCircle, ImageIcon } from 'lucide-react';
import NextImage from 'next/image';

const detailsSchema = z.object({
    business_name: z.string().min(2),
    category: z.string().min(2),
    description_ar: z.string().optional(),
});

// Reusing the CITIES const from original file - ideally move to constants file
const CITIES: Record<string, { id: string, name_en: string, name_ar: string, lat: number, lng: number }[]> = {
    'tr': [
        { id: 'istanbul', name_en: 'Istanbul', name_ar: 'إسطنبول', lat: 41.0082, lng: 28.9784 },
        { id: 'ankara', name_en: 'Ankara', name_ar: 'أنقرة', lat: 39.9334, lng: 32.8597 },
        { id: 'izmir', name_en: 'Izmir', name_ar: 'إزمير', lat: 38.4237, lng: 27.1428 },
        { id: 'antalya', name_en: 'Antalya', name_ar: 'أنطاليا', lat: 36.8969, lng: 30.7133 },
        { id: 'bursa', name_en: 'Bursa', name_ar: 'بورصة', lat: 40.1885, lng: 29.0610 }
    ]
};

const ImageWithFallback = ({ src, alt, className, fallback }: { src?: string | null, alt: string, className?: string, fallback: React.ReactNode }) => {
    const [error, setError] = useState(false);
    if (!src || error) return <>{fallback}</>;
    return (
        <div className={`relative ${className} overflow-hidden`}>
            <NextImage src={src} alt={alt} fill className="object-cover" onError={() => setError(true)} />
        </div>
    );
};

export default function ProfileTab({ vendorData, setVendorData, showAlert }: any) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);

    const { register, handleSubmit } = useForm({
        resolver: zodResolver(detailsSchema),
        defaultValues: vendorData
    });

    const onDetailsSubmit = async (data: any) => {
        const { error } = await supabase.from('vendors').update(data).eq('id', vendorData.id);
        if (!error) {
            setVendorData((prev: any) => ({ ...prev, ...data }));
            showAlert("تم حفظ التغييرات بنجاح", 'success');
        } else showAlert(error.message, 'error');
    };

    const handleLocationSubmit = async () => {
        if (!vendorData?.lat || !vendorData?.lng) return;
        const { error } = await supabase.from('vendors').update({
            location_lat: vendorData.lat,
            location_long: vendorData.lng
        }).eq('id', vendorData.id);
        if (!error) showAlert("تم تحديث الموقع بنجاح", 'success');
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `${vendorData.id}/logo-${Date.now()}.jpg`;

        try {
            const { error: uploadError } = await supabase.storage.from('vendor-public').upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('vendor-public').getPublicUrl(fileName);
            const { error: dbError } = await supabase.from('vendors').update({ company_logo: publicUrl }).eq('id', vendorData.id);

            if (!dbError) {
                setVendorData((prev: any) => ({ ...prev, company_logo: publicUrl }));
                showAlert("تم تحديث الشعار بنجاح", 'success');
            }
        } catch (err: any) {
            showAlert(err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `${vendorData.id}/tax-id.${file.name.split('.').pop()}`;

        try {
            await supabase.storage.from('vendor-documents').upload(fileName, file, { upsert: true });
            await supabase.from('vendors').update({ tax_id_document: fileName, status: 'approved' }).eq('id', vendorData.id);
            setVendorData((prev: any) => ({ ...prev, tax_id_document: fileName, status: 'approved' }));
            showAlert("تم رفع الملف بنجاح", 'success');
        } catch (err: any) { showAlert(err.message, 'error'); }
        finally { setUploading(false); }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Logo Upload */}
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-3xl border border-gray-100 border-dashed relative group">
                <div className="w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden mb-4 relative ring-4 ring-white">
                    <ImageWithFallback
                        src={vendorData?.company_logo}
                        alt="Company Logo"
                        className="w-full h-full object-cover"
                        fallback={<ImageIcon className="text-gray-300 w-10 h-10" />}
                    />
                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity z-10 ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {uploading ? <Loader2 className="text-white w-8 h-8 animate-spin" /> : <Edit3 className="text-white w-6 h-6" />}
                    </div>
                </div>
                <input type="file" onChange={handleLogoUpload} className="absolute inset-0 cursor-pointer opacity-0" disabled={uploading} />
                <p className="text-sm font-bold text-gray-600">{uploading ? 'جاري الرفع...' : 'اضغط لتغيير الشعار'}</p>
            </div>

            {/* Main Details Form */}
            <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mr-1">اسم النشاط</label>
                    <input {...register('business_name')} className="input-field text-gray-900" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mr-1">التصنيف</label>
                    <select {...register('category')} className="input-field text-gray-900">
                        <option value="cultural">ثقافي</option>
                        <option value="entertainment">ترفيهي</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mr-1">الوصف</label>
                    <textarea {...register('description_ar')} className="input-field min-h-[120px] text-gray-900" />
                </div>
                <button disabled={uploading} className="btn-primary w-full">حفظ التغييرات</button>
            </form>

            {/* Location Section */}
            <div className="pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">الموقع</h3>
                <div className="space-y-4">
                    <select
                        className="input-field text-gray-900"
                        onChange={(e) => {
                            const district = CITIES['tr'].find(d => d.id === e.target.value);
                            if (district) setVendorData({ ...vendorData, district: district.id, lat: district.lat, lng: district.lng });
                        }}
                        value={vendorData?.district || ""}
                    >
                        <option value="" disabled>اختر المنطقة</option>
                        {CITIES['tr'].map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
                    </select>
                    <button onClick={handleLocationSubmit} disabled={!vendorData?.district} className="p-3 w-full bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">تحديث الموقع</button>
                </div>
            </div>

            {/* Verification Section */}
            <div className="pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">التحقق والمستندات</h3>
                <div className="border-2 border-dashed border-gray-200 bg-gray-50 p-6 rounded-2xl relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {vendorData?.status === 'approved' ? <CheckCircle className="text-green-500 w-6 h-6" /> : <AlertCircle className="text-amber-500 w-6 h-6" />}
                        <div>
                            <p className="font-bold text-gray-700 text-sm">السجل الضريبي</p>
                            <p className="text-xs text-gray-500">{vendorData?.status === 'approved' ? 'تم التحقق' : 'بانتظار التحقق أو الرفع'}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="file" onChange={handleVerificationUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-2 rounded-lg pointer-events-none">
                            {uploading ? 'جاري الرفع...' : 'رفع ملق'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
