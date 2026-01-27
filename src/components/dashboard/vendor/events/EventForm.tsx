'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEvent, updateEvent } from '@/actions/vendor/events';
import { Loader2, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';

// Sub-components
import ImageUploader from './components/ImageUploader';
import TicketManager from './components/TicketManager';
import EventMap from './components/EventMap';
import BulkDiscountManager from './components/BulkDiscountManager';

// Zod Schema Definition
const schema = z.object({
    title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
    description: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل").optional().or(z.literal('')),
    event_type: z.string().min(1, "يرجى اختيار نوع الفعالية"),

    // Dates
    date: z.string().min(1, "تاريخ البداية مطلوب"),
    end_date: z.string().optional(),

    // Location
    location_name: z.string().optional(),
    location_lat: z.number().nullable().refine(val => val !== null, "يرجى تحديد الموقع على الخريطة"),
    location_long: z.number().nullable().refine(val => val !== null, "يرجى تحديد الموقع على الخريطة"),
    district: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),

    // Capacity & Tickets
    capacity: z.coerce.number().min(1, "السعة يجب أن تكون شخص واحد على الأقل"),
    tickets: z.array(z.object({
        id: z.string().optional(), // Add optional ID for updates
        name: z.string().min(2, "اسم التذكرة مطلوب"),
        price: z.coerce.number().min(0, "السعر لا يمكن أن يكون سالباً"),
        quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل")
    })).min(1, "يجب إضافة نوع تذكرة واحد على الأقل"),

    // Recurrence
    is_recurring: z.boolean().optional(),
    recurrence_type: z.string().nullable().optional(),
    recurrence_days: z.any().optional(),
    recurrence_end_date: z.string().nullable().optional(),
})
    .refine(data => {
        if (data.is_recurring && !data.recurrence_type) return false;
        return true;
    }, {
        message: "يرجى اختيار نوع التكرار",
        path: ["recurrence_type"]
    })
    .refine(data => {
        if (data.end_date && new Date(data.end_date) <= new Date(data.date)) return false;
        return true;
    }, {
        message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
        path: ["end_date"]
    })
    .refine(data => {
        const totalTickets = data.tickets.reduce((acc, t) => acc + t.quantity, 0);
        return totalTickets <= data.capacity;
    }, {
        message: "مجموع التذاكر يتجاوز السعة القصوى للفعالية",
        path: ["capacity"]
    });

interface Props {
    event?: any;
    vendorData?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EventForm({ event, vendorData, onClose, onSuccess }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoryFetchError, setCategoryFetchError] = useState<string | null>(null);

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(event?.image_url || null);

    // Bulk Discounts State
    const [bulkDiscounts, setBulkDiscounts] = useState<any[]>(event?.bulk_discounts || []);

    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesLoading(true);
            setCategoryFetchError(null);
            try {
                const supabase = createClient();
                const { data, error } = await supabase.from('categories').select('*');
                if (error) {
                    console.error('Failed to load categories:', error);
                    setCategoryFetchError(error.message);
                } else if (data) {
                    setCategories(data);
                }
            } catch (err: any) {
                setCategoryFetchError(err.message);
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: event ? {
            ...event,
            event_type: event.category_id || event.event_type, // Use category_id if available, fallback to event_type
            date: formatDateForInput(event.date),
            end_date: formatDateForInput(event.end_date),
            is_recurring: event.is_recurring,
            recurrence_days: event.recurrence_days || [],
            tickets: (event.tickets && event.tickets.length > 0) ? event.tickets : [{ name: 'تذكرة عامة', price: 0, quantity: 100 }]
        } : {
            is_recurring: false,
            recurrence_days: [],
            location_name: '',
            district: '',
            city: '',
            country: '',
            location_lat: null as any,
            location_long: null as any,
            capacity: 0,
            date: '',
            event_type: '',
            tickets: [{ name: 'تذكرة عامة', price: 0, quantity: 100 }]
        }
    });

    const isRecurring = watch('is_recurring');
    const recurrenceType = watch('recurrence_type');
    const recurrenceDays = watch('recurrence_days') || [];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);

            // Clean up old blob URL
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }

            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, []);

    const toggleDay = (day: string) => {
        const current = recurrenceDays;
        const updated = current.includes(day) ? current.filter((d: string) => d !== day) : [...current, day];
        setValue('recurrence_days', updated);
    };

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'tickets' || key === 'recurrence_days') formData.append(key, JSON.stringify(value));
                else formData.append(key, value as string);
            }
        });

        formData.append('bulk_discounts', JSON.stringify(bulkDiscounts));

        if (imageFile) {
            formData.append('image', imageFile);
        }

        let res;
        if (event && event.id) {
            res = await updateEvent(event.id, formData);
        } else {
            res = await createEvent(formData);
        }

        setSubmitting(false);
        if (res.error) alert(res.error);
        else onSuccess();
    };

    const DAYS = [
        { id: 'sun', label: 'الأحد' }, { id: 'mon', label: 'الاثنين' }, { id: 'tue', label: 'الثلاثاء' },
        { id: 'wed', label: 'الأربعاء' }, { id: 'thu', label: 'الخميس' }, { id: 'fri', label: 'الجمعة' }, { id: 'sat', label: 'السبت' }
    ];

    const content = (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }}
                exit={{ y: "100%", opacity: 0 }}
                className="bg-white rounded-t-[2rem] sm:rounded-3xl w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative"
                dir="rtl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-xl z-20">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight">{event ? 'تعديل الفعالية' : 'فعالية جديدة'}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">أدخل تفاصيل الفعالية بدقة</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-50 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit, (errors) => {
                    console.error("Form Validation Errors:", errors);
                    alert("يوجد حقول غير مكتملة أو غير صحيحة: " + Object.keys(errors).join(", "));
                })} className="p-5 sm:p-6 space-y-8 pb-24 sm:pb-6">

                    {/* Image Upload Component */}
                    <ImageUploader previewUrl={previewUrl} onImageChange={handleImageChange} />

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700">عنوان الفعالية</label>
                                <input {...register('title')} className={`input-field ${errors.title ? 'border-red-500' : ''}`} placeholder="مثال: ورشة الرسم الحر" />
                                {errors.title && <p className="text-red-500 text-xs font-bold mt-1">{errors.title.message as string}</p>}
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700">نوع الفعالية</label>
                                <div className="relative">
                                    <select {...register('event_type')} className={`input-field appearance-none ${errors.event_type ? 'border-red-500' : ''}`} disabled={categoriesLoading}>
                                        <option value="">{categoriesLoading ? 'جاري التحميل...' : (categoryFetchError ? 'خطأ في تحميل التصنيفات' : 'اختر النوع')}</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.slug}>
                                                {cat.name_ar || cat.name_en}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                {errors.event_type && <p className="text-red-500 text-xs font-bold mt-1">{errors.event_type.message as string}</p>}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700">الوصف والتفاصيل</label>
                            <textarea {...register('description')} className="input-field min-h-[120px] leading-relaxed" placeholder="اكتب وصفاً جذاباً للفعالية..." />
                            {errors.description && <p className="text-red-500 text-xs font-bold mt-1">{errors.description.message as string}</p>}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Calendar className="w-5 h-5" /></div>
                            <h4 className="font-bold text-gray-900">التوقيت والمدة</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-600">يبدأ في</label>
                                <input {...register('date')} type="datetime-local" className={`input-field bg-white ${errors.date ? 'border-red-500' : ''}`} />
                                {errors.date && <p className="text-red-500 text-xs font-bold mt-1">{errors.date.message as string}</p>}
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-600">ينتهي في <span className="text-xs font-normal text-gray-400">(اختياري)</span></label>
                                <input {...register('end_date')} type="datetime-local" className={`input-field bg-white ${errors.end_date ? 'border-red-500' : ''}`} />
                                {errors.end_date && <p className="text-red-500 text-xs font-bold mt-1">{errors.end_date.message as string}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all has-[:checked]:bg-primary/5 has-[:checked]:border-primary/20">
                            <input type="checkbox" {...register('is_recurring')} className="w-6 h-6 rounded-lg text-primary border-2 border-gray-300 focus:ring-offset-0 focus:ring-0 checked:bg-primary checked:border-primary transition-all" />
                            <div className="flex-1">
                                <span className="font-bold text-gray-900 block">تكرار الفعالية</span>
                                <span className="text-xs text-gray-500 font-medium">قم بتفعيل هذا الخيار للفعاليات الدورية</span>
                            </div>
                        </label>

                        <AnimatePresence>
                            {isRecurring && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="bg-primary/5 p-5 rounded-3xl space-y-5 border border-primary/10">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-primary">نوع التكرار</label>
                                                <select {...register('recurrence_type')} className="input-field bg-white border-primary/20 text-primary font-bold">
                                                    <option value="daily">يومياً</option>
                                                    <option value="weekly">أسبوعياً</option>
                                                    <option value="custom">أيام مخصصة</option>
                                                </select>
                                                {errors.recurrence_type && <p className="text-red-500 text-xs font-bold mt-1">{errors.recurrence_type.message as string}</p>}
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-primary">تاريخ انتهاء التكرار</label>
                                                <input {...register('recurrence_end_date')} type="date" className="input-field bg-white border-primary/20 text-primary font-bold" />
                                            </div>
                                        </div>

                                        {(recurrenceType === 'weekly' || recurrenceType === 'custom') && (
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-primary">حدد الأيام</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {DAYS.map(day => (
                                                        <button key={day.id} type="button" onClick={() => toggleDay(day.id)} className={`h-10 px-4 rounded-xl text-sm font-bold transition-all border-2 ${recurrenceDays.includes(day.id) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white text-gray-500 border-transparent hover:bg-white/80'}`}>{day.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Google Map Component */}
                    <div className="space-y-2">
                        <EventMap setValue={setValue} watch={watch} vendorData={vendorData} event={event} />
                        {(errors.location_lat || errors.location_long) && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 animate-in fade-in slide-in-from-top-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-sm font-bold">يرجى تحديد مكان الفعالية على الخريطة بدقة</span>
                            </div>
                        )}
                    </div>

                    {/* Hidden inputs for location fields used by schema validation */}
                    <input type="hidden" {...register('location_lat')} />
                    <input type="hidden" {...register('location_long')} />
                    <input type="hidden" {...register('location_name')} />
                    <input type="hidden" {...register('district')} />
                    <input type="hidden" {...register('city')} />
                    <input type="hidden" {...register('country')} />

                    {/* Ticket Management Component */}
                    <TicketManager control={control} register={register} errors={errors} />

                    {/* Bulk Discount Management Component */}
                    <BulkDiscountManager discounts={bulkDiscounts} setDiscounts={setBulkDiscounts} />

                    <div className="flex gap-4 pt-4 border-t border-gray-100 sticky bottom-0 bg-white/80 backdrop-blur-lg p-4 -mx-6 -mb-6 mt-4 z-20">
                        <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">إلغاء</button>
                        <button type="submit" disabled={submitting} className="flex-[2] py-4 font-bold text-white bg-primary rounded-2xl hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2">
                            {submitting ? <Loader2 className="animate-spin" /> : (event ? 'حفظ التغييرات' : 'نشر الفعالية')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
}
