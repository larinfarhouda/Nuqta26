'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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

interface VendorEventFiltersProps {
    onFilterChange: (filters: {
        search: string;
        category: string;
        district: string;
        userLat?: number;
        userLng?: number;
    }) => void;
}

export default function VendorEventFilters({ onFilterChange }: VendorEventFiltersProps) {
    const t = useTranslations('Index');
    const tVendor = useTranslations('VendorProfile');
    const locale = useLocale();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Location state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

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

            // Fetch unique districts from events
            const { data: districtsData } = await supabase
                .from('events')
                .select('district')
                .not('district', 'is', null)
                .eq('status', 'published');

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

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange({
            search: searchQuery,
            category: selectedCategory,
            district: selectedDistrict,
            userLat: userLocation?.lat,
            userLng: userLocation?.lng,
        });
    }, [searchQuery, selectedCategory, selectedDistrict, userLocation, onFilterChange]);

    const handleCategoryClick = (slug: string) => {
        setSelectedCategory(selectedCategory === slug ? '' : slug);
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
                setUserLocation({ lat: latitude, lng: longitude });
                // Clear district when using geolocation
                setSelectedDistrict('');
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
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedDistrict('');
        setUserLocation(null);
    };

    const hasActiveFilters = searchQuery || selectedCategory || selectedDistrict || userLocation;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={locale === 'ar' ? 'عن ماذا تبحث اليوم؟' : 'What are you looking for today?'}
                    className="w-full pl-12 md:pl-14 pr-4 py-4 md:py-5 bg-white rounded-2xl md:rounded-3xl border-2 border-gray-100 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-lg shadow-gray-100"
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Categories - Horizontal Scroll */}
            <div className="relative">
                <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((cat) => {
                        const isActive = selectedCategory === cat.slug;
                        const name = locale === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={cn(
                                    "flex flex-col items-center gap-2 min-w-[70px] md:min-w-[80px] p-3 md:p-4 rounded-2xl transition-all",
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
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {/* District Filter */}
                <div className="relative flex-1 min-w-[150px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <select
                        value={selectedDistrict}
                        onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            // Clear location when selecting district
                            if (e.target.value) setUserLocation(null);
                        }}
                        className="w-full pl-10 pr-8 py-3 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-900 outline-none transition-all cursor-pointer appearance-none hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
                        disabled={!!userLocation}
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

                {/* Near Me Button */}
                <button
                    onClick={handleNearMe}
                    disabled={isLocating}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border whitespace-nowrap",
                        userLocation
                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                    )}
                >
                    <Navigation2 className={cn("w-4 h-4", isLocating && "animate-spin")} />
                    <span className="hidden md:inline">{userLocation ? t('search.near_me') : t('search.search_nearby')}</span>
                    <span className="md:hidden">📍</span>
                </button>

                {/* Mobile Filters Toggle */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="md:hidden flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>{t('filters')}</span>
                </button>

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
                    {userLocation && (
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
