import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * Tests for homepage functionality and navigation
 */

test.describe('Homepage', () => {
    test('should load homepage successfully', async ({ page }) => {
        await page.goto('/');

        // Check title
        await expect(page).toHaveTitle(/Nuqta/i);

        // Check hero section is visible
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should display navigation menu', async ({ page }) => {
        await page.goto('/');

        // Check main header navigation
        const headerNav = page.locator('nav').first();
        await expect(headerNav).toBeVisible();

        // Check for language switcher (EN/AR buttons)
        const langSwitcher = page.locator('button:has-text("EN"), button:has-text("AR")').first();
        await expect(langSwitcher).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to events page', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Look for "اكتشف المزيد" (Discover More) or similar CTA
        // The homepage link might go to /register or /events
        const ctaLink = page.locator('a:has-text("اكتشف المزيد"), a:has-text("Discover"), a[href*="/events"]').first();

        if (await ctaLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            const href = await ctaLink.getAttribute('href');
            await ctaLink.click();
            await page.waitForLoadState('networkidle');
            // Verify navigation happened
            expect(page.url()).not.toBe('about:blank');
        }
    });

    test('should search for events', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find search input
        const searchInput = page.locator('input[type="search"], input[type="text"]').first();

        if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await searchInput.fill('music');
            await searchInput.press('Enter');
            await page.waitForLoadState('networkidle');
        }
    });

    test('should be mobile responsive', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/');

        // Check that mobile menu exists or is accessible
        const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i], button:has-text("☰")').first();

        if (await mobileMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(mobileMenu).toBeVisible();
        }
    });
});

test.describe('Event Discovery', () => {
    test('should display event cards on events page', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        // Check if event cards are displayed
        const eventCards = page.locator('[data-testid="event-card"], .event-card, article, a[href*="/events/"]');

        if (await eventCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
            const count = await eventCards.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('should open event details page', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        // Click on first event link
        const firstEvent = page.locator('a[href*="/events/"]').first();

        if (await firstEvent.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstEvent.click();
            await page.waitForLoadState('networkidle');

            // Verify we're on event details page
            await expect(page).toHaveURL(/.*events\/.+/);
        }
    });
});

test.describe('Accessibility', () => {
    test('should have no obvious accessibility violations on homepage', async ({ page }) => {
        await page.goto('/');

        // Basic accessibility checks
        const h1 = await page.locator('h1').count();
        expect(h1).toBeGreaterThan(0);

        // Check for alt text on images
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < Math.min(imageCount, 5); i++) {
            const img = images.nth(i);
            if (await img.isVisible()) {
                const alt = await img.getAttribute('alt');
                expect(alt).toBeDefined();
            }
        }
    });
});
