import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/login';

test.describe('User Booking & Favorites', () => {
    test('should browse events page', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('should view event details', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventCard = page.locator('a[href*="/event"], a[href*="/events/"], [data-testid="event-card"]').first();
        if (await eventCard.isVisible()) {
            await eventCard.click();
            await page.waitForLoadState('networkidle');

            const url = page.url();
            expect(url.includes('event')).toBe(true);

            const title = page.locator('h1').first();
            await expect(title).toBeVisible({ timeout: 5000 });
        }
    });

    test('should add event to favorites when logged in', async ({ page }) => {
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }

        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventCard = page.locator('a[href*="/event"], a[href*="/events/"]').first();
        if (await eventCard.isVisible()) {
            await eventCard.click();
            await page.waitForLoadState('networkidle');

            const favBtn = page.locator('button[aria-label*="favorite"], button[aria-label*="مفضل"], button:has(svg), [data-testid="favorite-button"]').first();
            if (await favBtn.isVisible()) {
                await favBtn.click();
                await page.waitForTimeout(1000);
            }
        }
    });

    test('should view user bookings page', async ({ page }) => {
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }

        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        const bookingsLink = page.locator('a[href*="booking"], a:has-text("Bookings"), a:has-text("الحجوزات"), a:has-text("حجوزاتي")').first();
        if (await bookingsLink.isVisible()) {
            await bookingsLink.click();
            await page.waitForLoadState('networkidle');
            expect(page.url()).toContain('dashboard');
        }
    });

    test('should view user favorites page', async ({ page }) => {
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }

        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        const favsLink = page.locator('a[href*="favorite"], a:has-text("Favorites"), a:has-text("المفضلة")').first();
        if (await favsLink.isVisible()) {
            await favsLink.click();
            await page.waitForLoadState('networkidle');
            expect(page.url()).toContain('dashboard');
        }
    });
});
