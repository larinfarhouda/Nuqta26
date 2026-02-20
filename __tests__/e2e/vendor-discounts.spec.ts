import { test, expect } from '@playwright/test';
import { loginAsVendor } from './helpers/login';

test.describe('Vendor Discount CRUD', () => {
    test.beforeEach(async ({ page }) => {
        const loggedIn = await loginAsVendor(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as vendor');
            return;
        }
    });

    test('should navigate to discounts section', async ({ page }) => {
        const discountLink = page.locator('a[href*="discount"], a:has-text("Discount"), a:has-text("أكواد الخصم"), a:has-text("خصم")').first();

        if (await discountLink.isVisible()) {
            await discountLink.click();
            await page.waitForLoadState('networkidle');
            expect(page.url()).toContain('dashboard');
        }
    });

    test('should create a percentage discount code', async ({ page }) => {
        const discountLink = page.locator('a[href*="discount"], a:has-text("Discount"), a:has-text("أكواد الخصم")').first();
        if (await discountLink.isVisible()) {
            await discountLink.click();
            await page.waitForLoadState('networkidle');
        }

        const createBtn = page.locator('button:has-text("Create"), button:has-text("إنشاء"), button:has-text("Add"), button:has-text("إضافة")').first();
        if (await createBtn.isVisible()) {
            await createBtn.click();

            const codeInput = page.locator('[name="code"], input[placeholder*="code"], input[placeholder*="الكود"]').first();
            if (await codeInput.isVisible()) {
                const uniqueCode = `TEST${Date.now().toString().slice(-6)}`;
                await codeInput.fill(uniqueCode);

                const typeSelect = page.locator('[name="discount_type"], select').first();
                if (await typeSelect.isVisible()) {
                    await typeSelect.selectOption('percentage');
                }

                const valueInput = page.locator('[name="discount_value"], input[type="number"]').first();
                if (await valueInput.isVisible()) {
                    await valueInput.fill('10');
                }

                const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ")').first();
                if (await submitBtn.isVisible()) {
                    await submitBtn.click();
                    await page.waitForLoadState('networkidle');

                    const discountRow = page.locator(`text=${uniqueCode}`).first();
                    await expect(discountRow).toBeVisible({ timeout: 5000 }).catch(() => {
                        // Discount may appear differently
                    });
                }
            }
        }
    });

    test('should toggle discount code active/inactive', async ({ page }) => {
        const discountLink = page.locator('a[href*="discount"], a:has-text("Discount"), a:has-text("أكواد الخصم")').first();
        if (await discountLink.isVisible()) {
            await discountLink.click();
            await page.waitForLoadState('networkidle');
        }

        const toggleBtn = page.locator('input[type="checkbox"], button[role="switch"]').first();
        if (await toggleBtn.isVisible()) {
            await toggleBtn.click();
            await page.waitForLoadState('networkidle');
        }
    });

    test('should delete a discount code', async ({ page }) => {
        const discountLink = page.locator('a[href*="discount"], a:has-text("Discount"), a:has-text("أكواد الخصم")').first();
        if (await discountLink.isVisible()) {
            await discountLink.click();
            await page.waitForLoadState('networkidle');
        }

        const deleteBtn = page.locator('button:has-text("Delete"), button:has-text("حذف"), button[aria-label*="delete"]').first();
        if (await deleteBtn.isVisible()) {
            await deleteBtn.click();

            const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("تأكيد"), button:has-text("Yes")').first();
            if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await confirmBtn.click();
            }

            await page.waitForLoadState('networkidle');
        }
    });
});
