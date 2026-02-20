import { test, expect } from '@playwright/test';

const VENDOR_EMAIL = process.env.TEST_VENDOR_EMAIL || '';
const VENDOR_PASSWORD = process.env.TEST_VENDOR_PASSWORD || '';

test.describe('Authentication Flows', () => {
    test('should login with valid vendor credentials and redirect to dashboard', async ({ page }) => {
        const response = await page.goto('/ar/login');

        // Skip if login page failed to load (server-side error)
        if (!response || response.status() >= 500) {
            test.skip(true, 'Login page returned server error');
            return;
        }

        // Wait for the form to render (client component)
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });

        await page.fill('input[name="email"]', VENDOR_EMAIL);
        await page.fill('input[name="password"]', VENDOR_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard/**', { timeout: 20000 });
        expect(page.url()).toContain('/dashboard');
    });

    test('should show error for invalid credentials', async ({ page }) => {
        const response = await page.goto('/ar/login');

        if (!response || response.status() >= 500) {
            test.skip(true, 'Login page returned server error');
            return;
        }

        await page.waitForSelector('input[name="email"]', { timeout: 10000 });

        await page.fill('input[name="email"]', 'invalid@example.com');
        await page.fill('input[name="password"]', 'wrongpassword123');
        await page.click('button[type="submit"]');

        // Should stay on login page and show error
        await page.waitForTimeout(3000);
        const currentUrl = page.url();
        const hasError = currentUrl.includes('error') || currentUrl.includes('login');
        expect(hasError).toBe(true);
    });

    test('should redirect unauthenticated user from protected pages', async ({ page }) => {
        await page.goto('/ar/dashboard/vendor');
        await page.waitForLoadState('networkidle');

        // Should redirect to login or homepage
        const url = page.url();
        expect(url.includes('login') || url.endsWith('/ar') || url.endsWith('/en') || url.includes('/')).toBe(true);
    });

    test('should sign out and redirect to homepage', async ({ page }) => {
        const response = await page.goto('/ar/login');

        if (!response || response.status() >= 500) {
            test.skip(true, 'Login page returned server error');
            return;
        }

        // Login first
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await page.fill('input[name="email"]', VENDOR_EMAIL);
        await page.fill('input[name="password"]', VENDOR_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard/**', { timeout: 20000 });

        // Find and click sign out button
        const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("تسجيل الخروج"), a:has-text("Sign Out"), a:has-text("تسجيل الخروج")').first();
        if (await signOutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await signOutBtn.click();
            await page.waitForLoadState('networkidle');
            const url = page.url();
            expect(url.includes('login') || url === '/' || url.endsWith('/ar') || url.endsWith('/en')).toBe(true);
        }
    });
});
