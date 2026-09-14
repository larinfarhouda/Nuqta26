import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { CountryRepository } from '@/repositories/country.repository';
import { COUNTRY_COOKIE_NAME } from '@/utils/country-helpers';
import { resolveCountry } from './country-selection';

// React cache shares this result within a request, never between visitors.
export const getRequestCountry = cache(async () => {
    const [cookieStore, requestHeaders, supabase] = await Promise.all([cookies(), headers(), createClient()]);
    const countries = await new CountryRepository(supabase).findAllCountries(false);
    const detected = requestHeaders.get('x-vercel-ip-country');
    const country = resolveCountry(countries, cookieStore.get(COUNTRY_COOKIE_NAME)?.value, detected);
    return { countries, country, detectedCountry: detected?.toLowerCase() || null };
});
