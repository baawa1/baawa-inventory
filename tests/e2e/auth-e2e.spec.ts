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
      await expect(
        page.locator('[data-testid="registration-form"]')
      ).toBeVisible();

      // Verify form fields are present
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

    test("should validate required fields", async ({ page }) => {
      await page.goto("/register");
      await expect(
        page.locator('[data-testid="registration-form"]')
      ).toBeVisible();

      // Try to submit without filling required fields
      await page.click('[data-testid="register-button"]');

      // Should show validation errors
      await expect(
        page.locator('[data-testid="validation-errors"]')
      ).toBeVisible();

      const errors = await page
        .locator('[data-testid="validation-errors"]')
        .textContent();
      expect(errors).toContain("First name must be at least 2 characters");
      expect(errors).toContain("Last name must be at least 2 characters");
      expect(errors).toContain("Please enter a valid email address");
      expect(errors).toContain("Password must be at least 12 characters");
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/register");
      await expect(
        page.locator('[data-testid="registration-form"]')
      ).toBeVisible();

      await page.fill('[data-testid="email-input"]', "test@example.com");
      await page.fill('[data-testid="password-input"]', "123"); // Weak password
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");

      await page.click('[data-testid="register-button"]');

      await expect(
        page.locator('[data-testid="password-error"]')
      ).toBeVisible();
      const passwordError = await page
        .locator('[data-testid="password-error"]')
        .textContent();
      expect(passwordError).toContain(
        "Password must be at least 12 characters"
      );
    });
  });

  test.describe("User Login Flow", () => {
    test("should show login form", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Verify form fields are present
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    });

    test("should handle invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Try invalid credentials
      await page.fill('[data-testid="email-input"]', "invalid@example.com");
      await page.fill('[data-testid="password-input"]', "wrongpassword");
      await page.click('[data-testid="login-button"]');

      // Should show error
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      const error = await page
        .locator('[data-testid="login-error"]')
        .textContent();
      expect(error).toContain("Invalid email or password");
    });

    test("should validate login form fields", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Try to submit without filling required fields
      await page.click('[data-testid="login-button"]');

      // Should show validation errors
      await expect(
        page.locator('[data-testid="validation-errors"]')
      ).toBeVisible();
    });
  });

  test.describe("Password Reset Flow", () => {
    test("should show forgot password form", async ({ page }) => {
      // Navigate to forgot password page
      await page.goto("/forgot-password");
      await expect(
        page.locator('[data-testid="forgot-password-form"]')
      ).toBeVisible();
    });

    test("should show reset password form with token", async ({ page }) => {
      const resetToken = "valid-token";
      await page.goto(`/reset-password?token=${resetToken}`);

      // Should show either the reset password form or an error message
      const form = page.locator('[data-testid="reset-password-form"]');
      const error = page.locator('[data-testid="token-error"]');

      // Wait for either the form or error to be visible
      await expect(form.or(error)).toBeVisible();

      // If there's an error, it should contain the expected message
      if (await error.isVisible()) {
        const errorText = await error.textContent();
        expect(errorText).toContain("invalid or has expired");
      } else {
        // If the form is visible, verify it has the expected fields
        await expect(
          page.locator('[data-testid="password-input"]')
        ).toBeVisible();
        await expect(
          page.locator('[data-testid="confirm-password-input"]')
        ).toBeVisible();
      }
    });
  });

  test.describe("RBAC Tests", () => {
    test("should enforce admin-only access", async ({ page }) => {
      // Try to access admin page as non-admin user (not logged in)
      await page.goto("/admin");

      // Should redirect to login page with callback URL
      await expect(page).toHaveURL(/\/login\?callbackUrl=/);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });
});
