import { test, expect } from "@playwright/test";
import { emailUtils } from "./email-test-utils";

test.describe("Real Authentication Flow Tests", () => {
  let testUserEmail: string;

  test.beforeAll(async () => {
    testUserEmail = emailUtils.generateTestEmail("real-flow");
  });

  test.describe("Complete User Registration and Verification Flow", () => {
    test("should register user and verify email flow", async ({ page }) => {
      // Step 1: Register new user
      await page.goto("/register");

      const firstName = "Real";
      const lastName = "User";
      const password = "SecurePass123!@#";

      await page.fill('[data-testid="firstName-input"]', firstName);
      await page.fill('[data-testid="lastName-input"]', lastName);
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', password);
      await page.fill('[data-testid="confirmPassword-input"]', password);

      await page.click('[data-testid="register-button"]');

      // Should redirect to check-email page
      await page.waitForURL(/\/check-email/);
      await expect(page).toHaveURL(/\/check-email/);

      // Verify success message
      await expect(page.locator("text=Check Your Email!")).toBeVisible();
    });

    test("should verify email and show pending approval message", async ({
      page,
    }) => {
      // Step 2: Verify email (simulate email verification)
      // In a real scenario, this would come from the email link
      await page.goto(
        `/verify-email?token=test-verification-token&email=${encodeURIComponent(testUserEmail)}`
      );

      // Should show success message
      await expect(page.locator("text=Email Verified!")).toBeVisible();
      await expect(
        page.locator("text=Your email has been verified successfully!")
      ).toBeVisible();

      // Should redirect to pending approval after 3 seconds
      await page.waitForURL(/\/pending-approval/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/pending-approval/);
    });

    test("should show pending approval page content", async ({ page }) => {
      // Go directly to pending approval page
      await page.goto("/pending-approval");

      // Should show pending approval message
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
      await expect(
        page.locator(
          "text=Please wait for an administrator to approve your account"
        )
      ).toBeVisible();
    });
  });

  test.describe("Login Flow for Unapproved User", () => {
    test("should login and redirect to pending approval", async ({ page }) => {
      // Login with the test user
      await page.goto("/login");

      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', "SecurePass123!@#");

      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval since user is not approved
      await page.waitForURL(/\/pending-approval/);
      await expect(page).toHaveURL(/\/pending-approval/);

      // Should show pending approval message
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
    });

    test("should block access to protected routes for unapproved user", async ({
      page,
    }) => {
      // First login
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', "SecurePass123!@#");
      await page.click('[data-testid="login-button"]');

      // Should be on pending approval
      await page.waitForURL(/\/pending-approval/);

      // Try to access protected routes - should redirect to pending approval
      const protectedRoutes = ["/dashboard", "/pos", "/inventory", "/admin"];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL("/pending-approval");
        await expect(
          page.locator("text=Your account is pending approval")
        ).toBeVisible();
      }
    });

    test("should allow access to public routes when logged in", async ({
      page,
    }) => {
      // First login
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', "SecurePass123!@#");
      await page.click('[data-testid="login-button"]');

      // Should be on pending approval
      await page.waitForURL(/\/pending-approval/);

      // Should still be able to access public routes
      await page.goto("/");
      await expect(page).toHaveURL("/");

      await page.goto("/login");
      await expect(page).toHaveURL("/login");
    });

    test("should maintain session across page refreshes", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', "SecurePass123!@#");
      await page.click('[data-testid="login-button"]');

      // Should be on pending approval
      await page.waitForURL(/\/pending-approval/);

      // Refresh page - should still be on pending approval
      await page.reload();
      await expect(page).toHaveURL(/\/pending-approval/);

      // Try to access protected route - should still redirect to pending approval
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/pending-approval/);
    });

    test("should logout properly", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', "SecurePass123!@#");
      await page.click('[data-testid="login-button"]');

      // Should be on pending approval
      await page.waitForURL(/\/pending-approval/);

      // Click logout
      await page.click('button:has-text("Logout")');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Try to access protected route - should redirect to login
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Public Route Access", () => {
    test("should allow access to public routes when not authenticated", async ({
      page,
    }) => {
      const publicRoutes = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/pending-approval",
        "/unauthorized",
      ];

      for (const route of publicRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
      }
    });
  });
});
