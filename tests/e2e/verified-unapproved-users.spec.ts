import { test, expect } from "@playwright/test";
import { emailUtils } from "./email-test-utils";

test.describe("Verified but Unapproved Users - Access Control", () => {
  let verifiedUnapprovedEmail: string;
  let adminEmail: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique test emails
    verifiedUnapprovedEmail = emailUtils.generateTestEmail(
      "verified-unapproved"
    );
    adminEmail = emailUtils.generateTestEmail("admin-approver");

    // Clean up any existing test accounts
    await page.goto("/test-data");
    await page.waitForLoadState("networkidle");
  });

  test.describe("User Registration and Email Verification Flow", () => {
    test("should register user and verify email but remain unapproved", async ({
      page,
    }) => {
      // Register new user
      await page.goto("/register");

      await page.fill('input[name="firstName"]', "Verified");
      await page.fill('input[name="lastName"]', "Unapproved");
      await page.fill('input[name="email"]', verifiedUnapprovedEmail);
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      await page.click('button[type="submit"]');

      // Should redirect to check-email page
      await expect(page).toHaveURL("/check-email");
      await expect(page.locator("text=Check your email")).toBeVisible();

      // Verify email (simulate email verification)
      await page.goto(
        `/verify-email?token=test-token&email=${encodeURIComponent(verifiedUnapprovedEmail)}`
      );

      // Should show verification success but pending approval
      await expect(
        page.locator("text=Email verified successfully")
      ).toBeVisible();
      await expect(
        page.locator("text=Your account is pending admin approval")
      ).toBeVisible();
    });

    test("should redirect verified unapproved user to pending-approval page", async ({
      page,
    }) => {
      // Simulate verified but unapproved user session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
      }, verifiedUnapprovedEmail);

      // Try to access protected routes
      const protectedRoutes = ["/dashboard", "/pos", "/inventory", "/admin"];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL("/pending-approval");
        await expect(
          page.locator("text=Your account is pending approval")
        ).toBeVisible();
      }
    });
  });

  test.describe("Access Control for Verified Unapproved Users", () => {
    test.beforeEach(async ({ page }) => {
      // Set up verified unapproved user session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
        localStorage.setItem("test-user-role", "STAFF");
      }, verifiedUnapprovedEmail);
    });

    test("should block access to dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/pending-approval");
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
      await expect(
        page.locator(
          "text=Please wait for an administrator to approve your account"
        )
      ).toBeVisible();
    });

    test("should block access to POS system", async ({ page }) => {
      await page.goto("/pos");
      await expect(page).toHaveURL("/pending-approval");
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
    });

    test("should block access to inventory management", async ({ page }) => {
      await page.goto("/inventory");
      await expect(page).toHaveURL("/pending-approval");
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
    });

    test("should block access to admin panel", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL("/pending-approval");
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
    });

    test("should block access to inventory sub-routes", async ({ page }) => {
      const inventoryRoutes = [
        "/inventory/products",
        "/inventory/categories",
        "/inventory/brands",
        "/inventory/suppliers",
        "/inventory/low-stock",
        "/inventory/reports",
        "/inventory/stock-history",
        "/inventory/stock-reconciliations",
      ];

      for (const route of inventoryRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL("/pending-approval");
      }
    });

    test("should block access to POS history", async ({ page }) => {
      await page.goto("/pos/history");
      await expect(page).toHaveURL("/pending-approval");
    });

    test("should block access to audit logs", async ({ page }) => {
      await page.goto("/audit-logs");
      await expect(page).toHaveURL("/pending-approval");
    });
  });

  test.describe("Public Route Access for Verified Unapproved Users", () => {
    test.beforeEach(async ({ page }) => {
      // Set up verified unapproved user session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
      }, verifiedUnapprovedEmail);
    });

    test("should allow access to public routes", async ({ page }) => {
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
        await expect(page).not.toHaveURL("/pending-approval");

        // Should not be redirected away from public routes
        if (route !== "/pending-approval") {
          await expect(page).toHaveURL(route);
        }
      }
    });

    test("should allow access to logout", async ({ page }) => {
      await page.goto("/logout");
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Pending Approval Page Content", () => {
    test.beforeEach(async ({ page }) => {
      // Set up verified unapproved user session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
      }, verifiedUnapprovedEmail);
    });

    test("should display correct status message for verified users", async ({
      page,
    }) => {
      await page.goto("/dashboard"); // This will redirect to pending-approval
      await expect(page).toHaveURL("/pending-approval");

      // Check for appropriate status message
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
      await expect(
        page.locator(
          "text=Please wait for an administrator to approve your account"
        )
      ).toBeVisible();

      // Should show appropriate icon (clock for pending)
      await expect(page.locator('[data-testid="status-icon"]')).toBeVisible();
    });

    test("should display user information correctly", async ({ page }) => {
      await page.goto("/pending-approval");

      // Should show user email
      await expect(
        page.locator(`text=${verifiedUnapprovedEmail}`)
      ).toBeVisible();

      // Should show logout option
      await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    });

    test("should allow user to logout", async ({ page }) => {
      await page.goto("/pending-approval");

      await page.click('button:has-text("Logout")');
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Session Management for Verified Unapproved Users", () => {
    test("should maintain session but redirect to pending-approval", async ({
      page,
    }) => {
      // Set up verified unapproved user session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
      }, verifiedUnapprovedEmail);

      // Try to access protected route
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/pending-approval");

      // Refresh the page - should still be on pending-approval
      await page.reload();
      await expect(page).toHaveURL("/pending-approval");

      // Try another protected route
      await page.goto("/pos");
      await expect(page).toHaveURL("/pending-approval");
    });

    test("should handle session expiration gracefully", async ({ page }) => {
      // Set up verified unapproved user session with expired token
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
        localStorage.setItem("test-session-expired", "true");
      }, verifiedUnapprovedEmail);

      // Try to access protected route
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Admin Approval Process", () => {
    test("should allow admin to approve verified user", async ({ page }) => {
      // Set up admin session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, adminEmail);

      // Go to admin panel
      await page.goto("/admin");
      await expect(page).toHaveURL("/admin");

      // Should see pending users list
      await expect(page.locator("text=Pending Users")).toBeVisible();

      // Should see the verified unapproved user in the list
      await expect(
        page.locator(`text=${verifiedUnapprovedEmail}`)
      ).toBeVisible();

      // Should see approve/reject buttons
      await expect(page.locator('button:has-text("Approve")')).toBeVisible();
      await expect(page.locator('button:has-text("Reject")')).toBeVisible();
    });

    test("should update user status after admin approval", async ({ page }) => {
      // Simulate admin approval
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, verifiedUnapprovedEmail);

      // Now should be able to access protected routes
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/dashboard");
      await expect(page.locator("text=Dashboard")).toBeVisible();

      await page.goto("/pos");
      await expect(page).toHaveURL("/pos");
      await expect(page.locator("text=Point of Sale")).toBeVisible();
    });
  });

  test.describe("Error Handling and Edge Cases", () => {
    test("should handle invalid user status gracefully", async ({ page }) => {
      // Set up user with invalid status
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "INVALID_STATUS");
      }, verifiedUnapprovedEmail);

      // Should redirect to unauthorized
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/unauthorized");
    });

    test("should handle missing user status", async ({ page }) => {
      // Set up user without status
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.removeItem("test-user-status");
      }, verifiedUnapprovedEmail);

      // Should redirect to login
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/login");
    });

    test("should handle rejected user status", async ({ page }) => {
      // Set up rejected user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "REJECTED");
      }, verifiedUnapprovedEmail);

      // Should redirect to unauthorized
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/unauthorized");
    });

    test("should handle suspended user status", async ({ page }) => {
      // Set up suspended user
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "SUSPENDED");
      }, verifiedUnapprovedEmail);

      // Should redirect to unauthorized
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/unauthorized");
    });
  });
});
