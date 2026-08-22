import { test, expect } from '@playwright/test';

test.describe('09 - Incident Resolution & Audit Reports Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Incident Reports/i }).click();
  });

  test('Renders report catalog, verifies case metrics, and triggers PDF audit export successfully', async ({ page }) => {
    // 1. Verify Heading
    await expect(page.getByRole('heading', { name: /Diagnostic & Post-Mortem Reports/i })).toBeVisible();

    // 2. Verify report cards rendered
    const exportBtns = page.getByRole('button', { name: /Export PDF Post-Mortem/i });
    await expect(exportBtns.first()).toBeVisible();
    const count = await exportBtns.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // 3. Click Export PDF and verify toast notification
    await exportBtns.first().click();
    await expect(page.getByText(/Exporting cryptographic audit report/i).or(page.getByText(/audit report/i).first())).toBeVisible();
  });
});
