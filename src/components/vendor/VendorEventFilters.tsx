'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, ChevronDown, SlidersHorizontal, X, Navigation2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { createClient } from '@/utils/supabase/client';

interface Category {
    id: string;
    slug: string;
    name_en: string;
    name_ar?: string | null;
    icon?: string | null;
}

export default function VendorEventFilters({ compact = false, vendorId }: { compact?: boolean; vendorId?: string } = {}) {
    const t = useTranslations('Index');
    const tVendor = useTranslations('VendorProfile');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read filter values from URL
    const searchQuery = searchParams.get('search') || '';
    const selectedCategory = searchParams.get('category') || '';
    const selectedDistrict = searchParams.get('district') || '';
    const hasUserLocation = !!(searchParams.get('lat') && searchParams.get('lng'));

    // Local state only for data fetching and UI
    const [categories, setCategories] = useState<Category[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // Sync local search input with URL param
    useEffect(() => {
        setLocalSearch(searchParams.get('search') || '');
    }, [searchParams]);

    // Fetch categories and districts
    useEffect(() => {
        const fetchFilters = async () => {
            const supabase = createClient();

            // Fetch categories
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .order('name_en', { ascending: true });

            if (categoriesData) setCategories(categoriesData);

            // Fetch unique districts from events (scoped to vendor if vendorId provided)
            let districtQuery = supabase
                .from('events')
                .select('district')
                .not('district', 'is', null)
                .eq('status', 'published');

            if (vendorId) {
                districtQuery = districtQuery.eq('vendor_id', vendorId);
            }

            const { data: districtsData } = await districtQuery;

            if (districtsData) {
                const uniqueDistricts = Array.from(
                    new Set(districtsData.map(d => d.district).filter(Boolean))
                ) as string[];
                uniqueDistricts.sort();
                setDistricts(uniqueDistricts);
            }
        };

        fetchFilters();
    }, []);

    // Helper to update URL params
    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === '') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }
        const queryString = params.toString();
        router.push(queryString ? `?${queryString}` : '?', { scroll: false });
    };

    // Debounced search update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchQuery) {
                updateParams({ search: localSearch || null });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch]);

    const handleCategoryClick = (slug: string) => {
        updateParams({ category: selectedCategory === slug ? null : slug });
    };

    const handleDistrictChange = (district: string) => {
        updateParams({
            district: district || null,
            // Clear geolocation when selecting a district
            ...(district ? { lat: null, lng: null } : {}),
        });
    };

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            alert(locale === 'ar' ? 'الموقع غير مدعوم' : 'Geolocation is not supported by your browser');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                updateParams({
                    lat: latitude.toString(),
                    lng: longitude.toString(),
                    // Clear district when using geolocation
                    district: null,
                });
                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                alert(locale === 'ar' ? 'تعذر الحصول على موقعك' : 'Could not get your location. Please check your permissions.');
                setIsLocating(false);
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    };

    const clearAllFilters = () => {
        setLocalSearch('');
        router.push('?', { scroll: false });
    };

    const hasActiveFilters = searchQuery || selectedCategory || selectedDistrict || hasUserLocation;

    return (
        <div className={compact ? 'space-y-3' : 'space-y-4 md:space-y-6'}>
            {/* Search Bar */}
            <div className="relative">
                <div className={`absolute ${compact ? 'left-3' : 'left-4 md:left-6'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                    <Search className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                </div>
                <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={locale === 'ar' ? 'ابحث في الفعاليات...' : 'Search events...'}
                    className={`w-full ${compact ? 'pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm' : 'pl-12 md:pl-14 pr-4 py-4 md:py-5 bg-white rounded-2xl md:rounded-3xl border-2 border-gray-100 text-sm md:text-base shadow-lg shadow-gray-100'} font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all`}
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
                {localSearch && (
                    <button
                        onClick={() => {
                            setLocalSearch('');
                            updateParams({ search: null });
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Categories - Horizontal Scroll */}
            <div className="relative">
                <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3 md:gap-4'} overflow-x-auto pb-2 no-scrollbar flex-nowrap`}>
                    {categories.map((cat) => {
                        const isActive = selectedCategory === cat.slug;
                        const name = locale === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en;

                        return compact ? (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap border",
                                    isActive
                                        ? "bg-primary text-white border-primary shadow-sm"
                                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                                )}
                            >
                                <span className="text-sm">{cat.icon}</span>
                                <span>{name}</span>
                            </button>
                        ) : (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={cn(
                                    "flex flex-col items-center gap-2 min-w-[70px] md:min-w-[80px] p-3 md:p-4 rounded-2xl transition-all shrink-0",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                                )}
                            >
                                <span className={cn(
                                    "text-2xl md:text-3xl transition-all",
                                    isActive ? "filter-none scale-110" : "grayscale opacity-80"
                                )}>
                                    {cat.icon}
                                </span>
                                <span className="text-[9px] md:text-[10px] font-bold text-center leading-tight whitespace-nowrap">
                                    {name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Additional Filters Row */}
            <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar flex-nowrap">
                {/* District Filter */}
                <div className="relative flex-1 min-w-[150px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedDistrict}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full pl-10 pr-8 py-3 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-900 outline-none transition-all cursor-pointer appearance-none hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
                        disabled={hasUserLocation}
                    >
                        <option value="">{locale === 'ar' ? 'كل المناطق' : 'All Districts'}</option>
                        {districts.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>

                {/* Near Me Button — hidden in compact mode */}
                {!compact && (
                    <button
                        onClick={handleNearMe}
                        disabled={isLocating}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border whitespace-nowrap",
                            hasUserLocation
                                ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                        )}
                    >
                        <Navigation2 className={cn("w-4 h-4", isLocating && "animate-spin")} />
                        <span className="hidden md:inline">{hasUserLocation ? t('search.near_me') : t('search.search_nearby')}</span>
                        <span className="md:hidden">📍</span>
                    </button>
                )}

                {/* Mobile Filters Toggle — hidden in compact mode */}
                {!compact && (
                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="md:hidden flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>{t('filters')}</span>
                    </button>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                        <X className="w-4 h-4" />
                        <span className="hidden md:inline">{t('clearAllFilters')}</span>
                        <span className="md:hidden">{locale === 'ar' ? 'مسح' : 'Clear'}</span>
                    </button>
                )}
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-bold">{locale === 'ar' ? 'الفلاتر النشطة:' : 'Active filters:'}</span>
                    {searchQuery && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                            {searchQuery}
                        </span>
                    )}
                    {selectedCategory && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                            {categories.find(c => c.slug === selectedCategory)?.[locale === 'ar' ? 'name_ar' : 'name_en'] || selectedCategory}
                        </span>
                    )}
                    {selectedDistrict && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                            {selectedDistrict}
                        </span>
                    )}
                    {hasUserLocation && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-1">
                            <Navigation2 className="w-3 h-3" />
                            {locale === 'ar' ? 'بالقرب مني' : 'Near Me'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
