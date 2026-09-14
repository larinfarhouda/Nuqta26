'use client';
import { useLocale } from 'next-intl';
import { useCountry } from '@/hooks/useCountry';
import { COUNTRY_COOKIE_NAME } from '@/utils/country-helpers';

export default function CountrySelector() {
    const { country, countries } = useCountry();
    const ar = useLocale() === 'ar';
    return <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
        <span className="sr-only">{ar ? 'بلد الفعاليات' : 'Event country'}</span>
        <select aria-label={ar ? 'بلد الفعاليات' : 'Event country'} value={country?.id || ''}
            className="max-w-36 rounded-xl border border-gray-200 bg-white p-2"
            onChange={event => {
                const id = event.target.value;
                if (!countries.some(item => item.id === id && item.is_active)) return;
                document.cookie = `${COUNTRY_COOKIE_NAME}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
                const url = new URL(location.href);
                // Clear filters belonging to the previous market.
                ['country', 'location', 'lat', 'lng', 'radius', 'minPrice', 'maxPrice'].forEach(key => url.searchParams.delete(key));
                location.assign(url.toString());
            }}>
            <option value="" disabled>{ar ? 'اختر بلد الفعاليات' : 'Choose event country'}</option>
            {countries.filter(item => item.is_active).map(item => <option key={item.id} value={item.id}>{ar ? item.name_ar : item.name_en}</option>)}
        </select>
    </label>;
}
