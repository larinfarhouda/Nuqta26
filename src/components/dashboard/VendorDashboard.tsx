'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
    Loader2, BarChart3, Star,
    Image as ImageIcon, Calendar, Users, Settings, ExternalLink, Sparkles, Globe,
    MoreHorizontal, Tag
} from 'lucide-react';
import NextImage from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { getPendingBookingsCount } from '@/actions/vendor/bookings';
import CompactTierBadge from './vendor/CompactTierBadge';
import { getCountryFlag } from '@/utils/country-helpers';
import MoreSheet from './vendor/MoreSheet';

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

const ReviewsTab = dynamic(() => import('./vendor/reviews/ReviewsTab'), {
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

// All tabs config
const ALL_TABS = [
    { id: 'ANALYTICS', icon: BarChart3 },
    { id: 'EVENTS', icon: Calendar },
    { id: 'BOOKINGS', icon: Sparkles },
    { id: 'CUSTOMERS', icon: Users },
    { id: 'GALLERY', icon: ImageIcon },
    { id: 'REVIEWS', icon: Star },
    { id: 'DISCOUNTS', icon: Tag },
    { id: 'PROFILE', icon: Settings },
] as const;

// Primary tabs for mobile bottom nav (first 4 + "more")
const PRIMARY_TAB_IDS = ['ANALYTICS', 'EVENTS', 'BOOKINGS', 'CUSTOMERS'];
const SECONDARY_TAB_IDS = ['GALLERY', 'REVIEWS', 'DISCOUNTS', 'PROFILE'];

interface VendorDashboardProps {
    initialVendorData?: any;
    initialPendingBookingsCount?: number;
    initialActiveEventsCount?: number;
    demoMode?: boolean;
}

export default function VendorDashboard({
    initialVendorData,
    initialPendingBookingsCount = 0,
    initialActiveEventsCount = 0,
    demoMode = false
}: VendorDashboardProps = {}) {
    const supabase = createClient();
    const t = useTranslations('Dashboard');
    const locale = useLocale();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Core State
    const [step, setStep] = useState<'LOADING' | 'DETAILS' | 'VERIFICATION' | 'DASHBOARD'>(
        initialVendorData ? 'DASHBOARD' : 'LOADING'
    );
    const [vendorData, setVendorData] = useState<any>(() => {
        if (initialVendorData) {
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
    const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'EVENTS' | 'CUSTOMERS' | 'BOOKINGS' | 'PROFILE' | 'GALLERY' | 'DISCOUNTS' | 'REVIEWS'>('ANALYTICS');
    const [pendingBookingsCount, setPendingBookingsCount] = useState(initialPendingBookingsCount);
    const [activeEventsCount, setActiveEventsCount] = useState(initialActiveEventsCount);
    const [moreSheetOpen, setMoreSheetOpen] = useState(false);

    // Alert State
    const [alertState, setAlertState] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });
    const [countries, setCountries] = useState<any[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('tr');

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
        setAlertState({ show: true, message, type });
        if (type === 'success') setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 3000);
    };

    // Update URL when tab changes
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as any);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabId.toLowerCase());
        window.history.replaceState(null, '', url.pathname + url.search);
    };

    // Sync tab with URL parameter on mount
    useEffect(() => {
        const tab = searchParams.get('tab')?.toUpperCase();
        const validTabs = ['ANALYTICS', 'EVENTS', 'CUSTOMERS', 'BOOKINGS', 'PROFILE', 'GALLERY', 'DISCOUNTS', 'REVIEWS'];
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

    // Load countries for onboarding
    useEffect(() => {
        supabase.from('countries').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
            setCountries(data || []);
        });
    }, []);

    const checkVendorStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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

            if (!vendorData.country) {
                setStep('DETAILS');
            } else {
                setStep('DASHBOARD');
            }
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
            country: selectedCountry,
            status: 'approved',
            is_verified: true,
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

    const isSecondaryTab = SECONDARY_TAB_IDS.includes(activeTab);

    // Tab label helper
    const tabLabel = (id: string) => {
        const map: Record<string, string> = {
            ANALYTICS: t('vendor.tabs.analytics'),
            EVENTS: t('vendor.tabs.events'),
            BOOKINGS: t('vendor.tabs.bookings'),
            CUSTOMERS: t('vendor.tabs.customers'),
            GALLERY: t('vendor.tabs.gallery'),
            REVIEWS: t('vendor.tabs.reviews'),
            DISCOUNTS: t('vendor.tabs.discounts'),
            PROFILE: t('vendor.tabs.settings'),
        };
        return map[id] || id;
    };

    return (
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#f8fafc' }}>

            {/* Demo Mode Banner */}
            {demoMode && (
                <div style={{
                    margin: '0 16px 16px', padding: '14px 16px',
                    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                    border: '1.5px solid #fbbf24', borderRadius: '14px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={20} color="#d97706" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>وضع التجربة — Demo Mode</div>
                            <div style={{ fontSize: '12px', color: '#a16207', marginTop: '2px' }}>أنت تتصفح بيانات تجريبية</div>
                        </div>
                        <a href="/register?role=vendor" style={{
                            padding: '8px 16px', background: '#2CA58D', color: '#fff',
                            borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                            textDecoration: 'none', whiteSpace: 'nowrap',
                        }}>سجل الآن</a>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', minHeight: '100vh' }}>

                {/* ═══════════ DESKTOP SIDEBAR ═══════════ */}
                <aside className="hidden md:flex" style={{
                    position: 'sticky', top: '64px', alignSelf: 'flex-start',
                    width: '240px', minWidth: '240px',
                    flexDirection: 'column',
                    height: 'calc(100vh - 64px)',
                    borderRight: locale === 'ar' ? 'none' : '1px solid #e2e8f0',
                    borderLeft: locale === 'ar' ? '1px solid #e2e8f0' : 'none',
                    background: '#fff',
                    padding: '24px 0',
                    overflowY: 'auto',
                }}>
                    {/* Vendor Identity */}
                    {step === 'DASHBOARD' && vendorData && (
                        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: '#f1f5f9', overflow: 'hidden', flexShrink: 0,
                                    position: 'relative',
                                }}>
                                    <ImageWithFallback
                                        src={vendorData?.company_logo}
                                        alt="Logo"
                                        className="w-full h-full"
                                        fallback={
                                            <div style={{
                                                width: '100%', height: '100%', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                background: '#e0f2f1', color: '#2CA58D',
                                                fontWeight: 800, fontSize: '18px',
                                            }}>
                                                {vendorData?.business_name?.[0]}
                                            </div>
                                        }
                                    />
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{
                                        fontSize: '14px', fontWeight: 700, color: '#0f172a',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {vendorData?.business_name}
                                    </div>
                                    <CompactTierBadge vendorId={vendorData?.id} demoMode={demoMode} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nav Items */}
                    {step === 'DASHBOARD' && (
                        <nav style={{ padding: '12px 12px', flex: 1 }}>
                            {ALL_TABS.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            width: '100%', padding: '10px 14px', marginBottom: '2px',
                                            borderRadius: '10px', border: 'none', cursor: 'pointer',
                                            fontSize: '13.5px', fontWeight: isActive ? 700 : 500,
                                            color: isActive ? '#2CA58D' : '#475569',
                                            background: isActive ? '#e0f7f3' : 'transparent',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <Icon size={18} />
                                        {tabLabel(tab.id)}
                                        {tab.id === 'BOOKINGS' && pendingBookingsCount > 0 && (
                                            <span style={{
                                                marginLeft: 'auto', padding: '1px 7px',
                                                background: '#ef4444', color: '#fff',
                                                fontSize: '11px', fontWeight: 700,
                                                borderRadius: '10px',
                                            }}>
                                                {pendingBookingsCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    )}

                    {/* View Profile Link */}
                    {step === 'DASHBOARD' && vendorData?.slug && (
                        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                            <a
                                href={`/${locale}/v/${vendorData.slug}`}
                                target="_blank"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    fontSize: '13px', fontWeight: 600, color: '#64748b',
                                    textDecoration: 'none', padding: '8px 8px',
                                    borderRadius: '8px',
                                }}
                            >
                                <ExternalLink size={15} />
                                {t('vendor.profile.view_live_profile')}
                            </a>
                        </div>
                    )}
                </aside>

                {/* ═══════════ MAIN CONTENT ═══════════ */}
                <main style={{ flex: 1, minWidth: 0 }}>

                    {/* Mobile Header — visible only on mobile when on dashboard */}
                    {step === 'DASHBOARD' && vendorData && (
                        <div className="md:hidden" style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '16px 20px 12px',
                            background: '#fff',
                            borderBottom: '1px solid #f1f5f9',
                            position: 'sticky', top: '0', zIndex: 30,
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: '#f1f5f9', overflow: 'hidden', flexShrink: 0,
                                position: 'relative',
                            }}>
                                <ImageWithFallback
                                    src={vendorData?.company_logo}
                                    alt="Logo"
                                    className="w-full h-full"
                                    fallback={
                                        <div style={{
                                            width: '100%', height: '100%', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            background: '#e0f2f1', color: '#2CA58D',
                                            fontWeight: 800, fontSize: '15px',
                                        }}>
                                            {vendorData?.business_name?.[0]}
                                        </div>
                                    }
                                />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{
                                    fontSize: '15px', fontWeight: 700, color: '#0f172a',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {vendorData?.business_name}
                                </div>
                            </div>
                            <CompactTierBadge vendorId={vendorData?.id} demoMode={demoMode} />
                        </div>
                    )}

                    {/* Desktop Header — visible only on desktop */}
                    {step === 'DASHBOARD' && vendorData && (
                        <div className="hidden md:flex" style={{
                            alignItems: 'center', justifyContent: 'space-between',
                            padding: '24px 32px 20px', gap: '16px',
                            borderBottom: '1px solid #f1f5f9',
                            background: '#fff',
                        }}>
                            <div>
                                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    {tabLabel(activeTab)}
                                </h1>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {vendorData?.slug ? (
                                    <a
                                        href={`/${locale || 'ar'}/v/${vendorData.slug}`}
                                        target="_blank"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 14px', borderRadius: '10px',
                                            border: '1px solid #e2e8f0', background: '#fff',
                                            color: '#475569', fontSize: '13px', fontWeight: 600,
                                            textDecoration: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        <ExternalLink size={14} />
                                        {t('vendor.profile.view_live_profile')}
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => handleTabChange('PROFILE')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 14px', borderRadius: '10px',
                                            border: '1px solid #d1fae5', background: '#ecfdf5',
                                            color: '#059669', fontSize: '13px', fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Sparkles size={14} />
                                        {t('vendor.profile.create_live_profile')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <div style={{
                        padding: step === 'DASHBOARD'
                            ? '20px 16px 100px'  // mobile bottom padding for nav
                            : '32px 16px',
                        maxWidth: step === 'DETAILS' ? '480px' : undefined,
                        margin: step === 'DETAILS' ? '0 auto' : undefined,
                    }}
                        className={step === 'DASHBOARD' ? 'md:!pb-8 md:!px-8' : ''}
                    >
                        {step === 'DETAILS' && (
                            <form onSubmit={handleInitialSubmit} style={{ padding: '32px 0' }}>
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                                        {t('vendor.welcome')}
                                    </h2>
                                    <p style={{ color: '#64748b', fontSize: '14px' }}>{t('vendor.setup_title')}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            {t('vendor.business_name')}
                                        </label>
                                        <input name="business_name" required className="input-field text-gray-900" placeholder={t('vendor.business_name_placeholder')} defaultValue={vendorData?.business_name || ''} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            {t('vendor.category')}
                                        </label>
                                        <select name="category" className="input-field text-gray-900" defaultValue={vendorData?.category || 'other'}>
                                            <option value="cultural">{t('vendor.cat_cultural')}</option>
                                            <option value="entertainment">{t('vendor.cat_entertainment')}</option>
                                            <option value="educational">{t('vendor.cat_educational')}</option>
                                            <option value="artistic">{t('vendor.cat_artistic')}</option>
                                            <option value="social">{t('vendor.cat_social')}</option>
                                            <option value="other">{t('vendor.cat_other')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', alignItems: 'center', gap: '6px' }}>
                                            <Globe style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                                            {t('vendor.select_country')}
                                        </label>
                                        <select
                                            value={selectedCountry}
                                            onChange={e => setSelectedCountry(e.target.value)}
                                            className="input-field text-gray-900"
                                        >
                                            {countries.map(c => (
                                                <option key={c.id} value={c.id}>{getCountryFlag(c.id)} {locale === 'ar' ? c.name_ar : c.name_en}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            {t('vendor.description')}
                                        </label>
                                        <textarea name="description_ar" className="input-field min-h-[100px] text-gray-900" placeholder={t('vendor.description_placeholder')} />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-full py-4 text-lg" style={{ marginTop: '24px' }}>
                                    {t('vendor.start_now')}
                                </button>
                            </form>
                        )}

                        {step === 'DASHBOARD' && (
                            <>
                                {activeTab === 'ANALYTICS' && <AnalyticsTab vendorId={vendorData?.id} activeEventsCount={activeEventsCount} demoMode={demoMode} />}
                                {activeTab === 'EVENTS' && <EventsTab vendorData={vendorData} demoMode={demoMode} />}
                                {activeTab === 'BOOKINGS' && <BookingsTab demoMode={demoMode} />}
                                {activeTab === 'CUSTOMERS' && <CustomersTab demoMode={demoMode} />}
                                {activeTab === 'GALLERY' && <GalleryTab vendorId={vendorData?.id} showAlert={showAlert} demoMode={demoMode} />}
                                {activeTab === 'DISCOUNTS' && <DiscountsTab showAlert={showAlert} demoMode={demoMode} vendorCountry={vendorData?.country} />}
                                {activeTab === 'REVIEWS' && <ReviewsTab demoMode={demoMode} />}
                                {activeTab === 'PROFILE' && <ProfileTab vendorData={vendorData} setVendorData={setVendorData} showAlert={showAlert} demoMode={demoMode} />}
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* ═══════════ MOBILE BOTTOM NAV BAR ═══════════ */}
            {step === 'DASHBOARD' && (
                <nav className="md:hidden flex" style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                    background: '#fff',
                    borderTop: '1px solid #e2e8f0',
                    padding: '6px 8px env(safe-area-inset-bottom, 8px)',
                    justifyContent: 'space-around', alignItems: 'center',
                }}>
                    {PRIMARY_TAB_IDS.map((tabId) => {
                        const tab = ALL_TABS.find(t => t.id === tabId)!;
                        const isActive = activeTab === tabId;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tabId}
                                onClick={() => handleTabChange(tabId)}
                                style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: '2px',
                                    padding: '6px 12px', border: 'none',
                                    background: 'none', cursor: 'pointer',
                                    color: isActive ? '#2CA58D' : '#94a3b8',
                                    position: 'relative',
                                    transition: 'color 0.15s ease',
                                }}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                <span style={{
                                    fontSize: '10px', fontWeight: isActive ? 700 : 500,
                                    lineHeight: 1,
                                }}>
                                    {tabLabel(tabId)}
                                </span>
                                {tabId === 'BOOKINGS' && pendingBookingsCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '2px', right: '6px',
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        background: '#ef4444', color: '#fff',
                                        fontSize: '9px', fontWeight: 800,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {pendingBookingsCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* More button */}
                    <button
                        onClick={() => setMoreSheetOpen(true)}
                        style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '2px',
                            padding: '6px 12px', border: 'none',
                            background: 'none', cursor: 'pointer',
                            color: isSecondaryTab ? '#2CA58D' : '#94a3b8',
                            transition: 'color 0.15s ease',
                        }}
                    >
                        <MoreHorizontal size={22} strokeWidth={isSecondaryTab ? 2.5 : 1.8} />
                        <span style={{
                            fontSize: '10px',
                            fontWeight: isSecondaryTab ? 700 : 500,
                            lineHeight: 1,
                        }}>
                            المزيد
                        </span>
                    </button>
                </nav>
            )}

            {/* More Sheet */}
            <MoreSheet
                open={moreSheetOpen}
                onClose={() => setMoreSheetOpen(false)}
                onNavigate={handleTabChange}
                vendorSlug={vendorData?.slug}
            />

            {/* Alert Toast */}
            {alertState.show && (
                <div style={{
                    position: 'fixed', bottom: '90px', left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100, pointerEvents: 'none',
                }}>
                    <div
                        dir="rtl"
                        style={{
                            pointerEvents: 'auto',
                            padding: '12px 24px', borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                            background: alertState.type === 'success' ? '#2CA58D' : '#ef4444',
                            color: '#fff', fontWeight: 700, fontSize: '14px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {alertState.message}
                    </div>
                </div>
            )}
        </div>
    );
}
