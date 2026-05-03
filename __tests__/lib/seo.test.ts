import {
    generateCanonicalUrl,
    generateLanguageAlternates,
    truncateText,
    createEventDescription,
    createVendorDescription,
    formatDateForOG,
    generateImageUrl,
    extractDomain,
    generateBreadcrumbSchema,
    generateLocaleBreadcrumbSchema,
    generateWebPageSchema,
    generateSpeakableSchema,
    generateOrganizationSchema,
    generateWebSiteSchema,
    generateSiteGraphSchema,
} from '@/lib/seo';

describe('SEO Utilities', () => {
    describe('generateCanonicalUrl', () => {
        it('should generate URL with locale', () => {
            expect(generateCanonicalUrl('events/test', 'en')).toBe('https://nuqta.ist/en/events/test');
        });

        it('should strip leading slash', () => {
            expect(generateCanonicalUrl('/events/test', 'ar')).toBe('https://nuqta.ist/ar/events/test');
        });
    });

    describe('generateLanguageAlternates', () => {
        it('should return ar, en, and x-default alternates', () => {
            const result = generateLanguageAlternates('events/test');
            expect(result).toHaveLength(3);
            expect(result.map(r => r.hreflang)).toEqual(['ar', 'en', 'x-default']);
        });

        it('should strip locale prefix from path', () => {
            const result = generateLanguageAlternates('en/events/test');
            expect(result[0].href).toContain('/ar/events/test');
            expect(result[1].href).toContain('/en/events/test');
        });

        it('should handle leading slash', () => {
            const result = generateLanguageAlternates('/events/test');
            expect(result[0].href).toBe('https://nuqta.ist/ar/events/test');
        });
    });

    describe('truncateText', () => {
        it('should return short text unchanged', () => {
            expect(truncateText('Hello')).toBe('Hello');
        });

        it('should truncate long text at word boundary', () => {
            const longText = 'A'.repeat(100) + ' ' + 'B'.repeat(100);
            const result = truncateText(longText, 160);
            expect(result.length).toBeLessThanOrEqual(163); // 160 + "..."
            expect(result).toMatch(/\.\.\.$/);
        });

        it('should handle empty/null text', () => {
            expect(truncateText('')).toBe('');
            expect(truncateText(null as any)).toBeNull();
        });
    });

    describe('createEventDescription', () => {
        it('should include all event parts', () => {
            const desc = createEventDescription({
                title: 'Test Event',
                description: 'A great event',
                location_name: 'Istanbul Hall',
                event_date: '2025-06-15',
                price: 100,
            });
            expect(desc).toContain('A great event');
            expect(desc).toContain('Istanbul Hall');
            expect(desc).toContain('100 TRY');
        });

        it('should show Free for price 0', () => {
            const desc = createEventDescription({ title: 'Free Event', price: 0 });
            expect(desc).toContain('Free');
        });

        it('should handle missing optional fields', () => {
            const desc = createEventDescription({ title: 'Minimal Event' });
            expect(desc).toBeDefined();
        });
    });

    describe('createVendorDescription', () => {
        it('should include vendor details', () => {
            const desc = createVendorDescription({
                business_name: 'Vendor Co',
                description_en: 'Best vendor',
                district: 'Beyoglu',
                categories: ['workshop', 'tour'],
            });
            expect(desc).toContain('Best vendor');
            expect(desc).toContain('Beyoglu');
            expect(desc).toContain('workshop');
        });

        it('should fallback to Arabic description', () => {
            const desc = createVendorDescription({
                business_name: 'Vendor',
                description_ar: 'وصف بالعربي',
            });
            expect(desc).toContain('وصف بالعربي');
        });
    });

    describe('formatDateForOG', () => {
        it('should format string date to ISO', () => {
            const result = formatDateForOG('2025-06-15');
            expect(result).toContain('2025-06-15');
        });

        it('should format Date object to ISO', () => {
            const result = formatDateForOG(new Date('2025-01-01'));
            expect(result).toContain('2025');
        });

        it('should handle invalid date', () => {
            const result = formatDateForOG('not-a-date');
            expect(result).toBeDefined(); // Falls back to current date
        });
    });

    describe('generateImageUrl', () => {
        it('should return default OG image when no path', () => {
            expect(generateImageUrl()).toBe('https://nuqta.ist/images/og-image.png');
            expect(generateImageUrl(null)).toBe('https://nuqta.ist/images/og-image.png');
        });

        it('should return full URL as-is', () => {
            expect(generateImageUrl('https://cdn.example.com/img.png')).toBe('https://cdn.example.com/img.png');
        });

        it('should prepend base URL to relative path', () => {
            expect(generateImageUrl('/images/test.png')).toBe('https://nuqta.ist/images/test.png');
            expect(generateImageUrl('images/test.png')).toBe('https://nuqta.ist/images/test.png');
        });
    });

    describe('extractDomain', () => {
        it('should extract domain from URL', () => {
            expect(extractDomain('https://example.com/path')).toBe('example.com');
        });

        it('should return default for invalid URL', () => {
            expect(extractDomain('not-a-url')).toBe('nuqta.ist');
        });
    });

    describe('generateBreadcrumbSchema', () => {
        it('should generate breadcrumb schema', () => {
            const result = generateBreadcrumbSchema([
                { name: 'Home', url: 'https://nuqta.ist' },
                { name: 'Events', url: 'https://nuqta.ist/events' },
            ]);
            expect(result['@type']).toBe('BreadcrumbList');
            expect(result.itemListElement).toHaveLength(2);
            expect(result.itemListElement[0].position).toBe(1);
        });
    });

    describe('generateLocaleBreadcrumbSchema', () => {
        it('should generate locale-aware breadcrumbs', () => {
            const result = generateLocaleBreadcrumbSchema('en', [
                { name: 'Home', path: '' },
                { name: 'Events', path: '/events' },
            ]);
            expect(result.itemListElement[1].item).toContain('/en/events');
        });

        it('should handle full URLs in path', () => {
            const result = generateLocaleBreadcrumbSchema('ar', [
                { name: 'External', path: 'https://external.com' },
            ]);
            expect(result.itemListElement[0].item).toBe('https://external.com');
        });
    });

    describe('generateWebPageSchema', () => {
        it('should generate WebPage schema', () => {
            const result = generateWebPageSchema({
                name: 'Test Page',
                description: 'Test description',
                url: 'https://nuqta.ist/test',
                locale: 'en',
            });
            expect(result['@type']).toBe('WebPage');
            expect(result.inLanguage).toBe('en');
        });

        it('should use custom type', () => {
            const result = generateWebPageSchema({
                name: 'About',
                description: 'About us',
                url: 'https://nuqta.ist/about',
                locale: 'ar',
                type: 'AboutPage',
            });
            expect(result['@type']).toBe('AboutPage');
            expect(result.inLanguage).toBe('ar');
        });
    });

    describe('generateSpeakableSchema', () => {
        it('should generate default speakable selectors', () => {
            const result = generateSpeakableSchema();
            expect(result['@type']).toBe('SpeakableSpecification');
            expect(result.cssSelector).toContain('h1');
        });

        it('should use custom selectors', () => {
            const result = generateSpeakableSchema(['.content']);
            expect(result.cssSelector).toEqual(['.content']);
        });
    });

    describe('generateOrganizationSchema', () => {
        it('should generate organization schema in Arabic', () => {
            const result = generateOrganizationSchema('ar');
            expect(result['@type']).toBe('Organization');
            expect(result.description).toContain('الرقمية');
        });

        it('should generate organization schema in English', () => {
            const result = generateOrganizationSchema('en');
            expect(result.description).toContain('digital marketplace');
        });
    });

    describe('generateWebSiteSchema', () => {
        it('should generate website schema', () => {
            const result = generateWebSiteSchema('en');
            expect(result['@type']).toBe('WebSite');
            expect(result.name).toBe('Nuqta');
        });
    });

    describe('generateSiteGraphSchema', () => {
        it('should combine organization and website schemas', () => {
            const result = generateSiteGraphSchema('en');
            expect(result['@context']).toBe('https://schema.org');
            expect(result['@graph']).toHaveLength(2);
        });
    });
});
