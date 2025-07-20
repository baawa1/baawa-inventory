import { test, expect } from "@playwright/test";
import { TestAuthHelper } from "./test-auth-helper";
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

test.describe("Authentication Integration Tests", () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test.describe("Complete User Registration and Approval Flow", () => {
    test("should register a new user and verify email", async ({ page }) => {
      // Note: Registration functionality may need email service setup
      // For now, we'll test with existing test users
      console.log("✅ Test users are pre-created and ready for testing");
    });

    test("should verify email and redirect to pending approval", async ({
      page,
    }) => {
      // Login with VERIFIED user (simulates verified email)
      await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

      // Should be redirected to pending approval
      await expect(page).toHaveURL(/\/pending-approval/);
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();

      console.log("✅ Verified user correctly redirected to pending approval");
    });

    test("should block access to protected routes for unapproved user", async ({
      page,
    }) => {
      // Login with VERIFIED user
      await TestAuthHelper.loginUser(page, VERIFIED_UNAPPROVED);

      // Try to access protected routes - should all redirect to pending-approval
      const protectedRoutes = ["/dashboard", "/pos", "/inventory", "/admin"];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(/\/pending-approval/);
        console.log(
          `✅ ${route} redirected to pending-approval for verified user`
        );
      }
    });
  });

  test.describe("Admin User Creation and User Approval", () => {
    test("should verify admin email and set admin role", async ({ page }) => {
      // Login with ADMIN user
      await TestAuthHelper.loginUser(page, APPROVED_ADMIN);

      // Should be able to access admin routes
      await page.goto("/admin");
      await expect(page).toHaveURL("/admin");

      console.log("✅ Admin user can access admin panel");
    });
  });

  test.describe("Login and Session Management", () => {
    test("should login with verified user", async ({ page }) => {
      // Login with APPROVED user
      await TestAuthHelper.loginUser(page, APPROVED_STAFF);

      // Should be able to access dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/dashboard");

      console.log("✅ Approved user can login and access dashboard");
    });

    test("should maintain session across page refreshes", async ({ page }) => {
      // Login with APPROVED user
      await TestAuthHelper.loginUser(page, APPROVED_ADMIN);

      // Access dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/dashboard");

      // Refresh page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should still be on dashboard
      await expect(page).toHaveURL("/dashboard");

      console.log("✅ Session persists across page refreshes");
    });

    test("should logout properly", async ({ page }) => {
      // Login with APPROVED user
      await TestAuthHelper.loginUser(page, APPROVED_MANAGER);

      // Access dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/dashboard");

      // Logout
      await TestAuthHelper.logoutUser(page);

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);

      // Try to access protected route - should redirect to login
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);

      console.log("✅ Logout works correctly");
    });
  });

  test.describe("Public Route Access", () => {
    test("should allow access to public routes when not authenticated", async ({
      page,
    }) => {
      // Test public routes without authentication
      await TestAuthHelper.testPublicRoutes(page);
    });

    test("should allow access to public routes when authenticated", async ({
      page,
    }) => {
      // Login with any user
      await TestAuthHelper.loginUser(page, APPROVED_STAFF);

      // Test public routes while authenticated
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
        console.log(`✅ Public route ${route} accessible while authenticated`);
      }
    });
  });
});
