/**
 * SEO Utility Functions
 * Helpers for generating consistent SEO metadata across the application
 */

const BASE_URL = 'https://nuqta.ist';
const LOCALES = ['ar', 'en'] as const;

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

    return LOCALES.map(locale => ({
        hreflang: locale === 'ar' ? 'ar' : 'en',
        href: `${BASE_URL}/${locale}/${cleanPath}`
    }));
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
        parts.push(`Price: ${event.price === 0 ? 'Free' : `${event.price} TRY`}`);
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
