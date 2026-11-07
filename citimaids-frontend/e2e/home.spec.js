import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('CitiMaids Public Portal E2E & Accessibility', () => {
  test('loads home page, displays brand header, and navigates to services page', async ({ page }) => {
    // 1. Visit Home Page
    await page.goto('/');

    // 2. Verify page title is set
    await expect(page).toHaveTitle(/Cleaning Services|CitiMaids/i);

    // 3. Verify main header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // 4. Click direct Services navigation link (avoiding logo text match)
    const servicesLink = page.locator('a[href="/services"]').first();
    await servicesLink.click();

    // 5. Verify URL transitioned to /services
    await expect(page).toHaveURL(/.*services/);
  });

  test('runs automated accessibility audit on the landing page', async ({ page }) => {
    await page.goto('/');

    // Run axe accessibility analysis
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Assert there are zero critical accessibility violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical'
    );
    expect(criticalViolations).toEqual([]);
  });
});
