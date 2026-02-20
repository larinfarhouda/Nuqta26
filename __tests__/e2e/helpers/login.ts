import { Page, expect } from '@playwright/test';

/**
 * Shared login helper for E2E tests.
 * Handles locale-prefixed URLs, form waits, and redirect verification.
 * 
 * NOTE: After login, the app redirects based on role:
 * - vendor → /dashboard/vendor
 * - admin → /admin
 * - user → / (homepage!)
 */
export async function loginAsVendor(page: Page): Promise<boolean> {
    const email = process.env.TEST_VENDOR_EMAIL || '';
    const password = process.env.TEST_VENDOR_PASSWORD || '';

    if (!email || !password) {
        return false;
    }

    return login(page, email, password, 'vendor');
}

export async function loginAsUser(page: Page): Promise<boolean> {
    const email = process.env.TEST_USER_EMAIL || '';
    const password = process.env.TEST_USER_PASSWORD || '';

    if (!email || !password) {
        return false;
    }

    return login(page, email, password, 'user');
}

async function login(page: Page, email: string, password: string, role: 'vendor' | 'user'): Promise<boolean> {
    const response = await page.goto('/ar/login');

    // Skip if login page failed to load
    if (!response || response.status() >= 500) {
        return false;
    }

    // Wait for the login form to render (client component)
    try {
        await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    } catch {
        return false;
    }

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect based on role
    // Vendor → /dashboard/vendor, User → / (homepage)
    try {
        if (role === 'vendor') {
            await page.waitForURL('**/dashboard/**', { timeout: 30000 });
        } else {
            // User login redirects to homepage, not dashboard
            // Wait for the page to navigate away from login
            await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
        }
        return true;
    } catch {
        return false;
    }
}
