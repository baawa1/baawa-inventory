import { test, expect } from '@playwright/test';
import { TestAuthHelper } from '../test-auth-helper';
import { APPROVED_ADMIN } from '../test-user-helper';

test.describe('Smoke: login and navigation', () => {
  test('admin can access dashboard, pos, and finance', async ({ page }) => {
    await TestAuthHelper.loginUser(page, APPROVED_ADMIN);

    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible();

    await page.goto('/pos');
    await expect(
      page.getByRole('heading', { name: 'Point of Sale' })
    ).toBeVisible();

    await page.goto('/finance');
    await expect(
      page.getByRole('heading', { name: 'Finance Overview' })
    ).toBeVisible();
  });
});
