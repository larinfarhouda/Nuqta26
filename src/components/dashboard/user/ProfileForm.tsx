'use client';

import { useState } from 'react';
import { updateUserProfile } from '@/actions/user';
import { Loader2, Save, User, MapPin, Calendar, UserCircle, Phone } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useForm } from 'react-hook-form';
import LocationPicker from '@/components/ui/LocationPicker';
import PhoneInput from '@/components/ui/PhoneInput';

interface ProfileData {
    full_name: string | null;
    email: string | undefined;
    age?: number | null;
    gender?: string | null;
    country?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
}

// COUNTRY_CODES moved to PhoneInput.tsx

export default function ProfileForm({
    initialData
}: {
    initialData: ProfileData
}) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileData>({
        defaultValues: {
            full_name: initialData.full_name || '',
            email: initialData.email,
            age: initialData.age,
            gender: initialData.gender,
            country: initialData.country,
            city: initialData.city,
            district: initialData.district,
            phone: initialData.phone
        }
    });

    const onSubmit = async (data: ProfileData) => {
        setLoading(true);
        setMessage(null);

        try {
            const payload = {
                ...data,
                age: data.age ? Number(data.age) : null,
            };

            const result = await updateUserProfile(payload);

            if (result.error) {
                setMessage({ type: 'error', text: 'فشل تحديث الملف الشخصي' });
            } else {
                setMessage({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' });
                router.refresh();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'حدث خطأ غير متوقع' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-2xl" dir="rtl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                معلومات الملف الشخصي
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        البريد الإلكتروني
                    </label>
                    <input
                        type="email"
                        value={initialData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-medium cursor-not-allowed text-left"
                        dir="ltr"
                    />
                    <p className="text-xs text-gray-400 mt-1">لا يمكن تغيير البريد الإلكتروني.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        الاسم الكامل
                    </label>
                    <input
                        {...register('full_name', { required: "الاسم الكامل مطلوب" })}
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        placeholder="أدخل اسمك الكامل"
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        رقم الهاتف
                    </label>
                    <PhoneInput
                        register={register}
                        setValue={setValue}
                        name="phone"
                        initialValue={initialData.phone}
                        error={errors.phone?.message as string}
                        className="text-left"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            العمر
                        </label>
                        <input
                            {...register('age')}
                            type="number"
                            min="13"
                            max="100"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            placeholder="العمر"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-gray-500" />
                            الجنس
                        </label>
                        <select
                            {...register('gender')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        >
                            <option value="">اختر...</option>
                            <option value="Male">ذكر</option>
                            <option value="Female">أنثى</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        الموقع
                    </label>
                    <LocationPicker setValue={setValue} className="h-[250px]" />
                    <div className="mt-2 flex gap-2 text-xs text-gray-400 font-medium">
                        الموقع المحدد: {[watch('district'), watch('city'), watch('country')].filter(Boolean).join(', ') || 'لا يوجد'}
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري الحفظ...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            حفظ التغييرات
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
