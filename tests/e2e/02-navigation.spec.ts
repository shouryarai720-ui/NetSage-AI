import { test, expect } from '@playwright/test';

test.describe('02 - Navigation & Workspace Routing Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  });

  test('Navigates across all enterprise NOC workspace sections seamlessly without crashing', async ({ page }) => {
    const sidebar = page.locator('aside');

    // 1. Overview Page
    await sidebar.getByRole('button', { name: /Overview/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Turn Network Evidence Into/i })).toBeVisible();

    // 2. Diagnostics Workspace
    await sidebar.getByRole('button', { name: /Diagnostics Workspace/i }).click();
    await expect(page.getByText(/Human-in-the-Loop Decision Gate/i)).toBeVisible();
    await expect(page.getByText(/QUEUED REMEDIATION COMMANDS/i)).toBeVisible();

    // 3. Case Catalog
    await sidebar.getByRole('button', { name: /Case Catalog/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Authoritative Diagnostic Cases/i })).toBeVisible();

    // 4. Network Lab Map
    await sidebar.getByRole('button', { name: /Network Lab Map/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Network Topology & Packet Tracer Visualizer/i })).toBeVisible();

    // 5. AI Diagnostic Insights
    await sidebar.getByRole('button', { name: /AI Diagnostic Insights/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /AI Model Diagnostics & Grounding Insights/i })).toBeVisible();

    // 6. Responsible AI & Safety
    await sidebar.getByRole('button', { name: /Responsible AI & Safety/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Responsible AI & Human-in-the-Loop Governance/i })).toBeVisible();

    // 7. Audit Trail & Chain
    await sidebar.getByRole('button', { name: /Audit Trail & Chain/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Immutable Audit Trail & Cryptographic Chain/i })).toBeVisible();

    // 8. Incident Reports
    await sidebar.getByRole('button', { name: /Incident Reports/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Diagnostic & Post-Mortem Reports/i })).toBeVisible();

    // 9. Test & Verification Center
    await sidebar.getByRole('button', { name: /Test & Verification/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Compliance & Diagnostic Test Center/i })).toBeVisible();

    // 10. Platform Settings - scroll the sidebar container directly to the bottom
    await sidebar.locator('.overflow-y-auto').evaluate(node => node.scrollTop = node.scrollHeight);
    await page.waitForTimeout(300);
    const settingsButton = sidebar.getByRole('button', { name: /Platform Settings/i });
    await settingsButton.click();
    await expect(page.getByRole('heading', { level: 1, name: /System Configuration & Operational Policies/i })).toBeVisible();
    await expect(page.getByText(/SAFE SIMULATION MODE/i)).toBeVisible();
  });
});
