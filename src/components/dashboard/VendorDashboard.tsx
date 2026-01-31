'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
    Loader2, BarChart3,
    Image as ImageIcon, Calendar, Users, Settings, ExternalLink, Sparkles
} from 'lucide-react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { getPendingBookingsCount } from '@/actions/vendor/bookings';
import SubscriptionBadge from './vendor/SubscriptionBadge';

// Dynamic imports for tab components  
const EventsTab = dynamic(() => import('./vendor/events/EventsTab'), {
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

const CustomersTab = dynamic(() => import('./vendor/customers/CustomersTab'), {
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

const BookingsTab = dynamic(() => import('./vendor/BookingsTab'), {
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

const AnalyticsTab = dynamic(() => import('./vendor/analytics/AnalyticsTab'), {
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

const ProfileTab = dynamic(() => import('./vendor/ProfileTab'), {
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

const GalleryTab = dynamic(() => import('./vendor/GalleryTab'), {
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

const DiscountsTab = dynamic(() => import('./vendor/discounts/DiscountsTab'), {
    loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
});

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

interface VendorDashboardProps {
    initialVendorData?: any;
    initialPendingBookingsCount?: number;
    initialActiveEventsCount?: number;
}

export default function VendorDashboard({
    initialVendorData,
    initialPendingBookingsCount = 0,
    initialActiveEventsCount = 0
}: VendorDashboardProps = {}) {
    const supabase = createClient();
    const t = useTranslations('Dashboard');
    const searchParams = useSearchParams();
    const router = useRouter();

    // Core State - Use server-provided data for instant rendering
    const [step, setStep] = useState<'LOADING' | 'DETAILS' | 'VERIFICATION' | 'DASHBOARD'>(
        initialVendorData ? 'DASHBOARD' : 'LOADING'
    );
    const [vendorData, setVendorData] = useState<any>(() => {
        if (initialVendorData) {
            // Process district inference immediately
            let inferredDistrict = null;
            if (initialVendorData.location_lat && initialVendorData.location_long) {
                const city = CITIES['tr'].find(c =>
                    Math.abs(c.lat - initialVendorData.location_lat!) < 0.001 &&
                    Math.abs(c.lng - initialVendorData.location_long!) < 0.001
                );
                if (city) inferredDistrict = city.id;
            }
            return { ...initialVendorData, district: inferredDistrict };
        }
        return null;
    });
    const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'EVENTS' | 'CUSTOMERS' | 'BOOKINGS' | 'PROFILE' | 'GALLERY' | 'DISCOUNTS'>('ANALYTICS');
    const [pendingBookingsCount, setPendingBookingsCount] = useState(initialPendingBookingsCount);
    const [activeEventsCount, setActiveEventsCount] = useState(initialActiveEventsCount);

    // Alert State
    const [alertState, setAlertState] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
        setAlertState({ show: true, message, type });
        if (type === 'success') setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 3000);
    };

    // Update URL when tab changes
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as any);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabId.toLowerCase());
        router.push(url.pathname + url.search, { scroll: false });
    };

    // Sync tab with URL parameter on mount (client-side only)
    useEffect(() => {
        const tab = searchParams.get('tab')?.toUpperCase();
        const validTabs = ['ANALYTICS', 'EVENTS', 'CUSTOMERS', 'BOOKINGS', 'PROFILE', 'GALLERY', 'DISCOUNTS'];
        if (tab && validTabs.includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    // Load Vendor Data only if not provided by server
    useEffect(() => {
        if (!initialVendorData) {
            checkVendorStatus();
        }
    }, [initialVendorData]);

    const checkVendorStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Parallel query execution for faster loading
        const now = new Date().toISOString();
        const [
            { data: vendorData },
            pendingCount,
            { count: eventsCount }
        ] = await Promise.all([
            supabase.from('vendors').select('*').eq('id', user.id).single(),
            getPendingBookingsCount(),
            supabase
                .from('events')
                .select('id', { count: 'exact', head: true })
                .eq('vendor_id', user.id)
                .gte('date', now)
        ]);

        if (vendorData) {
            let inferredDistrict = null;
            if (vendorData.location_lat && vendorData.location_long) {
                const city = CITIES['tr'].find(c =>
                    Math.abs(c.lat - vendorData.location_lat!) < 0.001 &&
                    Math.abs(c.lng - vendorData.location_long!) < 0.001
                );
                if (city) inferredDistrict = city.id;
            }
            setVendorData({ ...vendorData, district: inferredDistrict });
            setPendingBookingsCount(pendingCount);
            setActiveEventsCount(eventsCount || 0);

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
                <div className="sticky top-20 z-30 mb-6 md:mb-8 bg-white/80 backdrop-blur-sm md:backdrop-blur-md p-2 rounded-xl md:rounded-2xl border border-white shadow-sm mx-4 lg:mx-0 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1.5 md:gap-2 min-w-max">
                        {[
                            { id: 'ANALYTICS', icon: BarChart3, label: t('vendor.tabs.analytics') },
                            { id: 'EVENTS', icon: Calendar, label: t('vendor.tabs.events') },
                            { id: 'BOOKINGS', icon: Sparkles, label: t('vendor.tabs.bookings') },
                            { id: 'CUSTOMERS', icon: Users, label: t('vendor.tabs.customers') },
                            { id: 'GALLERY', icon: ImageIcon, label: t('vendor.tabs.gallery') },
                            { id: 'DISCOUNTS', icon: Settings, label: t('vendor.tabs.discounts') }, // Using settings icon for now or Lucide has Tag/Ticket
                            { id: 'PROFILE', icon: Settings, label: t('vendor.tabs.settings') },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-md md:shadow-lg shadow-primary/20'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                                {tab.id === 'BOOKINGS' && pendingBookingsCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                                        {pendingBookingsCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className={`bg-white/60 backdrop-blur-md md:backdrop-blur-xl border border-white/60 shadow-lg md:shadow-xl rounded-3xl md:rounded-[2.5rem] relative z-10 overflow-hidden min-h-[600px] transition-opacity duration-700 ${step === 'DASHBOARD' ? 'p-4 md:p-6 lg:p-10' : 'p-6 md:p-8 lg:p-12 mx-4 lg:mx-0'}`}>
                {step === 'DETAILS' && (
                    <form onSubmit={handleInitialSubmit} className="space-y-6 max-w-lg mx-auto py-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-gray-900 mb-2">{t('vendor.welcome')}</h2>
                            <p className="text-gray-600">{t('vendor.setup_title')}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('vendor.business_name')}</label>
                                <input name="business_name" required className="input-field text-gray-900" placeholder={t('vendor.business_name_placeholder')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('vendor.category')}</label>
                                <select name="category" className="input-field text-gray-900">
                                    <option value="cultural">{t('vendor.category_cultural')}</option>
                                    <option value="entertainment">{t('vendor.category_entertainment')}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('vendor.description')}</label>
                                <textarea name="description_ar" className="input-field min-h-[100px] text-gray-900" placeholder={t('vendor.description_placeholder')} />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary w-full py-4 text-lg">{t('vendor.start_now')}</button>
                    </form>
                )}

                {step === 'DASHBOARD' && (
                    <div dir="rtl">
                        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
                            <div className="flex items-center gap-4">
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
                                    <p className="text-sm text-gray-500 font-medium">{t('vendor.title')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {vendorData?.slug ? (
                                    <a
                                        href={`/v/${vendorData.slug}`}
                                        target="_blank"
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>{t('vendor.profile.view_live_profile')}</span>
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => handleTabChange('PROFILE')}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/20 hover:-translate-y-0.5 transition-all"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>{t('vendor.profile.create_live_profile')}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleTabChange('PROFILE')}
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 transition-all"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>{t('vendor.tabs.settings')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Subscription Tier Badge */}
                        <div className="mb-8">
                            <SubscriptionBadge
                                vendorId={vendorData?.id}
                                activeEventsCount={activeEventsCount}
                            />
                        </div>

                        {activeTab === 'ANALYTICS' && <AnalyticsTab />}
                        {activeTab === 'EVENTS' && <EventsTab vendorData={vendorData} />}
                        {activeTab === 'BOOKINGS' && <BookingsTab />}
                        {activeTab === 'CUSTOMERS' && <CustomersTab />}
                        {activeTab === 'GALLERY' && <GalleryTab vendorId={vendorData?.id} showAlert={showAlert} />}
                        {activeTab === 'DISCOUNTS' && <DiscountsTab showAlert={showAlert} />}
                        {activeTab === 'PROFILE' && <ProfileTab vendorData={vendorData} setVendorData={setVendorData} showAlert={showAlert} />}
                    </div>
                )}
            </div>

            {/* CUSTOM ALERT MODAL */}
            {alertState.show && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-start p-6 pointer-events-none">
                    <div
                        className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl md:shadow-2xl backdrop-blur-md md:backdrop-blur-xl border border-white/20 transition-all duration-300 ${alertState.type === 'success' ? 'bg-[#2CA58D]/90 text-white' : 'bg-red-500/90 text-white'} animate-slide-up`}
                        dir="rtl"
                    >
                        <div className="font-bold">{alertState.message}</div>
                    </div>
                </div>
            )}

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
