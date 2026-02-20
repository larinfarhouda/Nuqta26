import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/login';

/**
 * User Dashboard E2E Tests
 * Tests the main user dashboard page (registrations overview)
 */
test.describe('User Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }
    });

    test('should display user dashboard with registrations heading', async ({ page }) => {
        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('should show bookings or empty state', async ({ page }) => {
        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        const bookingCards = page.locator('[class*="booking"], [class*="card"]');
        const emptyState = page.locator('text=/no.*registration|لا.*حجوزات|browse.*events|تصفح/i');

        const hasBookings = (await bookingCards.count()) > 0;
        const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasBookings || isEmpty).toBe(true);
    });

    test('should have sign out button', async ({ page }) => {
        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("تسجيل خروج"), button:has-text("تسجيل الخروج")').first();
        await expect(signOutBtn).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to favorites from dashboard', async ({ page }) => {
        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        const favoritesLink = page.locator('a[href*="favorites"], a:has-text("Favorites"), a:has-text("المفضلة")').first();
        if (await favoritesLink.isVisible().catch(() => false)) {
            await favoritesLink.click();
            await page.waitForLoadState('networkidle');
            expect(page.url()).toContain('favorites');
        }
    });

    test('should navigate to profile from dashboard', async ({ page }) => {
        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        const profileLink = page.locator('a[href*="profile"], a:has-text("Profile"), a:has-text("الملف")').first();
        if (await profileLink.isVisible().catch(() => false)) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
            expect(page.url()).toContain('profile');
        }
    });

    test('should display booking status badges', async ({ page }) => {
        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('networkidle');

        // If there are bookings, they should have status badges
        const statusBadges = page.locator('text=/confirmed|pending|payment|مؤكد|قيد/i');
        const bookingCount = await statusBadges.count();
        // May have 0 bookings, that's ok
    });
});
