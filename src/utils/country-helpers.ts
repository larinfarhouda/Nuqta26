import { Country } from '@/repositories/country.repository';

/**
 * Format a price with the country's currency symbol.
 * Returns empty string for 0 (used for "Free" events).
 */
export function formatPrice(amount: number, currencySymbol: string): string {
    if (amount === 0) return '';
    return `${amount.toLocaleString()} ${currencySymbol}`;
}

/**
 * Format price with full country config.
 */
export function formatPriceWithCountry(amount: number, country: Country): string {
    return formatPrice(amount, country.currency_symbol);
}

/**
 * Get the currency symbol for a country ID.
 * Fallback to ₺ for backwards compatibility.
 */
const CURRENCY_MAP: Record<string, string> = {
    tr: '₺',
    eg: 'ج.م',
};

export function getCurrencySymbol(countryId: string | null | undefined): string {
    return CURRENCY_MAP[countryId || 'tr'] || '₺';
}

/**
 * Get the ISO 4217 currency code for a country ID.
 * Used for schema.org and API integrations.
 */
const CURRENCY_CODE_MAP: Record<string, string> = {
    tr: 'TRY',
    eg: 'EGP',
};

export function getCurrencyCode(countryId: string | null | undefined): string {
    return CURRENCY_CODE_MAP[countryId || 'tr'] || 'TRY';
}

/**
 * Get the ISO 3166-1 alpha-2 country code (uppercase).
 */
export function getCountryCode(countryId: string | null | undefined): string {
    return (countryId || 'tr').toUpperCase();
}

/**
 * Get a country's flag emoji from its 2-letter code.
 */
export function getCountryFlag(countryId: string): string {
    const flags: Record<string, string> = {
        tr: '🇹🇷',
        eg: '🇪🇬',
    };
    return flags[countryId] || '🌍';
}

/**
 * Cookie name for storing selected country
 */
export const COUNTRY_COOKIE_NAME = '__nuqta_country';

/**
 * Default country when none is selected
 */
export const DEFAULT_COUNTRY = 'tr';

/**
 * Get country name in English
 */
const COUNTRY_NAME_EN: Record<string, string> = {
    tr: 'Turkey',
    eg: 'Egypt',
};

export function getCountryNameEn(countryId: string | null | undefined): string {
    return COUNTRY_NAME_EN[countryId || 'tr'] || 'Turkey';
}

/**
 * Get country name in Arabic
 */
const COUNTRY_NAME_AR: Record<string, string> = {
    tr: 'تركيا',
    eg: 'مصر',
};

export function getCountryNameAr(countryId: string | null | undefined): string {
    return COUNTRY_NAME_AR[countryId || 'tr'] || 'تركيا';
}

/**
 * Get country name based on locale
 */
export function getCountryName(countryId: string | null | undefined, locale: string): string {
    return locale === 'ar' ? getCountryNameAr(countryId) : getCountryNameEn(countryId);
}
