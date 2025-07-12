import { test, expect } from "@playwright/test";
import { emailUtils } from "./email-test-utils";

test.describe("Dashboard Access Control - Role-Based Access", () => {
  let adminEmail: string;
  let managerEmail: string;
  let staffEmail: string;
  let unapprovedEmail: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique test emails
    adminEmail = emailUtils.generateTestEmail("admin");
    managerEmail = emailUtils.generateTestEmail("manager");
    staffEmail = emailUtils.generateTestEmail("staff");
    unapprovedEmail = emailUtils.generateTestEmail("unapproved");

    // Clean up any existing test accounts
    await page.goto("/test-data");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Admin Access Control", () => {
    test.beforeEach(async ({ page }) => {
      // Set up admin session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, adminEmail);
    });

    test("should allow admin to access all dashboard sections", async ({
      page,
    }) => {
      const allRoutes = [
        "/dashboard",
        "/pos",
        "/inventory",
        "/admin",
        "/audit-logs",
        "/inventory/products",
        "/inventory/categories",
        "/inventory/brands",
        "/inventory/suppliers",
        "/inventory/low-stock",
        "/inventory/reports",
        "/inventory/stock-history",
        "/inventory/stock-reconciliations",
        "/pos/history",
      ];

      for (const route of allRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);

        // Should not be redirected to unauthorized or pending-approval
        await expect(page).not.toHaveURL("/unauthorized");
        await expect(page).not.toHaveURL("/pending-approval");
      }
    });

    test("should allow admin to access user management", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL("/admin");

      // Should see admin dashboard elements
      await expect(page.locator("text=User Management")).toBeVisible();
      await expect(page.locator("text=Pending Users")).toBeVisible();
      await expect(page.locator("text=All Users")).toBeVisible();
    });

    test("should allow admin to access audit logs", async ({ page }) => {
      await page.goto("/audit-logs");
      await expect(page).toHaveURL("/audit-logs");

      // Should see audit logs interface
      await expect(page.locator("text=Audit Logs")).toBeVisible();
    });

    test("should allow admin to access all inventory features", async ({
      page,
    }) => {
      await page.goto("/inventory");
      await expect(page).toHaveURL("/inventory");

      // Should see all inventory management options
      await expect(page.locator("text=Add Product")).toBeVisible();
      await expect(page.locator("text=Categories")).toBeVisible();
      await expect(page.locator("text=Brands")).toBeVisible();
      await expect(page.locator("text=Suppliers")).toBeVisible();
    });
  });

  test.describe("Manager Access Control", () => {
    test.beforeEach(async ({ page }) => {
      // Set up manager session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, managerEmail);
    });

    test("should allow manager to access appropriate dashboard sections", async ({
      page,
    }) => {
      const allowedRoutes = [
        "/dashboard",
        "/pos",
        "/inventory",
        "/inventory/products",
        "/inventory/categories",
        "/inventory/brands",
        "/inventory/suppliers",
        "/inventory/low-stock",
        "/inventory/reports",
        "/inventory/stock-history",
        "/inventory/stock-reconciliations",
        "/pos/history",
      ];

      for (const route of allowedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
        await expect(page).not.toHaveURL("/unauthorized");
      }
    });

    test("should block manager from accessing admin panel", async ({
      page,
    }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL("/unauthorized");
      await expect(page.locator("text=Access Denied")).toBeVisible();
    });

    test("should block manager from accessing audit logs", async ({ page }) => {
      await page.goto("/audit-logs");
      await expect(page).toHaveURL("/unauthorized");
      await expect(page.locator("text=Access Denied")).toBeVisible();
    });

    test("should allow manager to access inventory management", async ({
      page,
    }) => {
      await page.goto("/inventory");
      await expect(page).toHaveURL("/inventory");

      // Should see inventory management options
      await expect(page.locator("text=Add Product")).toBeVisible();
      await expect(page.locator("text=Categories")).toBeVisible();
      await expect(page.locator("text=Brands")).toBeVisible();
    });

    test("should allow manager to access POS system", async ({ page }) => {
      await page.goto("/pos");
      await expect(page).toHaveURL("/pos");

      // Should see POS interface
      await expect(page.locator("text=Point of Sale")).toBeVisible();
    });
  });

  test.describe("Staff Access Control", () => {
    test.beforeEach(async ({ page }) => {
      // Set up staff session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, staffEmail);
    });

    test("should allow staff to access basic dashboard sections", async ({
      page,
    }) => {
      const allowedRoutes = [
        "/dashboard",
        "/pos",
        "/inventory",
        "/inventory/products",
        "/pos/history",
      ];

      for (const route of allowedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
        await expect(page).not.toHaveURL("/unauthorized");
      }
    });

    test("should block staff from accessing admin panel", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL("/unauthorized");
      await expect(page.locator("text=Access Denied")).toBeVisible();
    });

    test("should block staff from accessing audit logs", async ({ page }) => {
      await page.goto("/audit-logs");
      await expect(page).toHaveURL("/unauthorized");
      await expect(page.locator("text=Access Denied")).toBeVisible();
    });

    test("should block staff from accessing advanced inventory features", async ({
      page,
    }) => {
      const restrictedRoutes = [
        "/inventory/categories",
        "/inventory/brands",
        "/inventory/suppliers",
        "/inventory/low-stock",
        "/inventory/reports",
        "/inventory/stock-history",
        "/inventory/stock-reconciliations",
      ];

      for (const route of restrictedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL("/unauthorized");
        await expect(page.locator("text=Access Denied")).toBeVisible();
      }
    });

    test("should allow staff to view products but not manage categories/brands", async ({
      page,
    }) => {
      await page.goto("/inventory");
      await expect(page).toHaveURL("/inventory");

      // Should see products but not management options
      await expect(page.locator("text=Products")).toBeVisible();

      // Should not see management options
      await expect(page.locator("text=Add Category")).not.toBeVisible();
      await expect(page.locator("text=Add Brand")).not.toBeVisible();
    });

    test("should allow staff to access POS system", async ({ page }) => {
      await page.goto("/pos");
      await expect(page).toHaveURL("/pos");

      // Should see POS interface
      await expect(page.locator("text=Point of Sale")).toBeVisible();
    });
  });

  test.describe("Unapproved User Access Control", () => {
    test.beforeEach(async ({ page }) => {
      // Set up unapproved user session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "VERIFIED");
        localStorage.setItem("test-user-role", "STAFF");
      }, unapprovedEmail);
    });

    test("should block unapproved user from all dashboard sections", async ({
      page,
    }) => {
      const allRoutes = [
        "/dashboard",
        "/pos",
        "/inventory",
        "/admin",
        "/audit-logs",
        "/inventory/products",
        "/inventory/categories",
        "/inventory/brands",
        "/inventory/suppliers",
        "/inventory/low-stock",
        "/inventory/reports",
        "/inventory/stock-history",
        "/inventory/stock-reconciliations",
        "/pos/history",
      ];

      for (const route of allRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL("/pending-approval");
        await expect(
          page.locator("text=Your account is pending approval")
        ).toBeVisible();
      }
    });
  });

  test.describe("Navigation and Sidebar Access", () => {
    test("should show appropriate navigation items for admin", async ({
      page,
    }) => {
      // Set up admin session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, adminEmail);

      await page.goto("/dashboard");

      // Should see all navigation items
      await expect(page.locator("text=Dashboard")).toBeVisible();
      await expect(page.locator("text=POS")).toBeVisible();
      await expect(page.locator("text=Inventory")).toBeVisible();
      await expect(page.locator("text=Admin")).toBeVisible();
      await expect(page.locator("text=Audit Logs")).toBeVisible();
    });

    test("should show appropriate navigation items for manager", async ({
      page,
    }) => {
      // Set up manager session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, managerEmail);

      await page.goto("/dashboard");

      // Should see manager-appropriate navigation items
      await expect(page.locator("text=Dashboard")).toBeVisible();
      await expect(page.locator("text=POS")).toBeVisible();
      await expect(page.locator("text=Inventory")).toBeVisible();

      // Should not see admin-only items
      await expect(page.locator("text=Admin")).not.toBeVisible();
      await expect(page.locator("text=Audit Logs")).not.toBeVisible();
    });

    test("should show appropriate navigation items for staff", async ({
      page,
    }) => {
      // Set up staff session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, staffEmail);

      await page.goto("/dashboard");

      // Should see staff-appropriate navigation items
      await expect(page.locator("text=Dashboard")).toBeVisible();
      await expect(page.locator("text=POS")).toBeVisible();
      await expect(page.locator("text=Inventory")).toBeVisible();

      // Should not see admin/manager-only items
      await expect(page.locator("text=Admin")).not.toBeVisible();
      await expect(page.locator("text=Audit Logs")).not.toBeVisible();
    });
  });

  test.describe("Session Management and Access Control", () => {
    test("should maintain access control after page refresh", async ({
      page,
    }) => {
      // Set up staff session
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, staffEmail);

      // Access allowed route
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/dashboard");

      // Refresh page
      await page.reload();
      await expect(page).toHaveURL("/dashboard");

      // Try to access restricted route
      await page.goto("/admin");
      await expect(page).toHaveURL("/unauthorized");
    });

    test("should handle session expiration gracefully", async ({ page }) => {
      // Set up session with expired token
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
        localStorage.setItem("test-session-expired", "true");
      }, adminEmail);

      // Try to access protected route
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Error Handling and Edge Cases", () => {
    test("should handle invalid role gracefully", async ({ page }) => {
      // Set up user with invalid role
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "INVALID_ROLE");
      }, adminEmail);

      // Should redirect to unauthorized
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/unauthorized");
    });

    test("should handle missing role gracefully", async ({ page }) => {
      // Set up user without role
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.removeItem("test-user-role");
      }, adminEmail);

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
        localStorage.setItem("test-user-role", "ADMIN");
      }, adminEmail);

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
        localStorage.setItem("test-user-role", "ADMIN");
      }, adminEmail);

      // Should redirect to unauthorized
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/unauthorized");
    });
  });
});
