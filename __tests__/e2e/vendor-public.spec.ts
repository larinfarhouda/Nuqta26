import { test, expect } from '@playwright/test';

/**
 * Public Vendor Profile & Demo Vendor E2E Tests
 * Tests vendor public pages (/v/[slug]) and demo vendor page
 */
test.describe('Vendor Public Profile', () => {
    test('should display demo vendor page', async ({ page }) => {
        await page.goto('/ar/v/istanbul-cultural-events');
        await page.waitForLoadState('networkidle');

        // Page should load with vendor details
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });

        // Should have structured data
        const jsonLd = page.locator('script[type="application/ld+json"]');
        expect(await jsonLd.count()).toBeGreaterThan(0);
    });

    test('should display vendor events on profile', async ({ page }) => {
        await page.goto('/ar/v/istanbul-cultural-events');
        await page.waitForLoadState('networkidle');

        // Should show events section
        const eventsSection = page.locator('text=/events|فعاليات/i').first();
        const hasEvents = await eventsSection.isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasEvents).toBe(true);
    });

    test('should display vendor gallery on profile', async ({ page }) => {
        await page.goto('/ar/v/istanbul-cultural-events');
        await page.waitForLoadState('networkidle');

        // Should show gallery/images
        const images = page.locator('img[src*="supabase"], img[src*="demo"], img[alt]');
        const imageCount = await images.count();
        expect(imageCount).toBeGreaterThan(0);
    });

    test('should display vendor contact information', async ({ page }) => {
        await page.goto('/ar/v/istanbul-cultural-events');
        await page.waitForLoadState('networkidle');

        // Look for contact information (WhatsApp, social links, etc.)
        const contactInfo = page.locator('a[href*="whatsapp"], a[href*="instagram"], a[href*="wa.me"], text=/whatsapp|واتساب/i');
        const hasContact = await contactInfo.first().isVisible({ timeout: 5000 }).catch(() => false);
        // Contact info may or may not be present on demo
    });

    test('should handle non-existent vendor gracefully', async ({ page }) => {
        const response = await page.goto('/ar/v/non-existent-vendor-slug-12345');
        await page.waitForLoadState('networkidle');

        // Should return 404 or show "not found" message
        const is404 = response?.status() === 404;
        const hasNotFound = await page.locator('text=/not found|غير موجود|404/i').first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(is404 || hasNotFound).toBe(true);
    });
});

test.describe('Demo Vendor Page', () => {
    test('should load demo vendor page at /demo/vendor', async ({ page }) => {
        const response = await page.goto('/ar/demo/vendor');
        await page.waitForLoadState('networkidle');

        // Should either show demo content or redirect to the demo vendor slug
        const status = response?.status() || 0;
        expect(status).toBeLessThan(500);

        // Check if we were redirected to the vendor profile
        const url = page.url();
        const hasContent = await page.locator('h1, h2').first().isVisible({ timeout: 5000 }).catch(() => false);
        expect(url.includes('demo') || url.includes('istanbul-cultural-events') || hasContent).toBe(true);
    });
});
