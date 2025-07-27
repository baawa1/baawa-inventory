import { test, expect } from '@playwright/test';
import { TestAuthHelper } from './test-auth-helper';
import {
  testUserHelper,
  VERIFIED_UNAPPROVED,
  APPROVED_ADMIN,
  REJECTED,
} from './test-user-helper';

test.describe('Simple Auth Test', () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test('should login with admin user and access dashboard', async ({
    page,
  }) => {
    // Login with admin user
    await TestAuthHelper.loginUser(page, APPROVED_ADMIN);

    // Should be able to access dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Should be able to access admin panel
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');

    console.log('✅ Admin user login and dashboard access working');
  });

  test('should redirect unapproved users to pending approval', async ({
    page,
  }) => {
    // Login with verified but unapproved user
    await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

    // Should be redirected to pending approval
    await expect(page).toHaveURL(/\/pending-approval/);

    // Try to access dashboard - should stay on pending approval
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/pending-approval/);

    console.log('✅ Unapproved user correctly redirected to pending approval');
  });

  test('should prevent rejected users from logging in', async ({ page }) => {
    // Try to login with rejected user - should fail
    await page.goto('/login');
    await page.fill('input[name="email"]', REJECTED.email);
    await page.fill('input[name="password"]', REJECTED.password);
    await page.click('button[type="submit"]');

    // Should show error and stay on login page
    await page.waitForSelector('[data-testid="login-error"]', {
      timeout: 10000,
    });
    const errorElement = page.locator('[data-testid="login-error"]');
    await expect(errorElement).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    console.log('✅ Rejected user correctly prevented from logging in');
  });
});
