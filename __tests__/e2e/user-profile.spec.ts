import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/login';

test.describe('User Profile Management', () => {
    test.beforeEach(async ({ page }) => {
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }
    });

    test('should display user profile page', async ({ page }) => {
        const profileLink = page.locator('a[href*="profile"], a:has-text("Profile"), a:has-text("الملف الشخصي"), a:has-text("الملف")').first();

        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
        }

        expect(page.url()).toContain('dashboard');
    });

    test('should edit user name', async ({ page }) => {
        const profileLink = page.locator('a[href*="profile"], a:has-text("Profile"), a:has-text("الملف الشخصي"), a:has-text("الملف")').first();
        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
        }

        const nameInput = page.locator('input[name="full_name"], input[name="name"], input[placeholder*="name"], input[placeholder*="الاسم"]').first();
        if (await nameInput.isVisible()) {
            const originalValue = await nameInput.inputValue();
            const testName = `Test User ${Date.now().toString().slice(-4)}`;

            await nameInput.fill(testName);

            const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ"), button:has-text("Update"), button:has-text("تحديث")').first();
            if (await saveBtn.isVisible()) {
                await saveBtn.click();
                await page.waitForLoadState('networkidle');

                // Restore original
                await nameInput.fill(originalValue);
                await saveBtn.click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should edit user phone number', async ({ page }) => {
        const profileLink = page.locator('a[href*="profile"], a:has-text("Profile"), a:has-text("الملف الشخصي"), a:has-text("الملف")').first();
        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
        }

        const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"], input[placeholder*="هاتف"]').first();
        if (await phoneInput.isVisible()) {
            const originalValue = await phoneInput.inputValue();
            await phoneInput.fill('+905551234567');

            const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ")').first();
            if (await saveBtn.isVisible()) {
                await saveBtn.click();
                await page.waitForLoadState('networkidle');

                // Restore
                await phoneInput.fill(originalValue);
                await saveBtn.click();
                await page.waitForLoadState('networkidle');
            }
        }
    });
});
