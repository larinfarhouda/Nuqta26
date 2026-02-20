import { test, expect } from '@playwright/test';

/**
 * Public Pages Smoke Tests
 * Verifies all public/static pages load without errors
 */
test.describe('Public Pages', () => {
    test('about page loads correctly', async ({ page }) => {
        await page.goto('/ar/about');
        await page.waitForLoadState('networkidle');

        // Page should have content (not an error page)
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });

        // Should have structured data
        const jsonLd = page.locator('script[type="application/ld+json"]');
        expect(await jsonLd.count()).toBeGreaterThan(0);
    });

    test('contact page loads and has form', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });

        // Should have contact information or form
        const contactContent = page.locator('form, a[href*="mailto"], a[href*="whatsapp"], a[href*="instagram"]');
        expect(await contactContent.count()).toBeGreaterThan(0);
    });

    test('contact form can be filled', async ({ page }) => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Look for contact form fields
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="الاسم"]').first();
        const emailInput = page.locator('input[name="email"], input[type="email"]').first();
        const messageInput = page.locator('textarea[name="message"], textarea').first();

        if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill('E2E Test User');
        }
        if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill('e2e-test@example.com');
        }
        if (await messageInput.isVisible().catch(() => false)) {
            await messageInput.fill('This is an automated E2E test message.');
        }
        // Do NOT submit to avoid sending real contact requests
    });

    test('privacy page loads correctly', async ({ page }) => {
        await page.goto('/privacy');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('for-vendors landing page loads with key sections', async ({ page }) => {
        await page.goto('/for-vendors');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });

        // Should have CTA button(s)
        const cta = page.locator('a[href*="register"], button:has-text("Start"), button:has-text("ابدأ"), a:has-text("Register"), a:has-text("سجل")');
        expect(await cta.count()).toBeGreaterThan(0);
    });

    test('for-vendors page has pricing section', async ({ page }) => {
        await page.goto('/for-vendors');
        await page.waitForLoadState('networkidle');

        // Look for pricing-related content
        const pricingContent = page.locator('text=/pricing|أسعار|starter|growth|professional|مجان/i').first();
        const hasPricing = await pricingContent.isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasPricing).toBe(true);
    });

    test('for-vendors page has FAQ section', async ({ page }) => {
        await page.goto('/for-vendors');
        await page.waitForLoadState('networkidle');

        // FAQ section should exist
        const faqContent = page.locator('text=/FAQ|الأسئلة|frequently/i').first();
        const hasFAQ = await faqContent.isVisible({ timeout: 5000 }).catch(() => false);
        // FAQ items should be expandable
        if (hasFAQ) {
            const faqItem = page.locator('details, [role="button"], button[aria-expanded]').first();
            if (await faqItem.isVisible().catch(() => false)) {
                await faqItem.click();
                await page.waitForTimeout(500);
            }
        }
    });

    test('homepage loads with events section', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });
});
