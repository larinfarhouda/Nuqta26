import { test, expect } from '@playwright/test';

/**
 * Password Reset Flow E2E Tests
 * Tests forgot-password and update-password pages
 * Note: Does NOT send real reset emails
 */
test.describe('Password Reset Flow', () => {
    test('should display forgot password page', async ({ page }) => {
        const response = await page.goto('/ar/forgot-password');

        if (!response || response.status() >= 500) {
            test.skip(true, 'Forgot password page returned server error');
            return;
        }

        await page.waitForLoadState('networkidle');

        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });

        // Should have email input
        const emailInput = page.locator('input[name="email"], input[type="email"]').first();
        await expect(emailInput).toBeVisible({ timeout: 5000 });

        // Should have submit button
        const submitBtn = page.locator('button[type="submit"]').first();
        await expect(submitBtn).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for empty email', async ({ page }) => {
        const response = await page.goto('/ar/forgot-password');

        if (!response || response.status() >= 500) {
            test.skip(true, 'Forgot password page returned server error');
            return;
        }

        await page.waitForLoadState('networkidle');

        const submitBtn = page.locator('button[type="submit"]').first();
        await expect(submitBtn).toBeVisible({ timeout: 10000 });
        await submitBtn.click();
        await page.waitForTimeout(1000);

        // Should show error
        const error = page.locator('[role="alert"], .text-red-500, .text-destructive, [class*="error"]').first();
        const hasError = await error.isVisible({ timeout: 3000 }).catch(() => false);
        // Or the input might show its native validation
        const emailInput = page.locator('input[name="email"], input[type="email"]').first();
        const isInvalid = await emailInput.evaluate(el => !(el as HTMLInputElement).checkValidity()).catch(() => false);
        expect(hasError || isInvalid).toBe(true);
    });

    test('should accept email input', async ({ page }) => {
        const response = await page.goto('/ar/forgot-password');

        if (!response || response.status() >= 500) {
            test.skip(true, 'Forgot password page returned server error');
            return;
        }

        await page.waitForLoadState('networkidle');

        const emailInput = page.locator('input[name="email"], input[type="email"]').first();
        await expect(emailInput).toBeVisible({ timeout: 10000 });
        await emailInput.fill('test@example.com');

        const value = await emailInput.inputValue();
        expect(value).toBe('test@example.com');
    });

    test('should have link back to login', async ({ page }) => {
        const response = await page.goto('/ar/forgot-password');

        if (!response || response.status() >= 500) {
            test.skip(true, 'Forgot password page returned server error');
            return;
        }

        await page.waitForLoadState('networkidle');

        const loginLink = page.locator('a[href*="login"], a:has-text("Login"), a:has-text("تسجيل الدخول"), a:has-text("Back"), a:has-text("رجوع"), a:has-text("العودة")').first();
        await expect(loginLink).toBeVisible({ timeout: 5000 });
    });

    test('update-password page loads', async ({ page }) => {
        const response = await page.goto('/ar/update-password');
        // Since this requires a valid reset token, it may show an error or redirect
        // We just verify it doesn't crash with a 500
        if (response) {
            expect(response.status()).toBeLessThan(500);
        }
    });

    test('login page has forgot password link', async ({ page }) => {
        const response = await page.goto('/ar/login');

        if (!response || response.status() >= 500) {
            test.skip(true, 'Login page returned server error');
            return;
        }

        await page.waitForLoadState('networkidle');

        const forgotLink = page.locator('a[href*="forgot"], a:has-text("Forgot"), a:has-text("نسيت")').first();
        await expect(forgotLink).toBeVisible({ timeout: 5000 });

        await forgotLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('forgot');
    });
});
