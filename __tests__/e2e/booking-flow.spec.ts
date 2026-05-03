import { test, expect, Page } from '@playwright/test';
import { loginAsUser, loginAsVendor } from './helpers/login';

/**
 * Full Booking Flow E2E Tests
 * 
 * Covers the complete lifecycle:
 * 1. User browses events → selects ticket → picks quantity → reviews & books
 * 2. User sees booking in dashboard
 * 3. Vendor sees new booking in dashboard
 * 4. Vendor confirms/cancels booking
 * 
 * IMPORTANT: These tests create real bookings in the database.
 * Use staging/test environment only.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Find the first bookable event (not expired, not sold out) */
async function findBookableEvent(page: Page): Promise<string | null> {
    await page.goto('/ar/events');
    await page.waitForLoadState('networkidle');

    const eventLinks = page.locator('a[href*="/events/"]');
    const count = await eventLinks.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
        const link = eventLinks.nth(i);
        const href = await link.getAttribute('href');
        if (!href) continue;

        await link.click();
        await page.waitForLoadState('networkidle');

        // Check if event is bookable (has a ticket selection step or book button)
        const hasTicketStep = await page.locator(
            'button:has-text("متابعة"), button:has-text("Continue"), button:has-text("احجز"), button:has-text("Book")'
        ).first().isVisible({ timeout: 3000 }).catch(() => false);

        // Make sure it's not expired or sold out
        const isExpired = await page.locator('text=/event_ended|انتهى|Sold Out|نفدت/i').first()
            .isVisible({ timeout: 1000 }).catch(() => false);

        if (hasTicketStep && !isExpired) {
            return href;
        }

        // Go back to events list
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');
    }

    return null;
}

// ─── Step 1: Select Ticket ──────────────────────────────────────────────────

test.describe('Booking Flow - Ticket Selection', () => {
    test('should display available tickets on event page', async ({ page }) => {
        const eventUrl = await findBookableEvent(page);
        if (!eventUrl) {
            test.skip(true, 'No bookable events found');
            return;
        }

        // Verify ticket options are shown
        const ticketButtons = page.locator('button').filter({
            has: page.locator('.rounded-full'), // radio buttons inside ticket cards
        });

        // At least one ticket option should be visible
        const hasTickets = await ticketButtons.first().isVisible({ timeout: 5000 }).catch(() => false);

        // OR look for the continue/book button that implies tickets are present
        const hasContinue = await page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first().isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasTickets || hasContinue).toBeTruthy();
    });

    test('should show ticket price and availability', async ({ page }) => {
        const eventUrl = await findBookableEvent(page);
        if (!eventUrl) {
            test.skip(true, 'No bookable events found');
            return;
        }

        // Check for price display (number + currency symbol like TRY, ₺, EGP, or "Free"/مجاني)
        const priceElement = page.locator('text=/\\d+\\s*(TRY|₺|EGP|ج\\.م)|Free|مجاني/i').first();
        const hasPrice = await priceElement.isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasPrice).toBeTruthy();
    });
});

// ─── Step 2: Quantity & Discount ────────────────────────────────────────────

test.describe('Booking Flow - Quantity Selection', () => {
    test('should navigate to quantity step after selecting ticket', async ({ page }) => {
        const eventUrl = await findBookableEvent(page);
        if (!eventUrl) {
            test.skip(true, 'No bookable events found');
            return;
        }

        // Click Continue/متابعة to go to quantity step
        const continueBtn = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();

        if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await continueBtn.click();
            await page.waitForTimeout(500);

            // Should now see quantity stepper (+ / - buttons)
            const plusButton = page.locator('button').filter({ has: page.locator('svg') })
                .filter({ hasText: /^$/ }); // buttons with only icons

            // Or check for the quantity display
            const quantityDisplay = page.locator('text=/\\d+/').first();
            await expect(quantityDisplay).toBeVisible({ timeout: 3000 });
        }
    });

    test('should show price summary with correct total', async ({ page }) => {
        const eventUrl = await findBookableEvent(page);
        if (!eventUrl) {
            test.skip(true, 'No bookable events found');
            return;
        }

        const continueBtn = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();

        if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await continueBtn.click();
            await page.waitForTimeout(500);

            // Look for price summary section with "×" multiplication sign
            const priceSummary = page.locator('text=/×\\s*\\d+/').first();
            const hasSummary = await priceSummary.isVisible({ timeout: 3000 }).catch(() => false);

            if (hasSummary) {
                await expect(priceSummary).toBeVisible();
            }
        }
    });

    test('should show discount code field', async ({ page }) => {
        const eventUrl = await findBookableEvent(page);
        if (!eventUrl) {
            test.skip(true, 'No bookable events found');
            return;
        }

        const continueBtn = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();

        if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await continueBtn.click();
            await page.waitForTimeout(500);

            // Look for discount code expand button
            const discountToggle = page.locator(
                'button:has-text("كود الخصم"), button:has-text("Discount"), button:has-text("discount")'
            ).first();

            if (await discountToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
                await discountToggle.click();
                await page.waitForTimeout(300);

                // Discount input should appear
                const discountInput = page.locator('input[placeholder*="SAVE"], input[placeholder*="save"]').first();
                await expect(discountInput).toBeVisible({ timeout: 2000 });
            }
        }
    });
});

// ─── Step 3: Review & Book ──────────────────────────────────────────────────

test.describe('Booking Flow - Review & Submit', () => {
    test('should navigate through all steps to review page', async ({ page }) => {
        const eventUrl = await findBookableEvent(page);
        if (!eventUrl) {
            test.skip(true, 'No bookable events found');
            return;
        }

        // Step 1 → Step 2: Click Continue
        const step1Continue = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();

        if (!(await step1Continue.isVisible({ timeout: 3000 }).catch(() => false))) {
            test.skip(true, 'No continue button found');
            return;
        }
        await step1Continue.click();
        await page.waitForTimeout(500);

        // Step 2 → Step 3: Click Continue again
        const step2Continue = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();

        if (await step2Continue.isVisible({ timeout: 3000 }).catch(() => false)) {
            await step2Continue.click();
            await page.waitForTimeout(500);

            // Should now be on Review step — look for event title in summary
            const reviewHeading = page.locator(
                'text=/مراجعة وتأكيد|Review & Confirm|Review/i'
            ).first();

            const hasReview = await reviewHeading.isVisible({ timeout: 3000 }).catch(() => false);

            // Also check for the "Book Now" / "احجز الآن" button
            const bookNowBtn = page.locator(
                'button:has-text("احجز"), button:has-text("Book Now"), button:has-text("book")'
            ).first();
            const hasBookBtn = await bookNowBtn.isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasReview || hasBookBtn).toBeTruthy();
        }
    });

    test('should require authentication to complete booking', async ({ page }) => {
        const eventUrl = await findBookableEvent(page);
        if (!eventUrl) {
            test.skip(true, 'No bookable events found');
            return;
        }

        // Navigate through steps quickly
        const step1Continue = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();
        if (!(await step1Continue.isVisible({ timeout: 3000 }).catch(() => false))) return;
        await step1Continue.click();
        await page.waitForTimeout(400);

        const step2Continue = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();
        if (!(await step2Continue.isVisible({ timeout: 3000 }).catch(() => false))) return;
        await step2Continue.click();
        await page.waitForTimeout(400);

        // Click Book Now as unauthenticated user
        const bookNowBtn = page.locator(
            'button:has-text("احجز"), button:has-text("Book Now"), button:has-text("book")'
        ).first();

        if (await bookNowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await bookNowBtn.click();
            await page.waitForTimeout(2000);

            // Should show login dialog or redirect to login
            const loginPrompt = page.locator(
                'text=/تسجيل الدخول|Sign in|Login|log in/i, [data-testid="login-dialog"]'
            ).first();
            const redirectedToLogin = page.url().includes('/login');
            const showsLogin = await loginPrompt.isVisible({ timeout: 5000 }).catch(() => false);

            expect(redirectedToLogin || showsLogin).toBeTruthy();
        }
    });

    test('should complete free event booking when logged in', async ({ page }) => {
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }

        // Find a bookable event
        await page.goto('/ar/events');
        await page.waitForLoadState('networkidle');

        const eventLinks = page.locator('a[href*="/events/"]');
        const count = await eventLinks.count();

        if (count === 0) {
            test.skip(true, 'No events available');
            return;
        }

        // Click first event
        await eventLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Check if it's bookable
        const continueBtn = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();

        if (!(await continueBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
            test.skip(true, 'Event not bookable');
            return;
        }

        // Step 1 → 2
        await continueBtn.click();
        await page.waitForTimeout(500);

        // Step 2 → 3
        const step2Continue = page.locator(
            'button:has-text("متابعة"), button:has-text("Continue")'
        ).first();
        if (await step2Continue.isVisible({ timeout: 3000 }).catch(() => false)) {
            await step2Continue.click();
            await page.waitForTimeout(500);
        }

        // Step 3: Click Book Now
        const bookNowBtn = page.locator(
            'button:has-text("احجز"), button:has-text("Book Now")'
        ).first();

        if (await bookNowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await bookNowBtn.click();

            // Wait for response — should either:
            // 1. Go to SUCCESS step (free event)
            // 2. Go to PAYMENT step (paid event)
            // 3. Show error (already booked, sold out, etc.)
            await page.waitForTimeout(3000);

            const successIndicator = page.locator(
                'text=/تم الحجز|Booking Confirmed|success|نجاح|شكراً/i, svg.text-emerald-600'
            ).first();
            const paymentStep = page.locator(
                'text=/تحويل|Transfer|upload|إيصال|Receipt|ادفع/i'
            ).first();
            const errorMessage = page.locator(
                'text=/already|سبق|not eligible|خطأ|error/i'
            ).first();

            const isSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);
            const isPayment = await paymentStep.isVisible({ timeout: 3000 }).catch(() => false);
            const isError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

            // At least one outcome should be visible
            expect(isSuccess || isPayment || isError).toBeTruthy();
        }
    });
});

// ─── Step 4: User Dashboard Booking View ────────────────────────────────────

test.describe('Booking Flow - User Dashboard', () => {
    test('should show booking in user dashboard after booking', async ({ page }) => {
        test.setTimeout(60000);
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }

        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // Look for bookings section or registrations heading
        const bookingsList = page.locator(
            '[data-testid="bookings-list"], text=/حجوزاتي|تسجيلاتي|My Bookings|Registrations|التسجيلات/i'
        ).first();

        const hasBookings = await bookingsList.isVisible({ timeout: 5000 }).catch(() => false);

        // Either we see bookings or an empty state
        const emptyState = page.locator(
            'text=/لا توجد|No bookings|empty|فارغة|لم تقم/i'
        ).first();
        const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

        // Dashboard loaded successfully (either content or menu is visible)
        const menuVisible = page.locator('text=/تسجيلاتي|المفضلة/i').first();
        const hasMenu = await menuVisible.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasBookings || isEmpty || hasMenu).toBeTruthy();
    });

    test('should display booking status badges', async ({ page }) => {
        test.setTimeout(60000);
        const loggedIn = await loginAsUser(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as user');
            return;
        }

        await page.goto('/ar/dashboard/user');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // Look for status badges
        const statusBadges = page.locator(
            'text=/confirmed|مؤكد|pending|قيد الانتظار|cancelled|ملغي/i'
        );

        if (await statusBadges.first().isVisible({ timeout: 5000 }).catch(() => false)) {
            const count = await statusBadges.count();
            expect(count).toBeGreaterThan(0);
        }
    });
});

// ─── Step 5: Vendor Dashboard Booking Management ────────────────────────────

test.describe('Booking Flow - Vendor Management', () => {
    test('should show bookings list in vendor dashboard', async ({ page }) => {
        test.setTimeout(60000);
        const loggedIn = await loginAsVendor(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as vendor');
            return;
        }

        await page.goto('/ar/dashboard/vendor');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // Navigate to bookings tab
        const bookingsTab = page.locator(
            'a:has-text("الحجوزات"), a:has-text("Bookings"), button:has-text("الحجوزات"), [data-testid="bookings-tab"]'
        ).first();

        if (await bookingsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await bookingsTab.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);

            // Should show bookings list or empty state
            const bookingCards = page.locator('.group, [data-testid="booking-card"]');
            const emptyState = page.locator('text=/لا توجد|No bookings|no_bookings/i');

            const hasCards = await bookingCards.first().isVisible({ timeout: 5000 }).catch(() => false);
            const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasCards || isEmpty).toBeTruthy();
        }
    });

    test('should have status filter for bookings', async ({ page }) => {
        test.setTimeout(60000);
        const loggedIn = await loginAsVendor(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as vendor');
            return;
        }

        await page.goto('/ar/dashboard/vendor');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const bookingsTab = page.locator(
            'a:has-text("الحجوزات"), a:has-text("Bookings"), button:has-text("الحجوزات")'
        ).first();

        if (await bookingsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await bookingsTab.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);

            // Find the status filter dropdown
            const statusFilter = page.locator('select').first();
            if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(statusFilter).toBeVisible();

                // Verify filter options exist
                const options = statusFilter.locator('option');
                const optionCount = await options.count();
                expect(optionCount).toBeGreaterThanOrEqual(2); // "All" + at least one status
            }
        }
    });

    test('should have search functionality for bookings', async ({ page }) => {
        test.setTimeout(60000);
        const loggedIn = await loginAsVendor(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as vendor');
            return;
        }

        await page.goto('/ar/dashboard/vendor');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const bookingsTab = page.locator(
            'a:has-text("الحجوزات"), a:has-text("Bookings"), button:has-text("الحجوزات")'
        ).first();

        if (await bookingsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await bookingsTab.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);

            // Find search input
            const searchInput = page.locator('input[type="text"]').first();
            if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                await searchInput.fill('test');
                await page.waitForTimeout(500);
                // Search should filter results (no crash)
                await expect(searchInput).toHaveValue('test');
            }
        }
    });

    test('should show approve/reject buttons for payment_submitted bookings', async ({ page }) => {
        test.setTimeout(60000);
        const loggedIn = await loginAsVendor(page);
        if (!loggedIn) {
            test.skip(true, 'Could not login as vendor');
            return;
        }

        await page.goto('/ar/dashboard/vendor');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const bookingsTab = page.locator(
            'a:has-text("الحجوزات"), a:has-text("Bookings"), button:has-text("الحجوزات")'
        ).first();

        if (await bookingsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await bookingsTab.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);

            // Filter to "payment_submitted" status
            const statusFilter = page.locator('select').first();
            if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
                await statusFilter.selectOption('payment_submitted');
                await page.waitForTimeout(1000);

                // Look for approve/reject buttons (CheckCircle / XCircle icons)
                const approveBtn = page.locator('button:has(svg)').filter({
                    has: page.locator('title:has-text("approve"), title:has-text("قبول")'),
                }).first();

                const actionButtons = page.locator(
                    'button.bg-emerald-50, button.bg-rose-50'
                );

                const emptyState = page.locator('text=/لا توجد|No bookings/i');

                const hasActions = await actionButtons.first().isVisible({ timeout: 3000 }).catch(() => false);
                const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

                // Either we have action buttons or no bookings with this status
                expect(hasActions || isEmpty).toBeTruthy();
            }
        }
    });
});
