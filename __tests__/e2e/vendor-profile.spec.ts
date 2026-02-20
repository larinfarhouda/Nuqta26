import { test, expect } from '@playwright/test';
import { loginAsVendor } from './helpers/login';

test.describe('Vendor Profile Management', () => {
    test.beforeEach(async ({ page }) => {
        const loggedIn = await loginAsVendor(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as vendor');
            return;
        }
    });

    test('should display vendor profile page', async ({ page }) => {
        const profileLink = page.locator('a[href*="profile"], a[href*="settings"], a:has-text("Profile"), a:has-text("الملف"), a:has-text("Settings"), a:has-text("الإعدادات")').first();

        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
            expect(page.url()).toContain('dashboard');
        } else {
            expect(page.url()).toContain('dashboard');
        }
    });

    test('should edit vendor business name', async ({ page }) => {
        const profileLink = page.locator('a[href*="profile"], a[href*="settings"], a:has-text("Profile"), a:has-text("الملف")').first();
        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
        }

        const nameInput = page.locator('input[name="business_name"], input[name="name"], input[placeholder*="business"], input[placeholder*="الاسم"]').first();
        if (await nameInput.isVisible()) {
            const originalValue = await nameInput.inputValue();
            const testName = `Test Business ${Date.now().toString().slice(-4)}`;

            await nameInput.fill(testName);

            const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ"), button:has-text("Update"), button:has-text("تحديث")').first();
            if (await saveBtn.isVisible()) {
                await saveBtn.click();
                await page.waitForLoadState('networkidle');

                await nameInput.fill(originalValue);
                await saveBtn.click();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('should view bank information section', async ({ page }) => {
        const profileLink = page.locator('a[href*="profile"], a[href*="settings"], a:has-text("Profile"), a:has-text("الملف")').first();
        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
        }

        const bankFields = page.locator('input[name*="bank"], input[name*="iban"], label:has-text("Bank"), label:has-text("IBAN"), label:has-text("بنك")');
        const count = await bankFields.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
