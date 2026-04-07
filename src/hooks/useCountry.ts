'use client';

import { useLocale } from 'next-intl';
import { getCountryName, COUNTRY_COOKIE_NAME, DEFAULT_COUNTRY } from '@/utils/country-helpers';

/**
 * Read the country cookie on the client side.
 */
function getClientCountryId(): string {
    if (typeof document === 'undefined') return DEFAULT_COUNTRY;
    const match = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE_NAME}=([^;]*)`));
    return match?.[1] || DEFAULT_COUNTRY;
}

/**
 * Hook that returns the visitor's country name in the current locale.
 * Reads the __nuqta_country cookie set by middleware.
 */
export function useCountryName(): string {
    const locale = useLocale();
    return getCountryName(getClientCountryId(), locale);
}

/**
 * Hook that returns the visitor's country ID from the cookie.
 */
export function useCountryId(): string {
    return getClientCountryId();
}
