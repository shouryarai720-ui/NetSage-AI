import { test, expect } from '@playwright/test';

test.describe('10 - Responsible AI & Safety Framework Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Responsible AI & Safety/i }).click();
  });

  test('Displays comprehensive Responsible AI safety pillars, evidence grounding rules, and zero-hallucination policies', async ({ page }) => {
    // 1. Verify Page Heading
    await expect(page.getByRole('heading', { name: /Responsible AI & Human-in-the-Loop Governance/i })).toBeVisible();

    // 2. Verify Key Safety Framework Sections
    await expect(page.getByText(/AI Agreement/i).first()).toBeVisible();
    await expect(page.getByText(/Human Correction/i).first()).toBeVisible();
    await expect(page.getByText(/Documented Human Correction & Safety Gate Scenarios/i)).toBeVisible();
    await expect(page.getByText(/NET-014/i).first()).toBeVisible();
  });
});
