import { test, expect } from '@playwright/test';
import { TestAuthHelper } from '../test-auth-helper';
import { VERIFIED_UNAPPROVED } from '../test-user-helper';

test.describe('Smoke: access gating', () => {
  test('verified unapproved users are redirected to pending approval', async ({ page }) => {
    await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

    await expect(page).toHaveURL(/\/pending-approval/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/pending-approval/);
  });
});
