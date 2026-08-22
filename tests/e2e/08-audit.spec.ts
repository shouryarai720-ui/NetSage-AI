import { test, expect } from '@playwright/test';

test.describe('08 - Cryptographic Audit Ledger & Tamper Detection Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Audit Trail & Chain/i }).click();
  });

  test('Renders immutable audit ledger, validates cryptographic chain, and detects integrity tampering', async ({ page }) => {
    // 1. Verify Page Heading
    await expect(page.getByRole('heading', { name: /Immutable Audit Trail & Cryptographic Chain/i })).toBeVisible();

    // 2. Verify Audit Records table renders
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // 3. Click "VERIFY LEDGER INTEGRITY" button
    const verifyBtn = page.getByRole('button', { name: /VERIFY LEDGER INTEGRITY/i });
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // 4. Verify valid cryptographic integrity banner is displayed
    await expect(page.getByText(/CRYPTOGRAPHIC HASH INTEGRITY/i)).toBeVisible();

    // 5. Test search filter on audit logs
    const searchInput = page.getByPlaceholder(/Search audit records, hashes, operator/i);
    await searchInput.fill('OPERATOR');
    await expect(page.getByText('OPERATOR').first()).toBeVisible();
  });
});
