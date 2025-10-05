// Playwright E2E test: login flow for admin user
// Requires Playwright to be installed (npm i -D @playwright/test)

import { test, expect } from '@playwright/test';

test('admin can log in', async ({ page }) => {
  // Change base URL if different
  await page.goto('http://localhost:5173/login');

  // Wait for login form (adjust selectors if needed)
  await page.waitForSelector('input[type="email"]');

  // For demonstration, plain values are fine, but avoid hardcoding real credentials.
  await page.fill('input[type="email"]', 'admin@ironhealth.com');
  await page.fill('input[type="password"]', 'Admin1234!');

  await page.click('button[type="submit"]');

  // Expect navigation to appointments or a success message
  await page.waitForURL('**/appointments', { timeout: 5000 });
  expect(page.url()).toContain('/appointments');
});
