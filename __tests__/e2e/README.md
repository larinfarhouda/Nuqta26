# E2E Testing Guide

## Quick Start

### 1. Install Playwright Browsers

```bash
npx playwright install
```

### 2. Set Up Test Credentials

Create a `.env.local` file (or add to existing) with your test credentials:

```bash
# Vendor credentials for E2E tests
TEST_VENDOR_EMAIL=your-vendor@example.com
TEST_VENDOR_PASSWORD=your-password

# User credentials for E2E tests  
TEST_USER_EMAIL=your-user@example.com
TEST_USER_PASSWORD=your-password
```

> ⚠️ **Important**: Use real credentials from your current database since we're in testing phase.

### 3. Run E2E Tests

```bash
# Run with browser visible (recommended for first time)
npm run test:e2e:headed

# Run in interactive UI mode
npm run test:e2e:ui

# Run headless (for CI/CD)
npm run test:e2e

# Debug mode (step through tests)
npm run test:e2e:debug
```

## Available Test Suites

### Homepage Tests (`homepage.spec.ts`)
- ✅ Homepage loads successfully
- ✅ Navigation menu is functional
- ✅ Event search works
- ✅ Mobile responsive design
- ✅ Basic accessibility checks

### Vendor Dashboard Tests (`vendor-dashboard.spec.ts`)
- ✅ Create new event
- ✅ **Update existing event listing**
- ✅ **Create discount codes (bulk discounts)**
- ✅ Publish event
- ✅ View bookings list
- ✅ Confirm/cancel bookings
- ✅ View analytics dashboard

## Test Configuration

Tests use environment variables for credentials. You can also set them directly in your shell:

```bash
TEST_VENDOR_EMAIL=vendor@test.com TEST_VENDOR_PASSWORD=pass123 npm run test:e2e:headed
```

## Writing New Tests

Create new test files in `__tests__/e2e/`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Tips

- **Use `data-testid` attributes** in your components for stable selectors
- **Wait for network idle** when testing dynamic content: `await page.waitForLoadState('networkidle')`
- **Take screenshots on failure** (automatic in config)
- **Use `.first()` or `.nth(0)`** when selecting from multiple elements
- **Handle optional elements** with `.catch(() => false)` to avoid test failures

## Debugging

```bash
# Open Playwright Inspector
npm run test:e2e:debug

# View test report after running
npm run test:e2e:report

# Run specific test file
npx playwright test homepage.spec.ts

# Run tests matching a title
npx playwright test -g "should create new event"
```

## CI/CD Integration

Tests will run automatically in the configured web server. See `playwright.config.ts`:

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

## Troubleshooting

**Problem**: Tests can't find elements  
**Solution**: Check if selectors match your actual HTML. Use `page.pause()` to inspect.

**Problem**: Authentication fails  
**Solution**: Verify credentials in `.env.local` are correct.

**Problem**: Tests are slow  
**Solution**: Use `test.skip()` to skip tests temporarily, or run specific files.

**Problem**: Flaky tests  
**Solution**: Add proper waits with `waitForLoadState`, `waitForSelector`, etc.

## Next Steps

- Add more test coverage for user booking flows
- Add tests for payment upload
- Add tests for favorites functionality
- Set up visual regression testing
