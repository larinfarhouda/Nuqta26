import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
    test('should load with Arabic locale by default', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Should have Arabic lang attribute
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('ar');

        // Should have RTL direction
        const htmlDir = await page.getAttribute('html', 'dir');
        expect(htmlDir).toBe('rtl');
    });

    test('should switch to English locale via URL', async ({ page }) => {
        // Navigate directly to English version of the homepage
        await page.goto('/en');
        await page.waitForLoadState('networkidle');

        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('en');

        const htmlDir = await page.getAttribute('html', 'dir');
        expect(htmlDir).toBe('ltr');
    });

    test('should switch from English back to Arabic via URL', async ({ page }) => {
        // Start in English
        await page.goto('/en');
        await page.waitForLoadState('networkidle');

        let htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('en');

        // Then switch to Arabic
        await page.goto('/ar');
        await page.waitForLoadState('networkidle');

        htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('ar');

        const htmlDir = await page.getAttribute('html', 'dir');
        expect(htmlDir).toBe('rtl');
    });

    test('should display RTL layout for Arabic', async ({ page }) => {
        await page.goto('/ar');
        await page.waitForLoadState('networkidle');

        const dir = await page.getAttribute('html', 'dir');
        expect(dir).toBe('rtl');
    });

    test('should display LTR layout for English', async ({ page }) => {
        await page.goto('/en');
        await page.waitForLoadState('networkidle');

        const dir = await page.getAttribute('html', 'dir');
        expect(dir).toBe('ltr');
    });
});
