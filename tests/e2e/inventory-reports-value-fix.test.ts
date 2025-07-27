import { test, expect } from '@playwright/test';

test.describe('Inventory Reports Value Field Fix', () => {
  test('should display proper currency values instead of NaN', async ({
    page,
  }) => {
    // Login as admin
    await page.goto('/test-data');
    await page.evaluate(() => {
      localStorage.setItem('test-user-email', 'admin@test.com');
      localStorage.setItem('test-user-status', 'APPROVED');
      localStorage.setItem('test-user-role', 'ADMIN');
    });

    // Navigate to inventory reports
    await page.goto('/inventory/reports');
    await expect(page).toHaveURL('/inventory/reports');

    // Wait for the page to load
    await page.waitForSelector('text=Current Stock Report', { timeout: 10000 });

    // Check that the value column doesn't contain NaN
    const valueCells = page.locator(
      '[data-testid="stockValue"], .text-right:has-text("₦")'
    );

    // Wait for the table to load
    await page.waitForTimeout(2000);

    // Get all value cells and check they don't contain NaN
    const valueTexts = await valueCells.allTextContents();

    for (const text of valueTexts) {
      expect(text).not.toContain('NaN');
      expect(text).not.toContain('#NaN');
      // Should contain currency symbol
      expect(text).toMatch(/₦[\d,]+\.?\d*/);
    }

    console.log(
      '✅ Value field displays proper currency values instead of NaN'
    );
  });
});
