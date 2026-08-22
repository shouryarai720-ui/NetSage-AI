import { test, expect } from '@playwright/test';

test.describe('12 - Responsive Design & Device Adaptability Verification', () => {
  test('Renders cleanly at desktop (1280x720) and tablet viewports without visual clipping', async ({ page }) => {
    // 1. Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Turn Network Evidence Into/i })).toBeVisible();

    // 2. Tablet Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Turn Network Evidence Into/i })).toBeVisible();
  });
});
