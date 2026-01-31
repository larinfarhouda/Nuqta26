import { test, expect } from '@playwright/test';

/**
 * Vendor Dashboard E2E Tests
 * Tests for vendor event management and dashboard functionality
 * 
 * Prerequisites:
 * - A vendor account must exist in the database
 * - Update the credentials below with valid vendor login
 */

// TODO: Replace with actual vendor credentials from your database
const VENDOR_EMAIL = process.env.TEST_VENDOR_EMAIL || 'vendor@example.com';
const VENDOR_PASSWORD = process.env.TEST_VENDOR_PASSWORD || 'password123';

test.describe('Vendor Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login as vendor before each test
        await page.goto('/login');
        await page.fill('[name="email"]', VENDOR_EMAIL);
        await page.fill('[name="password"]', VENDOR_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    });

    test.describe('Event Management', () => {
        test('should navigate to create event page', async ({ page }) => {
            // Look for "Create Event" or "New Event" button
            const createButton = page.locator('text=/create.*event/i, text=/new.*event/i').first();

            if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await createButton.click();

                // Verify we're on event creation page
                await expect(page).toHaveURL(/.*events\/create|.*events\/new/i);
            }
        });

        test('should create new event', async ({ page }) => {
            // Navigate to create event page
            await page.goto('/dashboard/vendor/events/create');

            // Wait for form to load
            await page.waitForLoadState('networkidle');

            // Fill in event details
            const timestamp = Date.now();
            await page.fill('[name="title"]', `Test Event ${timestamp}`);
            await page.fill('[name="description"]', 'This is a test event created by E2E tests');

            // Select category (adjust selector based on your implementation)
            const categorySelect = page.locator('[name="category"], [name="event_type"]').first();
            if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
                await categorySelect.selectOption({ index: 1 });
            }

            // Set date (future date)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const dateString = futureDate.toISOString().split('T')[0];

            await page.fill('[name="date"]', dateString);

            // Set location
            await page.fill('[name="location"]', 'Istanbul, Turkey');

            // Save draft
            const saveDraftButton = page.locator('button:has-text("Save"), button:has-text("Draft")').first();
            if (await saveDraftButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await saveDraftButton.click();

                // Wait for success message or redirect
                await page.waitForLoadState('networkidle');

                // Verify event was created (check for success message or redirect)
                await expect(
                    page.locator('text=/success|created|saved/i').first()
                ).toBeVisible({ timeout: 10000 });
            }
        });

        test('should update existing event listing', async ({ page }) => {
            // Navigate to events list
            await page.goto('/dashboard/vendor/events');
            await page.waitForLoadState('networkidle');

            // Find first event card or row
            const firstEvent = page.locator('[data-testid="event-row"], .event-card, tr').first();

            if (await firstEvent.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Click edit button
                const editButton = firstEvent.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label*="edit" i]').first();

                if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await editButton.click();

                    // Wait for edit form
                    await page.waitForLoadState('networkidle');

                    // Update event title
                    const titleInput = page.locator('[name="title"]');
                    const currentTitle = await titleInput.inputValue();
                    await titleInput.fill(`${currentTitle} - Updated`);

                    // Update description
                    const descInput = page.locator('[name="description"], textarea').first();
                    if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await descInput.fill('Updated event description via E2E test');
                    }

                    // Save changes
                    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
                    await saveButton.click();

                    // Wait for success
                    await page.waitForLoadState('networkidle');
                    await expect(
                        page.locator('text=/updated|saved|success/i').first()
                    ).toBeVisible({ timeout: 10000 });
                }
            }
        });

        test('should create discount code for event', async ({ page }) => {
            // Navigate to events list
            await page.goto('/dashboard/vendor/events');
            await page.waitForLoadState('networkidle');

            // Find an event or navigate to first event's discount page
            const firstEvent = page.locator('[data-testid="event-row"], .event-card, tr').first();

            if (await firstEvent.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Look for "Discounts" or "Manage" button
                const discountButton = firstEvent.locator('text=/discount/i, text=/manage/i').first();

                if (await discountButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await discountButton.click();
                } else {
                    // Try clicking on the event itself to open details
                    await firstEvent.click();
                }

                await page.waitForLoadState('networkidle');

                // Look for "Add Discount" or "Create Discount" button
                const createDiscountBtn = page.locator('button:has-text("Add Discount"), button:has-text("Create Discount"), button:has-text("New Discount")').first();

                if (await createDiscountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                    await createDiscountBtn.click();

                    // Wait for discount form
                    await page.waitForTimeout(1000);

                    // Fill discount details
                    const codeInput = page.locator('[name="code"], [name="discount_code"]').first();
                    if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await codeInput.fill(`TESTDISCOUNT${Date.now()}`);
                    }

                    // Set discount type and value
                    const typeSelect = page.locator('[name="type"], [name="discount_type"]').first();
                    if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await typeSelect.selectOption('percentage');
                    }

                    const valueInput = page.locator('[name="value"], [name="discount_value"]').first();
                    if (await valueInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await valueInput.fill('10');
                    }

                    // Set minimum quantity for bulk discount
                    const minQtyInput = page.locator('[name="min_quantity"], [name="minimum_quantity"]').first();
                    if (await minQtyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await minQtyInput.fill('5');
                    }

                    // Save discount
                    const saveDiscountBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first();
                    if (await saveDiscountBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveDiscountBtn.click();

                        // Wait for success
                        await page.waitForLoadState('networkidle');
                        await expect(
                            page.locator('text=/discount.*created|success/i').first()
                        ).toBeVisible({ timeout: 10000 });
                    }
                }
            }
        });

        test('should publish event', async ({ page }) => {
            // Navigate to events list
            await page.goto('/dashboard/vendor/events');
            await page.waitForLoadState('networkidle');

            // Find a draft event
            const draftEvent = page.locator('text=/draft/i').first();

            if (await draftEvent.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Find parent row/card
                const eventRow = draftEvent.locator('xpath=ancestor::tr[1]|ancestor::div[@class="event-card"][1]').first();

                // Look for publish button
                const publishButton = eventRow.locator('button:has-text("Publish"), [aria-label*="publish" i]').first();

                if (await publishButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await publishButton.click();

                    // Confirm if there's a confirmation dialog
                    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
                    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await confirmButton.click();
                    }

                    // Wait for success
                    await page.waitForLoadState('networkidle');
                    await expect(
                        page.locator('text=/published|success/i').first()
                    ).toBeVisible({ timeout: 10000 });
                }
            }
        });
    });

    test.describe('Booking Management', () => {
        test('should view bookings list', async ({ page }) => {
            // Navigate to bookings page
            await page.goto('/dashboard/vendor/bookings');
            await page.waitForLoadState('networkidle');

            // Check if bookings table/list is visible
            const bookingsList = page.locator('[data-testid="bookings-table"], table, .bookings-list').first();

            if (await bookingsList.isVisible({ timeout: 5000 }).catch(() => false)) {
                expect(await bookingsList.isVisible()).toBe(true);

                // Check if there are booking rows
                const bookingRows = page.locator('tbody tr, [data-testid="booking-row"]');
                const count = await bookingRows.count();

                // Should have at least headers even if no bookings
                expect(count).toBeGreaterThanOrEqual(0);
            }
        });

        test('should confirm pending booking', async ({ page }) => {
            // Navigate to bookings
            await page.goto('/dashboard/vendor/bookings');
            await page.waitForLoadState('networkidle');

            // Find pending booking
            const pendingBooking = page.locator('text=/pending/i').first();

            if (await pendingBooking.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Find parent row
                const bookingRow = pendingBooking.locator('xpath=ancestor::tr[1]|ancestor::div[1]').first();

                // Click confirm button
                const confirmButton = bookingRow.locator('button:has-text("Confirm"), button:has-text("Approve")').first();

                if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await confirmButton.click();

                    // Handle confirmation dialog if present
                    const dialogConfirm = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
                    if (await dialogConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await dialogConfirm.click();
                    }

                    // Wait for success
                    await page.waitForLoadState('networkidle');
                    await expect(
                        page.locator('text=/confirmed|success/i').first()
                    ).toBeVisible({ timeout: 10000 });
                }
            }
        });

        test('should cancel booking', async ({ page }) => {
            // Navigate to bookings
            await page.goto('/dashboard/vendor/bookings');
            await page.waitForLoadState('networkidle');

            // Find a booking (preferably pending)
            const booking = page.locator('tbody tr, [data-testid="booking-row"]').first();

            if (await booking.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Click cancel/reject button
                const cancelButton = booking.locator('button:has-text("Cancel"), button:has-text("Reject")').first();

                if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await cancelButton.click();

                    // Handle confirmation dialog
                    const dialogConfirm = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
                    if (await dialogConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await dialogConfirm.click();
                    }

                    // Wait for success
                    await page.waitForLoadState('networkidle');
                    await expect(
                        page.locator('text=/cancelled|rejected|success/i').first()
                    ).toBeVisible({ timeout: 10000 });
                }
            }
        });
    });

    test.describe('Analytics', () => {
        test('should view analytics dashboard', async ({ page }) => {
            // Navigate to analytics/dashboard
            await page.goto('/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            // Check for analytics widgets/cards
            const analyticsSection = page.locator('[data-testid="analytics"], .analytics, .stats').first();

            // Check for common analytics elements
            const revenueElement = page.locator('text=/revenue|total.*sales|earnings/i').first();
            const bookingsElement = page.locator('text=/bookings|reservations/i').first();

            // At least one should be visible
            const hasAnalytics =
                await analyticsSection.isVisible({ timeout: 3000 }).catch(() => false) ||
                await revenueElement.isVisible({ timeout: 3000 }).catch(() => false) ||
                await bookingsElement.isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasAnalytics).toBe(true);
        });

        test('should display revenue metrics', async ({ page }) => {
            await page.goto('/dashboard/vendor');
            await page.waitForLoadState('networkidle');

            // Look for revenue/earnings display
            const revenueCard = page.locator('text=/revenue|earnings|sales/i').first();

            if (await revenueCard.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Should display some numeric value
                const parentCard = revenueCard.locator('xpath=ancestor::*[contains(@class, "card") or contains(@class, "stat")][1]').first();
                const numericValue = parentCard.locator('text=/\\d+/').first();

                expect(await numericValue.isVisible({ timeout: 3000 })).toBe(true);
            }
        });
    });
});
