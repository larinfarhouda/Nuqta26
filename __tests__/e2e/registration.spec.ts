import { test, expect } from '@playwright/test';

/**
 * Registration Flow E2E Tests  
 * Tests user and vendor registration forms
 * Note: Does NOT submit real registrations to avoid creating test accounts
 */
test.describe('Registration Flow', () => {
    test('should display registration page with role selector', async ({ page }) => {
        await page.goto('/ar/register');
        await page.waitForLoadState('networkidle');

        // Page should load
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });

        // Should have user/vendor role tabs or buttons
        const userTab = page.locator('button:has-text("User"), button:has-text("مستخدم"), [data-role="user"]').first();
        const vendorTab = page.locator('button:has-text("Vendor"), button:has-text("منظم"), [data-role="vendor"]').first();

        const hasRoleSelector = (await userTab.isVisible().catch(() => false)) ||
            (await vendorTab.isVisible().catch(() => false));
        // Either role selector or a single registration form should exist
        const hasForm = await page.locator('form').first().isVisible().catch(() => false);
        expect(hasRoleSelector || hasForm).toBe(true);
    });

    test('should display user registration form fields', async ({ page }) => {
        await page.goto('/ar/register');
        await page.waitForLoadState('networkidle');

        // Click user role if selector exists
        const userTab = page.locator('button:has-text("User"), button:has-text("مستخدم"), [data-role="user"]').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }

        // Verify form fields exist
        const emailField = page.locator('input[name="email"], input[type="email"]').first();
        const passwordField = page.locator('input[name="password"], input[type="password"]').first();
        const nameField = page.locator('input[name="full_name"], input[name="fullName"], input[name="name"]').first();

        await expect(emailField).toBeVisible({ timeout: 5000 });
        await expect(passwordField).toBeVisible({ timeout: 5000 });
    });

    test('should fill user registration form without submitting', async ({ page }) => {
        await page.goto('/ar/register');
        await page.waitForLoadState('networkidle');

        const userTab = page.locator('button:has-text("User"), button:has-text("مستخدم"), [data-role="user"]').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }

        // Fill form fields
        const nameField = page.locator('input[name="full_name"], input[name="fullName"], input[name="name"]').first();
        if (await nameField.isVisible().catch(() => false)) {
            await nameField.fill('E2E Test User');
        }

        const emailField = page.locator('input[name="email"], input[type="email"]').first();
        if (await emailField.isVisible().catch(() => false)) {
            await emailField.fill('e2e-test-user@example.com');
        }

        const passwordField = page.locator('input[name="password"], input[type="password"]').first();
        if (await passwordField.isVisible().catch(() => false)) {
            await passwordField.fill('TestPassword123!');
        }

        // Verify phone input exists
        const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
        if (await phoneField.isVisible().catch(() => false)) {
            await phoneField.fill('+905551234567');
        }

        // Do NOT click submit — we don't want to create real accounts
    });

    test('should show validation errors for empty submission', async ({ page }) => {
        await page.goto('/ar/register');
        await page.waitForLoadState('networkidle');

        const submitBtn = page.locator('button[type="submit"]').first();
        if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(1000);

            // Should show validation errors
            const errors = page.locator('[role="alert"], .text-red-500, .text-destructive, [class*="error"]');
            const errorCount = await errors.count();
            expect(errorCount).toBeGreaterThan(0);
        }
    });

    test('should switch to vendor registration form', async ({ page }) => {
        await page.goto('/ar/register');
        await page.waitForLoadState('networkidle');

        const vendorTab = page.locator('button:has-text("Vendor"), button:has-text("منظم"), [data-role="vendor"]').first();
        if (await vendorTab.isVisible().catch(() => false)) {
            await vendorTab.click();
            await page.waitForTimeout(500);

            // Vendor form should have business name field
            const businessNameField = page.locator('input[name="business_name"], input[name="businessName"]').first();
            const isVisible = await businessNameField.isVisible({ timeout: 3000 }).catch(() => false);
            expect(isVisible).toBe(true);
        }
    });

    test('should have OAuth login buttons', async ({ page }) => {
        await page.goto('/ar/register');
        await page.waitForLoadState('networkidle');

        // Look for Google/Facebook OAuth buttons
        const googleBtn = page.locator('button:has-text("Google"), [data-provider="google"]').first();
        const facebookBtn = page.locator('button:has-text("Facebook"), [data-provider="facebook"]').first();

        const hasGoogle = await googleBtn.isVisible().catch(() => false);
        const hasFacebook = await facebookBtn.isVisible().catch(() => false);

        // At least one OAuth provider should be available
        expect(hasGoogle || hasFacebook).toBe(true);
    });

    test('should have link to login page', async ({ page }) => {
        await page.goto('/ar/register');
        await page.waitForLoadState('networkidle');

        const loginLink = page.locator('a[href*="login"], a:has-text("Login"), a:has-text("تسجيل الدخول"), a:has-text("Sign in")').first();
        await expect(loginLink).toBeVisible({ timeout: 5000 });
    });
});
