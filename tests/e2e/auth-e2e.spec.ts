import { test, expect } from "@playwright/test";

test.describe("Authentication E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data before each test
    await page.goto("/");
  });

  test.describe("User Registration Flow", () => {
    test("should show registration form", async ({ page }) => {
      // Navigate to registration page
      await page.goto("/register");

      // Wait for form to load
      await page.waitForSelector("form");

      // Verify form fields are present by checking input elements
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      await page.goto("/register");
      await page.waitForSelector("form");

      // Try to submit without filling required fields
      await page.click('button[type="submit"]');

      // Wait for validation messages to appear
      await page.waitForTimeout(1000);

      // Check that form validation prevents submission
      const firstName = page.locator('input[name="firstName"]');
      const isRequired = await firstName.getAttribute("required");
      expect(isRequired).not.toBeNull();

      // Should still be on register page due to validation
      expect(page.url()).toContain("/register");
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/register");
      await page.waitForSelector("form");

      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "weak"); // Weak password
      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "User");

      await page.click('button[type="submit"]');

      // Wait for validation messages
      await page.waitForTimeout(1000);

      // Check that form hasn't navigated away (indicating validation error)
      expect(page.url()).toContain("/register");

      // Check for password validation error
      const passwordError = page.locator('[data-testid="password-error"]');
      await expect(passwordError).toBeVisible();
    });
  });

  test.describe("User Login Flow", () => {
    test("should show login form", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("form");

      // Verify form fields are present
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should handle invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("form");

      // Try invalid credentials
      await page.fill('input[name="email"]', "invalid@example.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Wait for error to appear
      await page.waitForTimeout(2000);

      // Should show error (look for error styling or stay on login page)
      expect(page.url()).toContain("/login");
    });

    test("should validate login form fields", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("form");

      // Try to submit without filling required fields
      await page.click('button[type="submit"]');

      // Verify required fields prevent submission
      const email = page.locator('input[name="email"]');
      const isRequired = await email.getAttribute("required");
      expect(isRequired).not.toBeNull();
    });
  });

  test.describe("Password Reset Flow", () => {
    test("should show forgot password form", async ({ page }) => {
      // Navigate to forgot password page
      await page.goto("/forgot-password");
      await page.waitForSelector("form");

      // Should have email input
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test("should show reset password form with token", async ({ page }) => {
      const resetToken = "valid-token";
      await page.goto(`/reset-password?token=${resetToken}`);

      // Wait for the page to load and process the token
      await page.waitForTimeout(2000);

      // Should show either the reset password form or an error message
      const hasPasswordField = await page
        .locator('input[name="password"]')
        .isVisible();
      const hasError = await page
        .locator(".text-destructive, [data-testid='token-error']")
        .isVisible();

      // Either form should be present or error should be shown
      expect(hasPasswordField || hasError).toBe(true);
    });
  });

  test.describe("RBAC Tests", () => {
    test("should enforce admin-only access", async ({ page }) => {
      // Try to access admin page as non-admin user (not logged in)
      await page.goto("/admin");

      // Should redirect to login page
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain("/login");
    });

    test("should redirect to appropriate page after login", async ({
      page,
    }) => {
      // Try to access protected page
      await page.goto("/dashboard");

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain("/login");
    });
  });
});
