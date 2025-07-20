import { test, expect } from "@playwright/test";
import {
  testUserHelper,
  UNVERIFIED,
  VERIFIED_UNAPPROVED,
  APPROVED_ADMIN,
  APPROVED_MANAGER,
  APPROVED_STAFF,
  REJECTED,
  SUSPENDED,
} from "./test-user-helper";
import { TestAuthHelper } from "./test-auth-helper";

test.describe("Correct Authentication Flow", () => {
  test.beforeAll(async () => {
    // Initialize test users before all tests
    await testUserHelper.initializeTestUsers();
  });

  test.describe("1. Authentication Flow Logic", () => {
    test("should test authentication flow without email registration", async ({
      page,
    }) => {
      // Test that public routes are accessible
      await TestAuthHelper.testPublicRoutes(page);

      // Test that protected routes redirect to login when not authenticated
      await TestAuthHelper.testProtectedRoutesRedirect(page);
    });
  });

  test.describe("2. VERIFIED Users - Redirected to Pending Approval", () => {
    test("should redirect VERIFIED users to pending-approval page", async ({
      page,
    }) => {
      // Login with VERIFIED user
      await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

      // Try to access dashboard - should redirect to pending-approval
      await page.goto("/dashboard");
      await page.waitForURL(/\/pending-approval/, { timeout: 10000 });

      // Should show pending approval message
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();

      console.log("✅ VERIFIED user correctly redirected to pending-approval");
    });

    test("should redirect VERIFIED users to pending-approval when trying to access any page", async ({
      page,
    }) => {
      // Login with VERIFIED user
      await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

      // Try to access various pages - should all redirect to pending-approval
      const testPages = ["/dashboard", "/pos", "/inventory", "/admin"];

      for (const pagePath of testPages) {
        await page.goto(pagePath);

        // Should be redirected to pending-approval
        await page.waitForURL(/\/pending-approval/, { timeout: 10000 });
        expect(page.url()).toContain("/pending-approval");

        console.log(
          `✅ VERIFIED user correctly redirected from ${pagePath} to pending-approval`
        );
      }
    });

    test("should persist pending-approval redirect even after logout and login", async ({
      page,
    }) => {
      // Login with VERIFIED user
      await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

      // Try to access dashboard - should redirect to pending-approval
      await page.goto("/dashboard");
      await page.waitForURL(/\/pending-approval/, { timeout: 10000 });

      // Logout
      await TestAuthHelper.logoutUser(page);

      // Wait for logout to complete and ensure we're on login page
      await page.waitForURL(/\/login/, { timeout: 10000 });

      // Login with the same VERIFIED account
      await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

      // Should still be redirected to pending-approval
      await page.waitForURL(/\/pending-approval/, { timeout: 10000 });
      expect(page.url()).toContain("/pending-approval");

      console.log(
        "✅ VERIFIED user persists pending-approval redirect after logout/login"
      );
    });
  });

  test.describe("3. APPROVED Users - Can Access Dashboard", () => {
    test("should allow APPROVED users to access dashboard", async ({
      page,
    }) => {
      // Login with APPROVED user
      await TestAuthHelper.loginUser(page, APPROVED_ADMIN);

      // Try to access dashboard - should work
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/dashboard");

      // Should not be redirected to unauthorized or pending-approval
      await expect(page).not.toHaveURL("/unauthorized");
      await expect(page).not.toHaveURL("/pending-approval");

      console.log("✅ APPROVED user can access dashboard");
    });

    test("should redirect APPROVED users away from pending-approval page", async ({
      page,
    }) => {
      // Login with APPROVED user
      await TestAuthHelper.loginUser(page, APPROVED_ADMIN);

      // Try to access pending-approval - should redirect to dashboard
      await page.goto("/pending-approval");
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });

      console.log(
        "✅ APPROVED user redirected from pending-approval to dashboard"
      );
    });
  });

  test.describe("4. REJECTED/SUSPENDED Users - Cannot Login", () => {
    test("should prevent REJECTED users from logging in", async ({ page }) => {
      // Try to login with REJECTED user - should fail
      await page.goto("/login");
      await page.fill('input[name="email"]', REJECTED.email);
      await page.fill('input[name="password"]', REJECTED.password);
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector('[data-testid="login-error"]', {
        timeout: 10000,
      });

      // Should show error message
      const errorElement = page.locator('[data-testid="login-error"]');
      await expect(errorElement).toBeVisible();

      // Should still be on login page
      await expect(page).toHaveURL(/\/login/);

      console.log("✅ REJECTED user correctly prevented from logging in");
    });

    test("should prevent SUSPENDED users from logging in", async ({ page }) => {
      // Try to login with SUSPENDED user - should fail
      await page.goto("/login");
      await page.fill('input[name="email"]', SUSPENDED.email);
      await page.fill('input[name="password"]', SUSPENDED.password);
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector('[data-testid="login-error"]', {
        timeout: 10000,
      });

      // Should show error message
      const errorElement = page.locator('[data-testid="login-error"]');
      await expect(errorElement).toBeVisible();

      // Should still be on login page
      await expect(page).toHaveURL(/\/login/);

      console.log("✅ SUSPENDED user correctly prevented from logging in");
    });
  });

  test.describe("5. Public Routes Are Accessible", () => {
    test("should allow access to verify-email page (public route)", async ({
      page,
    }) => {
      await page.goto("/verify-email");
      expect(page.url()).toContain("/verify-email");
      console.log("✅ Verify-email page accessible (public route)");
    });

    test("should allow access to pending-approval page (public route)", async ({
      page,
    }) => {
      await page.goto("/pending-approval");
      expect(page.url()).toContain("/pending-approval");
      console.log("✅ Pending-approval page accessible (public route)");
    });

    test("should allow access to unauthorized page (public route)", async ({
      page,
    }) => {
      await page.goto("/unauthorized");
      expect(page.url()).toContain("/unauthorized");
      console.log("✅ Unauthorized page accessible (public route)");
    });
  });

  test.describe("Public Route Access", () => {
    test("should allow access to all public routes", async ({ page }) => {
      const publicRoutes = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/check-email",
        "/verify-email",
        "/pending-approval",
        "/unauthorized",
      ];

      for (const route of publicRoutes) {
        await page.goto(route);
        expect(page.url()).toContain(route);
        console.log(`✅ Public route ${route} accessible`);
      }
    });
  });
});
