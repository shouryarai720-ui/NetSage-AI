import { test, expect } from '@playwright/test';

test.describe('01 - Application Load & Startup Verification', () => {
  test('Application boots successfully with valid title, layout, and zero console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 1. Navigate to application root
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // 2. Verify Page Title
    await expect(page).toHaveTitle(/NetSage AI/i);

    // 3. Verify Header & Logo
    const headerLogo = page.locator('header').getByText(/NetSage/i).first();
    await expect(headerLogo).toBeVisible();

    // 4. Verify Enterprise Sidebar is visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('Overview')).toBeVisible();

    // 5. Verify Overview Dashboard rendered
    await expect(page.getByRole('heading', { name: /Turn Network Evidence Into/i })).toBeVisible();

    // 6. Verify zero critical console errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('websocket') &&
      !err.includes('Vite')
    );
    expect(criticalErrors).toEqual([]);

    // 7. Verify no failed critical API requests
    const criticalFailedRequests = failedRequests.filter(req => 
      !req.includes('favicon')
    );
    expect(criticalFailedRequests).toEqual([]);
  });
});
