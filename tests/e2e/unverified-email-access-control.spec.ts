import { test, expect } from "@playwright/test";
import { emailUtils } from "./email-test-utils";

test.describe("Unverified Email Users Access Control", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data before each test
    await page.goto("/");
  });

  test.describe("Registration and Email Verification Flow", () => {
    test("should redirect unverified users to verify-email page after registration", async ({
      page,
    }) => {
      const testEmail = emailUtils.generateTestEmail("unverified-access");

      // Register a new user
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="firstName"]', "Unverified");
      await page.fill('input[name="lastName"]', "User");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Should be redirected to check-email page
      await page.waitForURL(/\/check-email/, { timeout: 10000 });
      expect(page.url()).toContain("/check-email");
      expect(page.url()).toContain(`email=${encodeURIComponent(testEmail)}`);

      // Verify the check-email page content
      await expect(
        page.locator('[data-slot="card-title"]:has-text("Check Your Email")')
      ).toBeVisible();
      await expect(
        page.locator(
          "text=We've sent a verification link to your email address"
        )
      ).toBeVisible();

      console.log(
        "✅ Registration successful - redirected to check-email page"
      );
      emailUtils.logEmailInfo(testEmail, "Unverified Access Control Test");
    });

    test("should prevent unverified users from accessing dashboard", async ({
      page,
    }) => {
      const testEmail = emailUtils.generateTestEmail("dashboard-block");

      // Register a new user
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="firstName"]', "Dashboard");
      await page.fill('input[name="lastName"]', "Block");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access dashboard directly
      await page.goto("/dashboard");

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain("/login");

      console.log("✅ Unverified user correctly blocked from dashboard access");
    });

    test("should prevent unverified users from accessing POS", async ({
      page,
    }) => {
      const testEmail = emailUtils.generateTestEmail("pos-block");

      // Register a new user
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="firstName"]', "POS");
      await page.fill('input[name="lastName"]', "Block");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access POS directly
      await page.goto("/pos");

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain("/login");

      console.log("✅ Unverified user correctly blocked from POS access");
    });

    test("should prevent unverified users from accessing inventory", async ({
      page,
    }) => {
      const testEmail = emailUtils.generateTestEmail("inventory-block");

      // Register a new user
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="firstName"]', "Inventory");
      await page.fill('input[name="lastName"]', "Block");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access inventory directly
      await page.goto("/inventory");

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain("/login");

      console.log("✅ Unverified user correctly blocked from inventory access");
    });

    test("should prevent unverified users from accessing admin panel", async ({
      page,
    }) => {
      const testEmail = emailUtils.generateTestEmail("admin-block");

      // Register a new user
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="firstName"]', "Admin");
      await page.fill('input[name="lastName"]', "Block");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Try to access admin panel directly
      await page.goto("/admin");

      // Should be redirected to login since user is not authenticated
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain("/login");

      console.log("✅ Unverified user correctly blocked from admin access");
    });
  });

  test.describe("Email Verification Process", () => {
    test("should allow access to verify-email page without authentication", async ({
      page,
    }) => {
      // Try to access verify-email page directly
      await page.goto("/verify-email");

      // Wait for the page to load
      await page.waitForLoadState("networkidle");

      // Check if we can access the page by looking for any card content
      const cardContent = page.locator('[data-slot="card-title"]');
      await expect(cardContent).toBeVisible();

      // Log the actual content for debugging
      const cardText = await cardContent.textContent();
      console.log(`Card content: "${cardText}"`);

      expect(page.url()).toContain("/verify-email");

      console.log("✅ Verify-email page accessible without authentication");
    });

    test("should allow access to check-email page without authentication", async ({
      page,
    }) => {
      // Try to access check-email page directly
      await page.goto("/check-email?email=test@example.com");

      // Should be able to access the page (it's a public route)
      await expect(
        page.locator('[data-slot="card-title"]:has-text("Check Your Email")')
      ).toBeVisible();
      expect(page.url()).toContain("/check-email");

      console.log("✅ Check-email page accessible without authentication");
    });

    // test("should redirect to register if no email provided to check-email", async ({
    //   page,
    // }) => {
    //   // Try to access check-email page without email parameter
    //   await page.goto("/check-email");

    //   // Should be redirected to register page
    //   await page.waitForURL(/\/register/, { timeout: 5000 });
    //   expect(page.url()).toContain("/register");

    //   console.log(
    //     "✅ Check-email page redirects to register when no email provided"
    //   );
    // });
    test("should show check-email page content even without email parameter", async ({
      page,
    }) => {
      // Try to access check-email page without email parameter
      await page.goto("/check-email");

      // Should show the check-email page content (not redirect)
      await expect(
        page.locator('[data-slot="card-title"]:has-text("Check Your Email")')
      ).toBeVisible();
      expect(page.url()).toContain("/check-email");

      console.log(
        "✅ Check-email page shows content even without email parameter"
      );
    });
  });

  test.describe("Login Attempts with Unverified Email", () => {
    test("should prevent login with unverified email", async ({ page }) => {
      const testEmail = emailUtils.generateTestEmail("login-block");

      // First register a user
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="firstName"]', "Login");
      await page.fill('input[name="lastName"]', "Block");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Now try to login with the unverified account
      await page.goto("/login");
      await page.waitForSelector("form");

      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Should show an error message about email not being verified
      await page.waitForTimeout(2000);

      // Check for error message
      const errorMessage = page.locator(
        ".text-destructive, [data-testid='error']"
      );
      await expect(errorMessage).toBeVisible();

      // Should still be on login page
      expect(page.url()).toContain("/login");

      console.log("✅ Login correctly blocked for unverified email");
    });
  });

  test.describe("Direct URL Access Protection", () => {
    test("should protect all dashboard routes from unverified users", async ({
      page,
    }) => {
      const protectedRoutes = [
        "/dashboard",
        "/pos",
        "/inventory",
        "/admin",
        "/inventory/products",
        "/inventory/categories",
        "/inventory/brands",
        "/inventory/suppliers",
        "/inventory/reports",
        "/inventory/low-stock",
        "/inventory/stock-history",
        "/inventory/stock-reconciliations",
        "/pos/history",
        "/audit-logs",
      ];

      for (const route of protectedRoutes) {
        // Try to access each protected route
        await page.goto(route);

        // Should be redirected to login
        await page.waitForURL(/\/login/, { timeout: 5000 });
        expect(page.url()).toContain("/login");

        console.log(
          `✅ Route ${route} correctly protected from unverified users`
        );
      }
    });

    test("should allow access to public routes for unverified users", async ({
      page,
    }) => {
      const publicRoutes = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/check-email?email=test@example.com",
        "/verify-email",
        "/pending-approval",
        "/unauthorized",
      ];

      for (const route of publicRoutes) {
        // Try to access each public route
        await page.goto(route);

        // Should be able to access the page
        expect(page.url()).toContain(route.split("?")[0]); // Remove query params for comparison

        console.log(`✅ Public route ${route} accessible to unverified users`);
      }
    });
  });

  test.describe("Session Management for Unverified Users", () => {
    test("should not create session for unverified users", async ({ page }) => {
      const testEmail = emailUtils.generateTestEmail("session-test");

      // Register a new user
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="firstName"]', "Session");
      await page.fill('input[name="lastName"]', "Test");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      await page.click('button[type="submit"]');

      // Wait for redirect to check-email
      await page.waitForURL(/\/check-email/, { timeout: 10000 });

      // Check if there are any authentication cookies set
      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(
        (cookie) =>
          cookie.name.includes("auth") ||
          cookie.name.includes("session") ||
          cookie.name.includes("next-auth")
      );

      // Should not have authentication cookies
      expect(authCookies.length).toBe(0);

      console.log("✅ No authentication session created for unverified user");
    });
  });
});
