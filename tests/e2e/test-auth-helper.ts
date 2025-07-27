import { test, expect, Page } from '@playwright/test';
import { TEST_USERS } from './test-user-helper';

export interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  userStatus: string;
  emailVerified: boolean;
  isActive: boolean;
}

export class TestAuthHelper {
  /**
   * Log in a test user using the actual login form
   */
  static async loginUser(page: Page, user: TestUser): Promise<void> {
    // Navigate to login page
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);

    // Submit the form by clicking the submit button (not form.submit())
    await page.click('button[type="submit"]');

    // Wait for the form submission to complete
    await page.waitForLoadState('networkidle');

    // Wait for either a redirect or an error message
    try {
      await Promise.race([
        page.waitForURL(/\/dashboard/, { timeout: 15000 }),
        page.waitForURL(/\/pending-approval/, { timeout: 15000 }),
        page.waitForURL(/\/unauthorized/, { timeout: 15000 }),
        page.waitForURL(/\/check-email/, { timeout: 15000 }),
        page.waitForSelector('[data-testid="login-error"]', { timeout: 15000 }),
      ]);
    } catch (error) {
      console.log('⏰ No redirect detected, checking current URL...');
    }

    // Check if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Check for error messages
      const errorElement = page.locator('[data-testid="login-error"]');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }

      // If still on login page without error, the login might still be processing
      console.log('⚠️ Still on login page, waiting a bit more...');
      await page.waitForTimeout(2000);

      const finalUrl = page.url();
      if (finalUrl.includes('/login')) {
        throw new Error('Login failed: Still on login page after waiting');
      }
    }

    console.log(`✅ Login successful, redirected to: ${page.url()}`);
  }

  /**
   * Log out the current user
   */
  static async logoutUser(page: Page): Promise<void> {
    await page.goto('/logout');

    // Wait for the logout page to load
    await page.waitForLoadState('networkidle');

    // Click the confirm logout button
    await page.click('button:has-text("Confirm Logout")');

    // Wait for logout to complete and redirect to login
    await page.waitForURL(/\/login/, { timeout: 15000 });
  }

  /**
   * Verify user is redirected to expected page based on status
   */
  static async verifyUserAccess(
    page: Page,
    user: TestUser,
    expectedRedirect?: string
  ): Promise<void> {
    // Try to access a protected route
    await page.goto('/dashboard');

    if (expectedRedirect) {
      await expect(page).toHaveURL(expectedRedirect);
    } else {
      // Determine expected redirect based on user status
      if (!user.emailVerified) {
        await expect(page).toHaveURL('/check-email');
      } else if (
        user.userStatus === 'PENDING' ||
        user.userStatus === 'VERIFIED'
      ) {
        await expect(page).toHaveURL('/pending-approval');
      } else if (
        user.userStatus === 'REJECTED' ||
        user.userStatus === 'SUSPENDED'
      ) {
        await expect(page).toHaveURL('/unauthorized');
      } else if (user.userStatus === 'APPROVED') {
        await expect(page).toHaveURL('/dashboard');
      }
    }
  }

  /**
   * Test user access to specific routes
   */
  static async testRouteAccess(
    page: Page,
    user: TestUser,
    route: string,
    shouldAllow: boolean
  ): Promise<void> {
    await page.goto(route);

    if (shouldAllow) {
      await expect(page).toHaveURL(route);
    } else {
      // Should be redirected based on user status
      if (!user.emailVerified) {
        await expect(page).toHaveURL('/check-email');
      } else if (
        user.userStatus === 'PENDING' ||
        user.userStatus === 'VERIFIED'
      ) {
        await expect(page).toHaveURL('/pending-approval');
      } else if (
        user.userStatus === 'REJECTED' ||
        user.userStatus === 'SUSPENDED'
      ) {
        await expect(page).toHaveURL('/unauthorized');
      }
    }
  }

  /**
   * Test that a user can access the dashboard (for approved users)
   */
  static async testDashboardAccess(page: Page, user: TestUser): Promise<void> {
    await page.goto('/dashboard');

    if (user.userStatus === 'APPROVED') {
      await expect(page).toHaveURL('/dashboard');
      await expect(page).not.toHaveURL('/unauthorized');
      await expect(page).not.toHaveURL('/pending-approval');
    } else {
      // Should be redirected based on status
      this.verifyUserAccess(page, user);
    }
  }

  /**
   * Test that a user is redirected from pending-approval page (for approved users)
   */
  static async testPendingApprovalRedirect(
    page: Page,
    user: TestUser
  ): Promise<void> {
    await page.goto('/pending-approval');

    if (user.userStatus === 'APPROVED') {
      await expect(page).toHaveURL('/dashboard');
    } else if (
      user.userStatus === 'PENDING' ||
      user.userStatus === 'VERIFIED'
    ) {
      await expect(page).toHaveURL('/pending-approval');
    } else {
      await expect(page).toHaveURL('/unauthorized');
    }
  }

  /**
   * Test that public routes are accessible without authentication
   */
  static async testPublicRoutes(page: Page): Promise<void> {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/check-email',
      '/verify-email',
      '/pending-approval',
      '/unauthorized',
    ];

    for (const route of publicRoutes) {
      await page.goto(route);
      expect(page.url()).toContain(route);
      console.log(`✅ Public route ${route} accessible`);
    }
  }

  /**
   * Test that protected routes redirect to login when not authenticated
   */
  static async testProtectedRoutesRedirect(page: Page): Promise<void> {
    const protectedRoutes = ['/dashboard', '/pos', '/inventory', '/admin'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
      console.log(
        `✅ Protected route ${route} redirects to login when not authenticated`
      );
    }
  }

  /**
   * Get test users from the test-user-helper
   */
  static getTestUsers() {
    return TEST_USERS;
  }
}
