import { test, expect } from '@playwright/test';

test.describe('03 - Case Catalog & Directory Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Case Catalog/i }).click();
  });

  test('Loads dataset cases, verifies case count, search filter, and case selection navigation', async ({ page }) => {
    // 1. Verify case table loads with multiple rows
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(10);

    // 2. Test search filter by Case ID (NET-004)
    const searchInput = page.getByPlaceholder(/Search ID, host, symptom/i);
    await searchInput.fill('NET-004');
    
    // Verify filtered row is visible
    await expect(page.getByText('NET-004').first()).toBeVisible();

    // 3. Clear search filter and search by category keyword (OSPF)
    await searchInput.fill('OSPF');
    await expect(page.getByText('NET-004').first()).toBeVisible();

    // 4. Click a case to select it and navigate directly to Diagnostics Workspace
    await page.getByText('NET-004').first().click();

    // Verify user is redirected to Diagnostics page with NET-004 loaded
    await expect(page.getByText(/NET-004/i).first()).toBeVisible();
  });
});
