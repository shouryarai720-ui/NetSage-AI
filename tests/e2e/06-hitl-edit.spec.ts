import { test, expect } from '@playwright/test';

test.describe('06 - Human-in-the-Loop EDIT Workflow Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Diagnostics Workspace/i }).click();
  });

  test('Operator edits proposed remediation, provides mandatory reason, commits override to ledger', async ({ page }) => {
    // 1. Click EDIT FIX button
    const editBtn = page.getByRole('button', { name: /EDIT FIX/i });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // 2. Verify Edit Fix Modal appears
    await expect(page.getByText(/HUMAN MODIFICATION OVERRIDE/i)).toBeVisible();
    await expect(page.getByText(/Original AI Proposal/i)).toBeVisible();

    // 3. Edit remediation commands
    const commandTextarea = page.getByPlaceholder(/Enter revised Cisco commands/i);
    await commandTextarea.fill('interface GigabitEthernet0/0/0.10\nno shutdown\ndescription Verified by Operator M. Zhao');

    // 4. Fill mandatory override reason
    const reasonTextarea = page.getByPlaceholder(/Added explicit MTU configuration/i);
    await reasonTextarea.fill('Added explicit description tag and interface scope for enterprise traceability.');

    // 5. Submit modified fix
    const submitBtn = page.getByRole('button', { name: /Commit Modified Fix to Ledger/i });
    await submitBtn.click();

    // 6. Verify modal closes and toast notification appears
    await expect(page.getByText(/HUMAN MODIFICATION OVERRIDE/i)).not.toBeVisible();
    await expect(page.getByText(/Edited remediation logged and simulated/i).first()).toBeVisible();

    // 7. Check Audit Trail to ensure EDITED entry was registered
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Audit Trail & Chain/i }).click();

    await expect(page.getByText(/OPERATOR OVERRIDE/i).first()).toBeVisible();
    await expect(page.getByText(/EDITED/i).first()).toBeVisible();
  });
});
