import { test, expect } from '@playwright/test';

/**
 * Venue Claim Flow E2E Tests
 * Tests the /claim/[slug] page for venue claiming
 */
test.describe('Venue Claim Flow', () => {
    test('should return 404 for non-existent claim token', async ({ page }) => {
        const response = await page.goto('/claim/non-existent-claim-token');
        await page.waitForLoadState('networkidle');

        const status = response?.status() || 0;
        const is404 = status === 404;
        const hasNotFound = await page.locator('text=/not found|404|غير موجود/i').first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(is404 || hasNotFound).toBe(true);
    });

    test('should not crash for invalid claim slug', async ({ page }) => {
        const response = await page.goto('/claim/abc123');
        await page.waitForLoadState('networkidle');

        // Should return 404, not 500
        const status = response?.status() || 0;
        expect(status).toBeLessThan(500);
    });
});
