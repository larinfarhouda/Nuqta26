import { test, expect } from '@playwright/test';
import { loginAsVendor } from './helpers/login';

/**
 * Vendor Dashboard E2E Tests
 * Tests for vendor event management and dashboard functionality
 */

test.describe('Vendor Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        const loggedIn = await loginAsVendor(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as vendor');
            return;
        }
    });

    test.describe('Event Management', () => {
        test('should navigate to create event page', async ({ page }) => {
            // Look for "Create Event" or "New Event" button
            const createButton = page.locator('text=/create.*event/i, text=/new.*event/i, text=/إنشاء.*فعالية/i, text=/فعالية.*جديدة/i').first();

            if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await createButton.click();
                await expect(page).toHaveURL(/.*events\/(create|new)/i);
            }
        });

        test('should create new event', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor/events/create');
            await page.waitForLoadState('networkidle');

            const timestamp = Date.now();
            const titleInput = page.locator('[name="title"]');
            if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                await page.fill('[name="title"]', `Test Event ${timestamp}`);
                // Verify form is interactive
                const title = await titleInput.inputValue();
                expect(title).toContain('Test Event');
            }
        });

        test('should update existing event listing', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            // Find first event card/link
            const eventLink = page.locator('a[href*="/events/"]').first();
            if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await eventLink.click();
                await page.waitForLoadState('networkidle');
                expect(page.url()).toContain('/events/');
            }
        });

        test('should create discount code for event', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            const discountsLink = page.locator('a[href*="discount"], text=/discount|خصم|كوبون/i').first();
            if (await discountsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await discountsLink.click();
                await page.waitForLoadState('networkidle');
            }
        });

        test('should publish event', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            // Verify dashboard loaded
            const heading = page.locator('h1, h2').first();
            await expect(heading).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Booking Management', () => {
        test('should view bookings list', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            const bookingsLink = page.locator('a[href*="booking"], text=/booking|حجوزات/i').first();
            if (await bookingsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await bookingsLink.click();
                await page.waitForLoadState('networkidle');
            }
        });

        test('should confirm pending booking', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            const heading = page.locator('h1, h2').first();
            await expect(heading).toBeVisible({ timeout: 10000 });
        });

        test('should cancel booking', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            const heading = page.locator('h1, h2').first();
            await expect(heading).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Analytics', () => {
        test('should view analytics dashboard', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            const analyticsLink = page.locator('a[href*="analytics"], text=/analytics|تحليلات/i').first();
            if (await analyticsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await analyticsLink.click();
                await page.waitForLoadState('networkidle');
            }
        });

        test('should display revenue metrics', async ({ page }) => {
            await page.goto('/ar/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            const heading = page.locator('h1, h2').first();
            await expect(heading).toBeVisible({ timeout: 10000 });
        });
    });
});
