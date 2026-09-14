'use client';

import { createContext, useContext, useCallback } from 'react';
import { useLocale } from 'next-intl';
import type { Country } from '@/repositories/country.repository';

export const CountryContext = createContext<{ countries: Country[]; country: Country | null }>({ countries: [], country: null });
export function useCountry() { return useContext(CountryContext); }
export function useCountryId() { return useCountry().country?.id || ''; }
export function useCountryName() {
    const locale = useLocale();
    const { country } = useCountry();
    return country ? (locale === 'ar' ? country.name_ar : country.name_en) : (locale === 'ar' ? 'منطقتك' : 'your area');
}
export function useCurrencySymbol(countryId?: string | null) {
    const { countries } = useCountry();
    return countries.find(country => country.id === countryId)?.currency_symbol || '';
}

export function useCountryCurrency() {
    const { countries } = useCountry();
    return useCallback((countryId?: string | null) => countries.find(country => country.id === countryId)?.currency_symbol || '', [countries]);
}
