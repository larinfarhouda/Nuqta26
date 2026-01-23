'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Navigation2, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface LocalFiltersProps {
    districts: string[];
}

export default function LocalFilters({ districts }: LocalFiltersProps) {
    const t = useTranslations('Index');
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentDistrict = searchParams.get('location');
    const [isLocating, setIsLocating] = useState(false);

    const handleDistrictChange = (district: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!district) {
            params.delete('location');
        } else {
            params.set('location', district);
            // Clear geolocation params when selecting a district
            params.delete('lat');
            params.delete('lng');
            params.delete('radius');
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const params = new URLSearchParams(searchParams.toString());

                // Clear district when using geolocation
                params.delete('location');

                params.set('lat', latitude.toString());
                params.set('lng', longitude.toString());
                params.set('radius', '50'); // 50km default
                router.push(`?${params.toString()}`, { scroll: false });
                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                alert('Could not get your location. Please check your permissions.');
                setIsLocating(false);
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    };

    const isNearMeActive = !!searchParams.get('lat');

    return (
        <div className="flex items-center gap-2 lg:gap-6 bg-gray-50/50 p-1 md:p-1.5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md h-fit shrink-0">
            <div className="hidden md:flex items-center gap-2 pl-3 border-r border-gray-200 pr-4">
                <LayoutGrid className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hidden xl:block">{t('search.view_options')}</span>
            </div>

            {/* Neighborhood/District Dropdown */}
            <div className="relative group min-w-[100px] md:min-w-[160px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                    <MapPin className="w-4 h-4" />
                </div>
                <select
                    value={currentDistrict || ''}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    aria-label="Filter by neighborhood"
                    className="w-full pl-9 pr-8 py-3 bg-transparent rounded-xl text-sm font-bold text-gray-900 outline-none transition-colors cursor-pointer appearance-none hover:bg-gray-100"
                >
                    <option value="">{t('search.all_neighborhoods')}</option>
                    {districts.map((d) => (
                        <option key={d} value={d}>
                            {d}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                    <Navigation2 className="w-3 h-3 rotate-180 fill-current" />
                </div>
            </div>

            {/* Near Me / Distance Button */}
            <button
                onClick={handleNearMe}
                disabled={isLocating}
                aria-label={isNearMeActive ? "Disable location search" : "Search events near me"}
                className={cn(
                    "flex items-center gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all border",
                    isNearMeActive
                        ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                )}
            >
                <Navigation2 className={cn("w-4 h-4", isLocating && "animate-spin")} />
                <span className="hidden md:inline whitespace-nowrap">{isNearMeActive ? t('search.near_me') : t('search.search_nearby')}</span>
            </button>
        </div>
    );
}
