/**
 * SEO Utility Functions
 * Helpers for generating consistent SEO metadata across the application
 */

const BASE_URL = 'https://nuqta.ist';
const LOCALES = ['ar', 'en'] as const;
import { getCurrencyCode } from '@/utils/country-helpers';

export type Locale = typeof LOCALES[number];

/**
 * Generate canonical URL for a given path and locale
 */
export function generateCanonicalUrl(path: string, locale: Locale): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}/${locale}/${cleanPath}`;
}

/**
 * Generate language alternate links for hreflang tags
 */
export function generateLanguageAlternates(path: string): Array<{ hreflang: string; href: string }> {
    // Remove leading slash and locale prefix if present
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Remove locale prefix if it exists
    LOCALES.forEach(locale => {
        if (cleanPath.startsWith(`${locale}/`)) {
            cleanPath = cleanPath.slice(3);
        }
    });

    const alternates = LOCALES.map(locale => ({
        hreflang: locale === 'ar' ? 'ar' : 'en',
        href: `${BASE_URL}/${locale}/${cleanPath}`
    }));

    // Add x-default pointing to Arabic (default locale)
    alternates.push({
        hreflang: 'x-default',
        href: `${BASE_URL}/ar/${cleanPath}`
    });

    return alternates;
}

/**
 * Truncate text to a specific length for meta descriptions
 * Ensures words aren't cut off mid-word
 */
export function truncateText(text: string, maxLength: number = 160): string {
    if (!text || text.length <= maxLength) return text;

    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0
        ? `${truncated.slice(0, lastSpace)}...`
        : `${truncated}...`;
}

/**
 * Create a rich description from event data
 */
export function createEventDescription(event: {
    title: string;
    description?: string | null;
    location_name?: string | null;
    district?: string | null;
    event_date?: string | null;
    price?: number | null;
    country?: string | null;
}): string {
    const parts: string[] = [];

    if (event.description) {
        parts.push(event.description);
    }

    if (event.location_name || event.district) {
        const location = event.location_name || event.district;
        parts.push(`Location: ${location}`);
    }

    if (event.event_date) {
        try {
            const date = new Date(event.event_date);
            parts.push(`Date: ${date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })}`);
        } catch (e) {
            // Invalid date, skip
        }
    }

    if (event.price !== undefined && event.price !== null) {
        parts.push(`Price: ${event.price === 0 ? 'Free' : `${event.price} ${getCurrencyCode(event.country)}`}`);
    }

    return truncateText(parts.join(' | '), 160);
}

/**
 * Create a rich description from vendor data
 */
export function createVendorDescription(vendor: {
    business_name: string;
    description_ar?: string | null;
    description_en?: string | null;
    district?: string | null;
    categories?: string[];
}): string {
    const parts: string[] = [];

    const description = vendor.description_en || vendor.description_ar;
    if (description) {
        parts.push(description);
    }

    if (vendor.district) {
        parts.push(`Based in ${vendor.district}, Istanbul`);
    }

    if (vendor.categories && vendor.categories.length > 0) {
        parts.push(`Specializing in ${vendor.categories.join(', ')}`);
    }

    return truncateText(parts.join(' | '), 160);
}

/**
 * Format date for OpenGraph and structured data
 */
export function formatDateForOG(date: string | Date): string {
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString();
    } catch (e) {
        return new Date().toISOString();
    }
}

/**
 * Generate image URL with proper domain
 */
export function generateImageUrl(imagePath?: string | null): string {
    if (!imagePath) {
        return `${BASE_URL}/images/og-image.png`;
    }

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // If it's a relative path, prepend base URL
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${BASE_URL}${cleanPath}`;
}

/**
 * Extract domain from URL (for organization schema)
 */
export function extractDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return 'nuqta.ist';
    }
}

/**
 * Generate structured data for breadcrumbs
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    };
}

/**
 * Generate locale-aware breadcrumb schema
 */
export function generateLocaleBreadcrumbSchema(
    locale: string,
    items: Array<{ name: string; path: string }>
) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.path.startsWith('http') ? item.path : `${BASE_URL}/${locale}${item.path}`
        }))
    };
}

/**
 * Generate WebPage structured data for static pages
 */
export function generateWebPageSchema(options: {
    name: string;
    description: string;
    url: string;
    locale: string;
    type?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': options.type || 'WebPage',
        name: options.name,
        description: options.description,
        url: options.url,
        inLanguage: options.locale === 'ar' ? 'ar' : 'en',
        isPartOf: {
            '@type': 'WebSite',
            name: 'Nuqta',
            url: BASE_URL,
        },
    };
}

/**
 * Generate speakable property for schema objects
 * Tells LLMs which parts of the page are most suitable for text-to-speech / citation
 */
export function generateSpeakableSchema(cssSelectors?: string[]) {
    return {
        '@type': 'SpeakableSpecification',
        cssSelector: cssSelectors || ['h1', 'h2', '[data-speakable]', 'meta[name="description"]'],
    };
}

/**
 * Generate centralized Organization schema with knowsAbout for AEO
 */
export function generateOrganizationSchema(locale: string) {
    return {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Nuqta',
        url: BASE_URL,
        logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/icon0.svg`,
        },
        image: `${BASE_URL}/images/og-image.png`,
        description: locale === 'ar'
            ? 'المنصة الرقمية للفعاليات والتذاكر في مجتمع اسطنبول العربي.'
            : "The digital marketplace for events and ticketing in Istanbul's Arabic-speaking community.",
        foundingDate: '2024',
        inLanguage: ['ar', 'en'],
        sameAs: [
            'https://instagram.com/nuqta_ist',
            'https://twitter.com/nuqta_ist',
        ],
        knowsAbout: [
            'Arabic community events in Istanbul',
            'Event management for Arabic-speaking organizers',
            'Bilingual event ticketing platform',
            'Cultural events in Turkey',
            'Workshop and bazaar organization',
            'فعاليات المجتمع العربي في إسطنبول',
            'إدارة الفعاليات',
        ],
        areaServed: {
            '@type': 'City',
            name: 'Istanbul',
            containedInPlace: {
                '@type': 'Country',
                name: 'Turkey',
            },
        },
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Istanbul',
            addressCountry: 'TR',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            url: `${BASE_URL}/${locale}/contact`,
            availableLanguage: ['Arabic', 'English'],
        },
    };
}

/**
 * Generate centralized WebSite schema with SearchAction for AEO
 */
export function generateWebSiteSchema(locale: string) {
    return {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: 'Nuqta',
        url: BASE_URL,
        description: locale === 'ar'
            ? 'اكتشف أفضل الفعاليات والأنشطة العربية في إسطنبول'
            : 'Discover the best Arabic events and activities in Istanbul',
        inLanguage: ['ar', 'en'],
        publisher: { '@id': `${BASE_URL}/#organization` },
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${BASE_URL}/${locale}?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

/**
 * Generate a combined @graph schema for use in root layout
 */
export function generateSiteGraphSchema(locale: string) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            generateOrganizationSchema(locale),
            generateWebSiteSchema(locale),
        ],
    };
}

