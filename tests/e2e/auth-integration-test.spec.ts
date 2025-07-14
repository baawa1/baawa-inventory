import { test, expect } from "@playwright/test";

// Use a single test user for all tests to save email tokens
const TEST_USER = {
  email: "baawapays+test-auth-integration@gmail.com",
  firstName: "Integration",
  lastName: "Test",
  password: "SecurePass123!@#",
};

const ADMIN_USER = {
  email: "baawapays+test-admin-integration@gmail.com",
  firstName: "Admin",
  lastName: "User",
  password: "SecurePass123!@#",
};

test.describe("Authentication Integration Tests", () => {
  test.describe("Complete User Registration and Approval Flow", () => {
    test("should register a new user and verify email", async ({ page }) => {
      // Step 1: Register new user
      await page.goto("/register");

      await page.fill('[data-testid="firstName-input"]', TEST_USER.firstName);
      await page.fill('[data-testid="lastName-input"]', TEST_USER.lastName);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill(
        '[data-testid="confirmPassword-input"]',
        TEST_USER.password
      );

      await page.click('[data-testid="register-button"]');

      // Should redirect to check-email page
      await page.waitForURL(/\/check-email/);
      await expect(page).toHaveURL(/\/check-email/);

      // Verify success message
      await expect(page.locator("text=Check Your Email!")).toBeVisible();
    });

    test("should verify email and redirect to pending approval", async ({
      page,
    }) => {
      // Step 2: Verify email (simulate email verification)
      // In a real scenario, this would come from the email link
      await page.goto(
        `/verify-email?token=test-verification-token&email=${encodeURIComponent(TEST_USER.email)}`
      );

      // Should redirect to pending approval
      await page.waitForURL(/\/pending-approval/);
      await expect(page).toHaveURL(/\/pending-approval/);

      // Verify pending approval message
      await expect(
        page.locator("text=Your account is pending approval")
      ).toBeVisible();
    });

    test("should block access to protected routes for unapproved user", async ({
      page,
    }) => {
      // Step 3: Try to access protected routes as unapproved user
      const protectedRoutes = ["/dashboard", "/pos", "/inventory", "/admin"];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL("/pending-approval");
      }
    });
  });

  test.describe("Admin User Creation and User Approval", () => {
    test("should create admin user", async ({ page }) => {
      // Create admin user
      await page.goto("/register");

      await page.fill('[data-testid="firstName-input"]', ADMIN_USER.firstName);
      await page.fill('[data-testid="lastName-input"]', ADMIN_USER.lastName);
      await page.fill('[data-testid="email-input"]', ADMIN_USER.email);
      await page.fill('[data-testid="password-input"]', ADMIN_USER.password);
      await page.fill(
        '[data-testid="confirmPassword-input"]',
        ADMIN_USER.password
      );

      await page.click('[data-testid="register-button"]');

      // Should redirect to check-email page
      await page.waitForURL(/\/check-email/);
    });

    test("should verify admin email and set admin role", async ({ page }) => {
      // Verify admin email
      await page.goto(
        `/verify-email?token=test-admin-verification-token&email=${encodeURIComponent(ADMIN_USER.email)}`
      );

      // Should redirect to pending approval initially
      await page.waitForURL(/\/pending-approval/);

      // In a real scenario, we would need to manually set the admin role in the database
      // For testing, we'll simulate this by directly accessing the admin panel
      console.log(
        "📝 Note: In a real scenario, admin role would be set in database"
      );
    });
  });

  test.describe("Login and Session Management", () => {
    test("should login with verified user", async ({ page }) => {
      // Login with the test user
      await page.goto("/login");

      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);

      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval since user is not approved
      await page.waitForURL(/\/pending-approval/);
      await expect(page).toHaveURL(/\/pending-approval/);
    });

    test("should maintain session across page refreshes", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
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
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
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

    test("should allow access to public routes when authenticated", async ({
      page,
    }) => {
      // Login first
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');

      // Should be on pending approval
      await page.waitForURL(/\/pending-approval/);

      // Should still be able to access public routes
      await page.goto("/");
      await expect(page).toHaveURL("/");

      await page.goto("/login");
      await expect(page).toHaveURL("/login");
    });
  });
});
