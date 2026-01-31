import { test, expect } from '@playwright/test';

/**
 * DEBUG: Vendor Login Test
 * Simple test to verify vendor credentials work
 */

test('DEBUG: Verify vendor credentials', async ({ page }) => {
    // Get credentials from env
    const vendorEmail = process.env.TEST_VENDOR_EMAIL;
    const vendorPassword = process.env.TEST_VENDOR_PASSWORD;

    console.log('Testing with credentials:', {
        email: vendorEmail,
        hasPassword: !!vendorPassword
    });

    if (!vendorEmail || !vendorPassword) {
        throw new Error('TEST_VENDOR_EMAIL or TEST_VENDOR_PASSWORD not set in .env.local');
    }

    // Navigate to vendor login
    await page.goto('/login/vendor');

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/debug-login-page.png', fullPage: true });

    // Fill in credentials
    await page.fill('input[type="email"], input[name="email"]', vendorEmail);
    await page.fill('input[type="password"], input[name="password"]', vendorPassword);

    // Take screenshot before submit
    await page.screenshot({ path: 'test-results/debug-before-submit.png', fullPage: true });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait a bit
    await page.waitForTimeout(3000);

    // Take screenshot after submit
    await page.screenshot({ path: 'test-results/debug-after-submit.png', fullPage: true });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Check if there's an error message
    const errorMessage = await page.locator('text=/خاطئ|incorrect|invalid|error/i').textContent().catch(() => null);
    if (errorMessage) {
        console.log('Error message found:', errorMessage);
    }

    // Print page title
    console.log('Page title:', await page.title());
});
