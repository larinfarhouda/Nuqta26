'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    Loader2, Upload, LayoutDashboard, Settings,
    Image as ImageIcon, Calendar, Users, BarChart3,
    TrendingUp // Added TrendingUp to imports just in case
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';

// Tabs
import EventsTab from './vendor/events/EventsTab';
import CustomersTab from './vendor/customers/CustomersTab';
import AnalyticsTab from './vendor/analytics/AnalyticsTab';
import ProfileTab from './vendor/ProfileTab';
import GalleryTab from './vendor/GalleryTab';

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
    useEffect(() => { setError(false); }, [src]);
    if (!src || error) return <>{fallback}</>;
    return (
        <div className={`relative ${className} overflow-hidden`}>
            <NextImage
                src={src}
                alt={alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setError(true)}
            />
        </div>
    );
};

export default function VendorDashboard() {
    const supabase = createClient();

    // Core State
    const [step, setStep] = useState<'LOADING' | 'DETAILS' | 'VERIFICATION' | 'DASHBOARD'>('LOADING');
    const [vendorData, setVendorData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'EVENTS' | 'CUSTOMERS' | 'PROFILE' | 'GALLERY'>('ANALYTICS');

    // Alert State
    const [alertState, setAlertState] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
        setAlertState({ show: true, message, type });
        if (type === 'success') setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 3000);
    };

    // Load Vendor Data
    useEffect(() => {
        checkVendorStatus();
    }, []);

    const checkVendorStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase.from('vendors').select('*').eq('id', user.id).single();

        if (data) {
            let inferredDistrict = null;
            if (data.location_lat && data.location_long) {
                const city = CITIES['tr'].find(c =>
                    Math.abs(c.lat - data.location_lat!) < 0.001 &&
                    Math.abs(c.lng - data.location_long!) < 0.001
                );
                if (city) inferredDistrict = city.id;
            }
            setVendorData({ ...data, district: inferredDistrict });
            setStep('DASHBOARD');
        } else {
            setStep('DETAILS');
        }
    };

    // Initial Registration Logic
    const handleInitialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            id: user.id,
            business_name: formData.get('business_name') as string,
            category: formData.get('category') as string,
            description_ar: (formData.get('description_ar') as string) || null,
        };

        const { error } = await supabase.from('vendors').upsert(payload);
        if (!error) {
            setVendorData(payload);
            setStep('DASHBOARD');
        } else {
            showAlert(error.message, 'error');
        }
    };

    if (step === 'LOADING') {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
    }

    return (
        <div className="relative max-w-6xl mx-auto">
            {/* Background Blobs */}
            <div className="fixed -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl mix-blend-multiply pointer-events-none z-0" />
            <div className="fixed top-40 -right-20 w-96 h-96 bg-purple-50 rounded-full blur-3xl mix-blend-multiply pointer-events-none z-0" />

            {/* DASHBOARD NAVIGATION */}
            {step === 'DASHBOARD' && (
                <div className="sticky top-20 z-30 mb-8 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-sm mx-4 lg:mx-0 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 min-w-max">
                        {[
                            { id: 'ANALYTICS', icon: BarChart3, label: 'لوحة القيادة' },
                            { id: 'EVENTS', icon: Calendar, label: 'الفعاليات' },
                            { id: 'CUSTOMERS', icon: Users, label: 'العملاء' },
                            { id: 'GALLERY', icon: ImageIcon, label: 'المعرض' },
                            { id: 'PROFILE', icon: Settings, label: 'الإعدادات' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2.5rem] relative z-10 overflow-hidden min-h-[600px] ${step === 'DASHBOARD' ? 'p-6 lg:p-10' : 'p-8 lg:p-12 mx-4 lg:mx-0'}`}
            >
                {step === 'DETAILS' && (
                    <form onSubmit={handleInitialSubmit} className="space-y-6 max-w-lg mx-auto py-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-gray-900 mb-2">مرحباً بك!</h2>
                            <p className="text-gray-600">لنقم بإعداد حساب نشاطك التجاري في خطوات بسيطة.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">اسم النشاط</label>
                                <input name="business_name" required className="input-field text-gray-900" placeholder="مثال: مسرح الفنون" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">التصنيف</label>
                                <select name="category" className="input-field text-gray-900">
                                    <option value="cultural">ثقافي</option>
                                    <option value="entertainment">ترفيهي</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">وصف مختصر</label>
                                <textarea name="description_ar" className="input-field min-h-[100px] text-gray-900" placeholder="نبذة عن نشاطك..." />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary w-full py-4 text-lg">ابدأ الآن</button>
                    </form>
                )}

                {step === 'DASHBOARD' && (
                    <div dir="rtl">
                        <div className="mb-8 flex items-center gap-4 border-b border-gray-100 pb-6">
                            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-lg overflow-hidden relative">
                                <ImageWithFallback
                                    src={vendorData?.company_logo}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                    fallback={
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                                            {vendorData?.business_name?.[0]}
                                        </div>
                                    }
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">{vendorData?.business_name}</h1>
                                <p className="text-sm text-gray-500 font-medium">لوحة تحكم البائع</p>
                            </div>
                        </div>

                        {activeTab === 'ANALYTICS' && <AnalyticsTab />}
                        {activeTab === 'EVENTS' && <EventsTab vendorData={vendorData} />}
                        {activeTab === 'CUSTOMERS' && <CustomersTab />}
                        {activeTab === 'GALLERY' && <GalleryTab vendorId={vendorData?.id} showAlert={showAlert} />}
                        {activeTab === 'PROFILE' && <ProfileTab vendorData={vendorData} setVendorData={setVendorData} showAlert={showAlert} />}
                    </div>
                )}
            </motion.div>

            {/* CUSTOM ALERT MODAL */}
            <AnimatePresence>
                {alertState.show && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-start p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 ${alertState.type === 'success' ? 'bg-[#2CA58D]/90 text-white' : 'bg-red-500/90 text-white'
                                }`}
                            dir="rtl"
                        >
                            <div className="font-bold">{alertState.message}</div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Styles */}
            <style jsx global>{`
                .input-field {
                    width: 100%;
                    padding: 1rem;
                    background: #f9fafb;
                    color: #111827; /* Force dark text */
                    border: 1px solid #e5e7eb;
                    border-radius: 1rem;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    background: white;
                    border-color: #2CA58D;
                    box-shadow: 0 0 0 4px rgba(44, 165, 141, 0.1);
                }
                .btn-primary {
                    background: #2CA58D;
                    color: white;
                    font-weight: bold;
                    padding: 0.75rem 1.5rem;
                    border-radius: 1rem;
                    transition: all 0.2s;
                }
                .btn-primary:hover {
                    background: #258f7a;
                    box-shadow: 0 10px 25px -5px rgba(44, 165, 141, 0.4);
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
