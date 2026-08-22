import { test, expect } from '@playwright/test';

test.describe('04 - Complete Diagnostic Workflow & Grounding Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Diagnostics Workspace/i }).click();
  });

  test('Executes end-to-end diagnostic workflow: rule engine, evidence grounding, structured AI output, and OSI layer detection', async ({ page }) => {
    // 1. Verify Active Case Incident Header
    await expect(page.getByText(/Observed Incident Symptom/i)).toBeVisible();
    await expect(page.getByText(/NET-001/i).first()).toBeVisible();

    // 2. Verify Cisco CLI Terminal Evidence is rendered
    await expect(page.getByText(/show ip interface brief/i).first()).toBeVisible();

    // 3. Verify Deterministic Rule Check Panel executes and shows results
    await expect(page.getByText(/RC-01/i).first()).toBeVisible();

    // 4. Verify AI Diagnosis Structured Output Card
    await expect(page.getByText(/OSI Layer/i).first()).toBeVisible();
    await expect(page.getByText(/Confidence/i).first()).toBeVisible();

    // 5. Verify Remediation Commands Preview Box
    await expect(page.getByText(/QUEUED REMEDIATION COMMANDS/i)).toBeVisible();
    await expect(page.getByText(/configure terminal/i).first()).toBeVisible();
    await expect(page.getByText(/no shutdown/i).first()).toBeVisible();

    // 6. Select another case from the Case Explorer (e.g. NET-002 or NET-003)
    const explorer = page.locator('text=NET-002').first();
    if (await explorer.isVisible()) {
      await explorer.click();
      await expect(page.getByText(/NET-002/i).first()).toBeVisible();
    }
  });
});
