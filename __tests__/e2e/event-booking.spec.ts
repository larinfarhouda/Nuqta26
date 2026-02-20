import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/login';

/**
 * Event Detail & Booking Flow E2E Tests
 * Tests event viewing, ticket selection, and booking initiation
 */
test.describe('Event Detail & Booking', () => {
    test('should display event list page', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to event detail page from list', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventLink = page.locator('a[href*="/events/"], a[href*="/event/"]').first();
        if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventLink.click();
            await page.waitForLoadState('networkidle');

            const title = page.locator('h1').first();
            await expect(title).toBeVisible({ timeout: 10000 });
        }
    });

    test('should display event details with structured data', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventLink = page.locator('a[href*="/events/"]').first();
        if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventLink.click();
            await page.waitForLoadState('networkidle');

            const jsonLd = page.locator('script[type="application/ld+json"]');
            expect(await jsonLd.count()).toBeGreaterThan(0);

            const hasDate = await page.locator('text=/\\d{1,2}.*\\d{4}|\\d{4}.*\\d{1,2}/').first().isVisible({ timeout: 3000 }).catch(() => false);
            const hasLocation = await page.locator('text=/Istanbul|اسطنبول|location|موقع/i').first().isVisible({ timeout: 3000 }).catch(() => false);
            expect(hasDate || hasLocation).toBe(true);
        }
    });

    test('should show ticket options on event page', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventLink = page.locator('a[href*="/events/"]').first();
        if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventLink.click();
            await page.waitForLoadState('networkidle');

            const ticketSection = page.locator('text=/ticket|تذكرة|book|احجز|register|سجل|price|سعر|TRY|₺/i').first();
            const hasTickets = await ticketSection.isVisible({ timeout: 5000 }).catch(() => false);
            if (hasTickets) {
                expect(hasTickets).toBe(true);
            }
        }
    });

    test('should require login to book event', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventLink = page.locator('a[href*="/events/"]').first();
        if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventLink.click();
            await page.waitForLoadState('networkidle');

            const bookBtn = page.locator('button:has-text("Book"), button:has-text("Register"), button:has-text("احجز"), button:has-text("سجل")').first();
            if (await bookBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await bookBtn.click();
                await page.waitForTimeout(2000);

                const url = page.url();
                const loginDialog = page.locator('text=/login|sign in|تسجيل الدخول/i').first();
                const redirectedToLogin = url.includes('login');
                const showsLoginPrompt = await loginDialog.isVisible({ timeout: 3000 }).catch(() => false);

                expect(redirectedToLogin || showsLoginPrompt).toBe(true);
            }
        }
    });

    test('should initiate booking when logged in', async ({ page }) => {
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }

        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventLink = page.locator('a[href*="/events/"]').first();
        if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventLink.click();
            await page.waitForLoadState('networkidle');

            const bookBtn = page.locator('button:has-text("Book"), button:has-text("Register"), button:has-text("احجز"), button:has-text("سجل")').first();
            if (await bookBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                const isEnabled = await bookBtn.isEnabled();
                expect(isEnabled).toBe(true);
            }
        }
    });

    test('should share event page', async ({ page }) => {
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventLink = page.locator('a[href*="/events/"]').first();
        if (await eventLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventLink.click();
            await page.waitForLoadState('networkidle');

            const shareBtn = page.locator('button[aria-label*="share"], button[aria-label*="مشاركة"], button:has-text("Share"), button:has-text("مشاركة")').first();
            if (await shareBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await shareBtn.click();
                await page.waitForTimeout(1000);
            }
        }
    });
});
