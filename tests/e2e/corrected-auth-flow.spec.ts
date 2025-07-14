import { test, expect } from "@playwright/test";
import {
  testUserHelper,
  UNVERIFIED,
  VERIFIED_UNAPPROVED,
  APPROVED_ADMIN,
  REJECTED,
  SUSPENDED,
} from "./test-user-helper";

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

      // Test that protected routes redirect to login when not authenticated
      const protectedRoutes = ["/dashboard", "/pos", "/inventory", "/admin"];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForURL(/\/login/, { timeout: 5000 });
        expect(page.url()).toContain("/login");
        console.log(
          `✅ Protected route ${route} redirects to login when not authenticated`
        );
      }
    });
  });

  test.describe("2. VERIFIED Users - Redirected to Pending Approval", () => {
    test("should redirect VERIFIED users to pending-approval page", async ({
      page,
    }) => {
      // Use test-data page to simulate VERIFIED user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
        localStorage.setItem("test-user-isEmailVerified", "true");
      }, VERIFIED_UNAPPROVED.email);

      // Try to access dashboard - should redirect to pending-approval
      await page.goto("/dashboard");
      await page.waitForURL(/\/pending-approval/, { timeout: 5000 });

      // Should show pending approval message
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();

      console.log("✅ VERIFIED user correctly redirected to pending-approval");
    });

    test("should redirect VERIFIED users to pending-approval when trying to access any page", async ({
      page,
    }) => {
      // Use test-data page to simulate VERIFIED user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
        localStorage.setItem("test-user-isEmailVerified", "true");
      }, VERIFIED_UNAPPROVED.email);

      // Try to access various pages - should all redirect to pending-approval
      const testPages = ["/dashboard", "/pos", "/inventory", "/admin"];

      for (const pagePath of testPages) {
        await page.goto(pagePath);

        // Should be redirected to pending-approval
        await page.waitForURL(/\/pending-approval/, { timeout: 5000 });
        expect(page.url()).toContain("/pending-approval");

        console.log(
          `✅ VERIFIED user correctly redirected from ${pagePath} to pending-approval`
        );
      }
    });

    test("should persist pending-approval redirect even after logout and login", async ({
      page,
    }) => {
      // Use test-data page to simulate VERIFIED user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
        localStorage.setItem("test-user-isEmailVerified", "true");
      }, VERIFIED_UNAPPROVED.email);

      // Try to access dashboard - should redirect to pending-approval
      await page.goto("/dashboard");
      await page.waitForURL(/\/pending-approval/, { timeout: 5000 });

      // Logout
      await page.goto("/logout");
      await page.waitForURL(/\/login/, { timeout: 5000 });

      // Login with the same VERIFIED account
      await page.fill('input[name="email"]', VERIFIED_UNAPPROVED.email);
      await page.fill('input[name="password"]', VERIFIED_UNAPPROVED.password);
      await page.click('button[type="submit"]');

      // Should still be redirected to pending-approval
      await page.waitForURL(/\/pending-approval/, { timeout: 5000 });
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
      // Use test-data page to simulate APPROVED user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-isEmailVerified", "true");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

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
      // Use test-data page to simulate APPROVED user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-isEmailVerified", "true");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Try to access pending-approval - should redirect to dashboard
      await page.goto("/pending-approval");
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });

      console.log(
        "✅ APPROVED user redirected from pending-approval to dashboard"
      );
    });
  });

  test.describe("4. REJECTED/SUSPENDED Users - Redirected to Unauthorized", () => {
    test("should redirect REJECTED users to unauthorized page", async ({
      page,
    }) => {
      // Use test-data page to simulate REJECTED user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "REJECTED");
        localStorage.setItem("test-user-isEmailVerified", "true");
      }, REJECTED.email);

      // Try to access dashboard - should redirect to unauthorized
      await page.goto("/dashboard");
      await page.waitForURL(/\/unauthorized/, { timeout: 5000 });

      // Should show unauthorized message
      await expect(page.locator("text=Access Denied")).toBeVisible();

      console.log("✅ REJECTED user correctly redirected to unauthorized");
    });

    test("should redirect SUSPENDED users to unauthorized page", async ({
      page,
    }) => {
      // Use test-data page to simulate SUSPENDED user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "SUSPENDED");
        localStorage.setItem("test-user-isEmailVerified", "true");
      }, SUSPENDED.email);

      // Try to access dashboard - should redirect to unauthorized
      await page.goto("/dashboard");
      await page.waitForURL(/\/unauthorized/, { timeout: 5000 });

      // Should show unauthorized message
      await expect(page.locator("text=Access Denied")).toBeVisible();

      console.log("✅ SUSPENDED user correctly redirected to unauthorized");
    });
  });

  test.describe("5. Public Routes Are Accessible", () => {
    test("should allow access to verify-email page (public route)", async ({
      page,
    }) => {
      await page.goto("/verify-email");

      // Should be able to access verify-email page (it's a public route)
      expect(page.url()).toContain("/verify-email");

      // Should show some content (even if it's an error message for missing token)
      await expect(page.locator("body")).toBeVisible();

      console.log("✅ Verify-email page accessible (public route)");
    });

    test("should allow access to pending-approval page (public route)", async ({
      page,
    }) => {
      await page.goto("/pending-approval");

      // Should be able to access pending-approval page (it's a public route)
      expect(page.url()).toContain("/pending-approval");

      // Should show some content
      await expect(page.locator("body")).toBeVisible();

      console.log("✅ Pending-approval page accessible (public route)");
    });

    test("should allow access to unauthorized page (public route)", async ({
      page,
    }) => {
      await page.goto("/unauthorized");

      // Should be able to access unauthorized page (it's a public route)
      expect(page.url()).toContain("/unauthorized");

      // Should show access denied message
      await expect(page.locator("text=Access Denied")).toBeVisible();

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

        // Should be able to access public routes
        expect(page.url()).toContain(route);

        console.log(`✅ Public route ${route} accessible`);
      }
    });
  });
});
