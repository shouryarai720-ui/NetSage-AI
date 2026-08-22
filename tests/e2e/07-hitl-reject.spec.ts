import { test, expect } from '@playwright/test';

test.describe('07 - Human-in-the-Loop REJECT Workflow & Safety Gate Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Diagnostics Workspace/i }).click();
  });

  test('Rejection requires mandatory reason, blocks empty submissions, updates UI to rejected, and records audit entry', async ({ page }) => {
    // 1. Click REJECT button
    const rejectBtn = page.getByRole('button', { name: /REJECT/i }).first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // 2. Verify Reject Modal appears
    await expect(page.getByText(/REJECT AI RECOMMENDATION/i)).toBeVisible();

    // 3. Attempt to submit with empty rejection reason -> Must be blocked
    const confirmBtn = page.getByRole('button', { name: /Confirm Rejection & Log/i });
    await confirmBtn.click();

    // Verify validation error is displayed
    await expect(page.getByText(/A valid engineering reason is strictly mandatory/i)).toBeVisible();
    // Verify modal is still open
    await expect(page.getByText(/REJECT AI RECOMMENDATION/i)).toBeVisible();

    // 4. Enter valid engineering reason
    const reasonTextarea = page.getByPlaceholder(/e\.g\., AI misdiagnosed/i);
    await reasonTextarea.fill('AI proposal does not address underlying physical carrier defect. Physical line repair scheduled.');

    // 5. Submit valid rejection
    await confirmBtn.click();

    // 6. Verify modal closes
    await expect(page.getByText(/REJECT AI RECOMMENDATION/i)).not.toBeVisible();

    // 7. Verify UI updates to REJECTED BY OPERATOR
    await expect(page.getByText(/STATUS: REJECTED BY OPERATOR/i)).toBeVisible();

    // 8. Check Audit Trail to ensure REJECTED entry was registered
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Audit Trail & Chain/i }).click();

    await expect(page.getByText(/OPERATOR REJECT/i).first()).toBeVisible();
    await expect(page.getByText(/NET-001/i).first()).toBeVisible();
  });
});
