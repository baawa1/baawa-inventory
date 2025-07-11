import { test, expect } from "@playwright/test";
import TestDataSetup from "./test-data-setup";
import { setupBasicEmailMocking, EmailTestHelpers } from "./email-test-helpers";

test.describe("Basic Authentication E2E Tests", () => {
  // Setup and teardown
  test.beforeAll(async () => {
    // Setup test data before all tests
    await TestDataSetup.setupAllTestUsers();
  });

  test.afterAll(async () => {
    // Cleanup test data after all tests
    await TestDataSetup.cleanupTestData();
    await TestDataSetup.disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Clear any existing session/cookies before each test
    await page.context().clearCookies();

    // Set up basic email mocking
    await setupBasicEmailMocking(page);

    await page.goto("/");
  });

  test.describe("Basic Authentication Flows", () => {
    test("should display login form correctly", async ({ page }) => {
      await page.goto("/login");

      // Check that login form elements are present
      await expect(page.locator("text=Sign in")).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    });

    test("should display registration form correctly", async ({ page }) => {
      await page.goto("/register");

      // Check that registration form elements are present
      await expect(page.locator("text=Create Account")).toBeVisible();
      await expect(
        page.locator('[data-testid="firstName-input"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="lastName-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="register-button"]')
      ).toBeVisible();
    });

    test("should login successfully with valid admin credentials", async ({
      page,
    }) => {
      await page.goto("/login");

      // Fill login form with admin credentials
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );

      // Submit login
      await page.click('[data-testid="login-button"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(
        page.locator('[data-testid="dashboard-content"]')
      ).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      // Fill login form with invalid credentials
      await page.fill('[data-testid="email-input"]', "invalid@example.com");
      await page.fill('[data-testid="password-input"]', "wrongpassword");

      // Submit login
      await page.click('[data-testid="login-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    });

    test("should complete basic registration flow", async ({ page }) => {
      const testEmail = EmailTestHelpers.generateTestEmail();

      await page.goto("/register");

      // Fill registration form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Should redirect to check-email page
      await expect(page).toHaveURL(/.*check-email/);
    });

    test("should protect dashboard route for unauthenticated users", async ({
      page,
    }) => {
      // Try to access dashboard without authentication
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });

    test("should access admin area with admin role", async ({ page }) => {
      // Login as admin first
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Navigate to admin page
      await page.goto("/admin");

      // Should be able to access admin dashboard
      await expect(
        page.locator('[data-testid="admin-dashboard"]')
      ).toBeVisible();
    });

    test("should deny admin access to non-admin users", async ({ page }) => {
      // Login as staff user first
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.STAFF_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.STAFF_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Try to access admin page
      await page.goto("/admin");

      // Should be redirected to unauthorized page
      await expect(page).toHaveURL(/.*unauthorized/);
    });

    test("should logout successfully", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Navigate to logout page
      await page.goto("/logout");

      // Confirm logout
      await page.click("text=Confirm Logout");

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);

      // Try to access protected route - should redirect to login
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe("User Status Handling", () => {
    test("should handle pending user login", async ({ page }) => {
      await page.goto("/login");

      // Fill login form with pending user
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.PENDING_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.PENDING_USER.password
      );

      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval page
      await expect(page).toHaveURL(/.*pending-approval/);
    });

    test("should handle suspended user login", async ({ page }) => {
      await page.goto("/login");

      // Fill login form with suspended user
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.SUSPENDED_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.SUSPENDED_USER.password
      );

      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval page (suspended status)
      await expect(page).toHaveURL(/.*pending-approval/);
    });
  });

  test.describe("Email Integration", () => {
    test("should handle registration with email mocking", async ({ page }) => {
      const testEmail = EmailTestHelpers.generateTestEmail();

      await page.goto("/register");

      // Fill registration form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Should successfully redirect to check-email page
      await expect(page).toHaveURL(/.*check-email/);
      await expect(
        page.locator('[data-testid="email-sent-message"]')
      ).toBeVisible();
    });

    test("should display forgot password form", async ({ page }) => {
      await page.goto("/forgot-password");

      // Check that forgot password form is displayed
      await expect(page.locator("text=Reset Password")).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    });
  });
});
