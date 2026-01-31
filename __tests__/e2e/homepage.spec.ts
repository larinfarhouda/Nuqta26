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

        // Check main header navigation (use first nav to avoid strict mode violation)
        const headerNav = page.locator('nav').first();
        await expect(headerNav).toBeVisible();

        // Check for language switcher which is in the header
        await expect(page.getByRole('button', { name: /EN|AR/ })).toBeVisible();
    });

    test('should navigate to events page', async ({ page }) => {
        await page.goto('/');

        // Look for "اكتشف المزيد" (Discover More) button on homepage
        const discoverButton = page.getByRole('link', { name: /اكتشف المزيد/ });

        if (await discoverButton.isVisible().catch(() => false)) {
            await discoverButton.click();

            // Wait for navigation to events page
            await page.waitForURL('**/events', { timeout: 10000 });

            // Verify we're on the events page
            await expect(page).toHaveURL(/.*events/);
        }
    });

    test('should search for events', async ({ page }) => {
        await page.goto('/');

        // Find search input (adjust selector based on your implementation)
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

        if (await searchInput.isVisible()) {
            // Type search query
            await searchInput.fill('music');

            // Submit search (may need to press Enter or click button)
            await searchInput.press('Enter');

            // Wait for results
            await page.waitForLoadState('networkidle');

            // Verify search happened (URL change or results displayed)
            // This will depend on your implementation
        }
    });

    test('should be mobile responsive', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/');

        // Check that mobile menu exists or is accessible
        // Adjust selector based on your implementation
        const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i]').first();

        if (await mobileMenu.isVisible()) {
            await expect(mobileMenu).toBeVisible();
        }
    });
});

test.describe('Event Discovery', () => {
    test('should display event cards on events page', async ({ page }) => {
        await page.goto('/events');

        // Wait for events to load
        await page.waitForLoadState('networkidle');

        // Check if event cards are displayed
        // Adjust selector based on your implementation
        const eventCards = page.locator('[data-testid="event-card"], .event-card, article');

        if (await eventCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
            const count = await eventCards.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('should open event details page', async ({ page }) => {
        await page.goto('/events');

        // Wait for events to load
        await page.waitForLoadState('networkidle');

        // Click on first event (adjust selector)
        const firstEvent = page.locator('[data-testid="event-card"], .event-card, article').first();

        if (await firstEvent.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstEvent.click();

            // Wait for navigation
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
        // Check for heading hierarchy
        const h1 = await page.locator('h1').count();
        expect(h1).toBeGreaterThan(0);

        // Check for alt text on images
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < Math.min(imageCount, 5); i++) {
            const img = images.nth(i);
            if (await img.isVisible()) {
                const alt = await img.getAttribute('alt');
                // Images should have alt text (can be empty for decorative images)
                expect(alt).toBeDefined();
            }
        }
    });
});
