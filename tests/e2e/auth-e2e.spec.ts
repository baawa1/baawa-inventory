import { test, expect } from "@playwright/test";

test.describe("Authentication E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data before each test
    await page.goto("/");
  });

  test.describe("User Registration Flow", () => {
    test("should complete full registration workflow", async ({ page }) => {
      // Navigate to registration page
      await page.goto("/register");
      await expect(
        page.locator('[data-testid="registration-form"]')
      ).toBeVisible();

      // Fill out registration form
      await page.fill('[data-testid="email-input"]', "e2e.test@example.com");
      await page.fill('[data-testid="password-input"]', "SecurePassword123!");
      await page.fill('[data-testid="firstName-input"]', "E2E");
      await page.fill('[data-testid="lastName-input"]', "Test");

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Verify redirect to email check page
      await expect(page).toHaveURL("/check-email");
      await expect(
        page.locator('[data-testid="email-sent-message"]')
      ).toBeVisible();

      const message = await page
        .locator('[data-testid="email-sent-message"]')
        .textContent();
      expect(message).toContain("verification email has been sent");
    });

    test("should handle registration with existing email", async ({ page }) => {
      await page.goto("/register");
      await expect(
        page.locator('[data-testid="registration-form"]')
      ).toBeVisible();

      // Try to register with existing email
      await page.fill('[data-testid="email-input"]', "existing@example.com");
      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.fill('[data-testid="firstName-input"]', "Existing");
      await page.fill('[data-testid="lastName-input"]', "User");

      await page.click('[data-testid="register-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      const errorMessage = await page
        .locator('[data-testid="error-message"]')
        .textContent();
      expect(errorMessage).toContain("Email already exists");
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
      expect(errors).toContain("Email is required");
      expect(errors).toContain("Password is required");
      expect(errors).toContain("First name is required");
      expect(errors).toContain("Last name is required");
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
      expect(passwordError).toContain("Password must be at least 8 characters");
    });
  });

  test.describe("User Login Flow", () => {
    test("should complete successful login for approved user", async ({
      page,
    }) => {
      // Navigate to login page
      await page.goto("/login");
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Fill credentials for approved user
      await page.fill(
        '[data-testid="email-input"]',
        "approved.user@example.com"
      );
      await page.fill('[data-testid="password-input"]', "Password123!");

      // Submit login
      await page.click('[data-testid="login-button"]');

      // Verify redirect to dashboard
      await expect(page).toHaveURL("/dashboard");
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      const userMenu = await page
        .locator('[data-testid="user-menu"]')
        .textContent();
      expect(userMenu).toContain("approved.user@example.com");
    });

    test("should handle login for pending user", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Login as pending user
      await page.fill(
        '[data-testid="email-input"]',
        "pending.user@example.com"
      );
      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval
      await expect(page).toHaveURL("/pending-approval");
      await expect(
        page.locator('[data-testid="pending-approval-message"]')
      ).toBeVisible();
    });

    test("should handle login for suspended user", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Login as suspended user
      await page.fill(
        '[data-testid="email-input"]',
        "suspended.user@example.com"
      );
      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.click('[data-testid="login-button"]');

      // Should show suspended message
      await expect(
        page.locator('[data-testid="suspended-message"]')
      ).toBeVisible();
      const message = await page
        .locator('[data-testid="suspended-message"]')
        .textContent();
      expect(message).toContain("account has been suspended");
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
      expect(error).toContain("Invalid credentials");
    });

    test("should handle account lockout", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Try multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('[data-testid="email-input"]', "locked@example.com");
        await page.fill('[data-testid="password-input"]', "wrongpassword");
        await page.click('[data-testid="login-button"]');
        await page.waitForTimeout(100); // Small delay between attempts
      }

      // Should show lockout message
      await expect(
        page.locator('[data-testid="lockout-message"]')
      ).toBeVisible();
      const lockoutMessage = await page
        .locator('[data-testid="lockout-message"]')
        .textContent();
      expect(lockoutMessage).toContain("Account locked");
    });
  });

  test.describe("Password Reset Flow", () => {
    test("should complete full password reset workflow", async ({ page }) => {
      // Navigate to forgot password page
      await page.goto("/forgot-password");
      await expect(
        page.locator('[data-testid="forgot-password-form"]')
      ).toBeVisible();

      // Request password reset
      await page.fill('[data-testid="email-input"]', "test@example.com");
      await page.click('[data-testid="submit-button"]');

      // Verify success message
      await expect(
        page.locator('[data-testid="reset-sent-message"]')
      ).toBeVisible();
      const message = await page
        .locator('[data-testid="reset-sent-message"]')
        .textContent();
      expect(message).toContain("password reset email has been sent");

      // Simulate clicking reset link from email
      const resetToken = "mock-reset-token";
      await page.goto(`/reset-password?token=${resetToken}`);

      // Fill new password
      await page.fill('[data-testid="password-input"]', "NewPassword123!");
      await page.fill(
        '[data-testid="confirm-password-input"]',
        "NewPassword123!"
      );
      await page.click('[data-testid="reset-button"]');

      // Verify success redirect
      await expect(page).toHaveURL("/login");
    });

    test("should handle expired reset token", async ({ page }) => {
      const expiredToken = "expired-token";
      await page.goto(`/reset-password?token=${expiredToken}`);

      await expect(page.locator('[data-testid="token-error"]')).toBeVisible();
      const error = await page
        .locator('[data-testid="token-error"]')
        .textContent();
      expect(error).toContain("expired or invalid");
    });

    test("should validate password confirmation", async ({ page }) => {
      const resetToken = "valid-token";
      await page.goto(`/reset-password?token=${resetToken}`);

      // Fill mismatched passwords
      await page.fill('[data-testid="password-input"]', "NewPassword123!");
      await page.fill(
        '[data-testid="confirm-password-input"]',
        "DifferentPassword123!"
      );
      await page.click('[data-testid="reset-button"]');

      // Should show error
      await expect(
        page.locator('[data-testid="password-mismatch-error"]')
      ).toBeVisible();
      const error = await page
        .locator('[data-testid="password-mismatch-error"]')
        .textContent();
      expect(error).toContain("Passwords do not match");
    });
  });

  test.describe("RBAC Tests", () => {
    test("should enforce admin-only access", async ({ page }) => {
      // Try to access admin page as non-admin user
      await page.goto("/admin");

      // Should redirect to unauthorized page
      await expect(page).toHaveURL("/unauthorized");
      await expect(
        page.locator('[data-testid="unauthorized-message"]')
      ).toBeVisible();
      const message = await page
        .locator('[data-testid="unauthorized-message"]')
        .textContent();
      expect(message).toContain("not authorized to access this page");
    });

    test("should allow admin access to all routes", async ({ page }) => {
      // Login as admin first
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', "admin@example.com");
      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.click('[data-testid="login-button"]');

      // Should be able to access admin page
      await page.goto("/admin");
      await expect(
        page.locator('[data-testid="admin-dashboard"]')
      ).toBeVisible();
    });
  });
});
