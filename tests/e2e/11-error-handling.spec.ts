import { test, expect } from '@playwright/test';

test.describe('11 - Error Handling & Edge Case Resilience Verification', () => {
  test('Gracefully handles invalid inputs, non-existent cases, and malformed requests with friendly responses', async ({ request, page }) => {
    // 1. Test POST /api/diagnose-network with empty payload -> returns 400 with user-friendly error
    const emptyDiagRes = await request.post('/api/diagnose-network', {
      data: {}
    });
    expect(emptyDiagRes.status()).toBe(400);
    const emptyDiagJson = await emptyDiagRes.json();
    expect(emptyDiagJson.error).toBeTruthy();

    // 2. Test PUT /api/cases/:id with non-existent ID -> returns 404
    const notFoundCaseRes = await request.put('/api/cases/INVALID-999', {
      data: { status: 'Approved' }
    });
    expect(notFoundCaseRes.status()).toBe(404);

    // 3. Test POST /api/audit-logs with rejection decision but missing mandatory reason -> returns 400
    const invalidRejectAuditRes = await request.post('/api/audit-logs', {
      data: {
        actionType: "OPERATOR REJECT",
        targetNode: "SWITCH-01",
        message: "Rejected fix",
        humanDecision: "REJECTED"
        // missing reason
      }
    });
    expect(invalidRejectAuditRes.status()).toBe(400);
    const rejectErrJson = await invalidRejectAuditRes.json();
    expect(rejectErrJson.error).toContain('reason');

    // 4. Test UI Global Search Palette (Cmd+K) with non-matching query
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Control+k');
    
    const searchModal = page.getByPlaceholder(/Search cases by ID, title, problem, or hostname/i);
    if (await searchModal.isVisible()) {
      await searchModal.fill('NONEXISTENT_QUERY_12345');
      await expect(page.getByText(/No cases matching/i).or(page.getByText(/No matching cases found/i))).toBeVisible();
    }
  });
});
