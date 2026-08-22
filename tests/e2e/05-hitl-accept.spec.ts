import { test, expect } from '@playwright/test';

test.describe('05 - Human-in-the-Loop ACCEPT Workflow Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Diagnostics Workspace/i }).click();
  });

  test('Operator accepts proposed AI remediation, updates state to Approved, and generates audit record', async ({ page }) => {
    // 1. Locate Approve button in Human Review Panel
    const approveBtn = page.getByRole('button', { name: /APPROVE & APPLY TO SIMULATION/i });
    await expect(approveBtn).toBeVisible();

    // 2. Click Approve
    await approveBtn.click();

    // 3. Verify status updates to APPROVED & SIMULATED
    await expect(page.getByText(/STATUS: APPROVED & SIMULATED/i)).toBeVisible();

    // 4. Verify Toast notification appears
    await expect(page.getByText(/approved & simulation committed/i).first()).toBeVisible();

    // 5. Navigate to Audit Trail and confirm acceptance entry exists
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Audit Trail & Chain/i }).click();

    await expect(page.getByRole('heading', { level: 1, name: /Immutable Audit Trail & Cryptographic Chain/i })).toBeVisible();
    await expect(page.getByText(/HUMAN GATE PASS/i).first()).toBeVisible();
    await expect(page.getByText(/NET-001/i).first()).toBeVisible();
  });
});
