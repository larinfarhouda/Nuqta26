'use client';
import type { ReactNode } from 'react';
import type { Country } from '@/repositories/country.repository';
import { CountryContext } from '@/hooks/useCountry';
export default function CountryProvider({ children, countries, country }: { children: ReactNode; countries: Country[]; country: Country | null }) {
    return <CountryContext.Provider value={{ countries, country }}>{children}</CountryContext.Provider>;
}
