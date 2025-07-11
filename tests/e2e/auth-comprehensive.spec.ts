import { test, expect } from "@playwright/test";
import TestDataSetup from "./test-data-setup";
import {
  setupBasicEmailMocking,
  setupEmailErrorTesting,
  EmailTestHelpers,
  TEST_EMAILS,
} from "./email-test-helpers";

test.describe("Comprehensive Authentication E2E Tests", () => {
  // Setup and teardown
  test.beforeAll(async () => {
    // Setup test data before all tests
    await TestDataSetup.setupAllTestUsers();
  });

  test.afterAll(async () => {
    // Cleanup test data after all tests
    await TestDataSetup.cleanupTestData();
    await TestDataSetup.disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Clear any existing session/cookies before each test
    await page.context().clearCookies();

    // Set up basic email mocking for all tests by default
    await setupBasicEmailMocking(page);

    await page.goto("/");
  });

  test.describe("User Registration Flow", () => {
    test("should complete full registration process", async ({ page }) => {
      const testEmail = TestDataSetup.generateTestEmail();
      const testPassword = "TestPassword123!";

      // Navigate to registration page
      await page.goto("/register");

      // Verify registration form is visible
      await expect(
        page.locator('[data-testid="registration-form"]')
      ).toBeVisible();

      // Fill out registration form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Should redirect to check-email page
      await expect(page).toHaveURL(/.*check-email/);
      await expect(
        page.locator('[data-testid="email-sent-message"]')
      ).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      await page.goto("/register");

      // Try to submit without filling required fields
      await page.click('[data-testid="register-button"]');

      // Should show validation errors
      await expect(
        page.locator('[data-testid="validation-errors"]')
      ).toBeVisible();
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/register");

      // Fill form with weak password
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', "test@example.com");
      await page.fill('[data-testid="password-input"]', "weak");
      await page.fill('input[name="confirmPassword"]', "weak");

      await page.click('[data-testid="register-button"]');

      // Should show password validation error
      await expect(
        page.locator('[data-testid="password-error"]')
      ).toBeVisible();
    });

    test("should handle duplicate email registration", async ({ page }) => {
      await page.goto("/register");

      // Try to register with existing email
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      await page.click('[data-testid="register-button"]');

      // Should show error message for duplicate email
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test.describe("Email Verification Flow", () => {
    test("should verify email with valid token", async ({ page }) => {
      // Create a verification token for pending user
      const token = await TestDataSetup.createVerificationToken(
        TestDataSetup.PENDING_USER.email
      );

      // Navigate to verification page with token
      await page.goto(`/verify-email?token=${token}`);

      // Should show success message
      await expect(page.locator("text=Email Verified!")).toBeVisible();

      // Should redirect to pending approval page
      await expect(page).toHaveURL(/.*pending-approval/);
    });

    test("should handle invalid verification token", async ({ page }) => {
      // Navigate to verification page with invalid token
      await page.goto("/verify-email?token=invalid-token");

      // Should show error message
      await expect(page.locator("text=Verification Failed")).toBeVisible();
    });

    test("should handle missing verification token", async ({ page }) => {
      // Navigate to verification page without token
      await page.goto("/verify-email");

      // Should show error message
      await expect(page.locator("text=Verification Failed")).toBeVisible();
    });
  });

  test.describe("Login Flow", () => {
    test("should login successfully with approved user", async ({ page }) => {
      await page.goto("/login");

      // Fill login form
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );

      // Submit login
      await page.click('[data-testid="login-button"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test("should handle invalid credentials", async ({ page }) => {
      await page.goto("/login");

      // Fill login form with invalid credentials
      await page.fill('[data-testid="email-input"]', "invalid@example.com");
      await page.fill('[data-testid="password-input"]', "wrongpassword");

      await page.click('[data-testid="login-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    });

    test("should handle pending user login", async ({ page }) => {
      await page.goto("/login");

      // Fill login form with pending user
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.PENDING_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.PENDING_USER.password
      );

      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval page
      await expect(page).toHaveURL(/.*pending-approval/);
    });

    test("should handle suspended user login", async ({ page }) => {
      await page.goto("/login");

      // Fill login form with suspended user
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.SUSPENDED_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.SUSPENDED_USER.password
      );

      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval page with suspended status
      await expect(page).toHaveURL(/.*pending-approval/);
    });

    test("should handle rejected user login", async ({ page }) => {
      await page.goto("/login");

      // Fill login form with rejected user
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.REJECTED_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.REJECTED_USER.password
      );

      await page.click('[data-testid="login-button"]');

      // Should redirect to pending approval page with rejected status
      await expect(page).toHaveURL(/.*pending-approval/);
    });

    test("should validate required login fields", async ({ page }) => {
      await page.goto("/login");

      // Try to submit without filling fields
      await page.click('[data-testid="login-button"]');

      // Should show validation error
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    });

    test("should show loading state during login", async ({ page }) => {
      await page.goto("/login");

      // Fill login form
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );

      // Submit login and immediately check loading state
      await page.click('[data-testid="login-button"]');

      // Should show loading text
      await expect(page.locator("text=Signing in...")).toBeVisible();
    });
  });

  test.describe("Password Reset Flow", () => {
    test("should initiate password reset", async ({ page }) => {
      await page.goto("/forgot-password");

      // Fill email field
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );

      // Submit forgot password form
      await page.click('[data-testid="submit-button"]');

      // Should show success message
      await expect(page.locator("text=Reset link sent!")).toBeVisible();
    });

    test("should complete password reset with valid token", async ({
      page,
    }) => {
      // Create password reset token
      const token = await TestDataSetup.createPasswordResetToken(
        TestDataSetup.ADMIN_USER.email
      );

      // Navigate to reset password page with token
      await page.goto(`/reset-password?token=${token}`);

      // Should show reset password form
      await expect(
        page.locator('[data-testid="reset-password-form"]')
      ).toBeVisible();

      // Fill new password
      await page.fill('[data-testid="password-input"]', "NewPassword123!");
      await page.fill(
        '[data-testid="confirm-password-input"]',
        "NewPassword123!"
      );

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to login with success message
      await expect(page).toHaveURL(/.*login/);
      await expect(
        page.locator("text=password has been reset successfully")
      ).toBeVisible();
    });

    test("should handle invalid reset token", async ({ page }) => {
      // Navigate to reset password page with invalid token
      await page.goto("/reset-password?token=invalid-token");

      // Should show error message
      await expect(page.locator("text=Invalid or expired token")).toBeVisible();
    });

    test("should validate password matching in reset form", async ({
      page,
    }) => {
      // Create password reset token
      const token = await TestDataSetup.createPasswordResetToken(
        TestDataSetup.ADMIN_USER.email
      );

      await page.goto(`/reset-password?token=${token}`);

      // Fill non-matching passwords
      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.fill(
        '[data-testid="confirm-password-input"]',
        "DifferentPassword123!"
      );

      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator("text=Passwords don't match")).toBeVisible();
    });
  });

  test.describe("Role-Based Access Control", () => {
    test("should allow admin access to admin page", async ({ page }) => {
      // Login as admin
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Navigate to admin page
      await page.goto("/admin");

      // Should be able to access admin page
      await expect(
        page.locator('[data-testid="admin-dashboard"]')
      ).toBeVisible();
    });

    test("should deny staff access to admin page", async ({ page }) => {
      // Login as staff
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.STAFF_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.STAFF_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Try to navigate to admin page
      await page.goto("/admin");

      // Should be redirected to unauthorized page
      await expect(page).toHaveURL(/.*unauthorized/);
      await expect(
        page.locator('[data-testid="unauthorized-message"]')
      ).toBeVisible();
    });

    test("should allow manager access to inventory", async ({ page }) => {
      // Login as manager
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.MANAGER_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.MANAGER_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Navigate to inventory page
      await page.goto("/inventory");

      // Should be able to access inventory page
      await expect(page.locator("text=Inventory Management")).toBeVisible();
    });

    test("should allow all roles to access POS", async ({ page }) => {
      // Login as staff
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.STAFF_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.STAFF_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Navigate to POS page
      await page.goto("/pos");

      // Should be able to access POS page
      await expect(page.locator('[data-testid="pos-interface"]')).toBeVisible();
    });
  });

  test.describe("Session Management", () => {
    test("should require login for protected routes", async ({ page }) => {
      // Try to access protected route without login
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });

    test("should maintain session across page refreshes", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Navigate to dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/.*dashboard/);

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test("should logout successfully", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Navigate to logout page
      await page.goto("/logout");

      // Confirm logout
      await page.click("text=Confirm Logout");

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);

      // Try to access protected route - should redirect to login
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/.*login/);
    });

    test("should handle session timeout gracefully", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );
      await page.click('[data-testid="login-button"]');

      // Clear session cookie to simulate timeout
      await page.context().clearCookies();

      // Try to access protected route
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      // Intercept network requests to simulate failure
      await page.route("**/api/auth/register", (route) => {
        route.abort("failed");
      });

      await page.goto("/register");

      // Fill form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', "test@example.com");
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      await page.click('[data-testid="register-button"]');

      // Should show network error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test("should handle server errors gracefully", async ({ page }) => {
      // Intercept network requests to simulate server error
      await page.route("**/api/auth/register", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/register");

      // Fill form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', "test@example.com");
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      await page.click('[data-testid="register-button"]');

      // Should show server error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test("should handle malformed responses gracefully", async ({ page }) => {
      // Intercept network requests to simulate malformed response
      await page.route("**/api/auth/register", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "invalid json",
        });
      });

      await page.goto("/register");

      // Fill form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', "test@example.com");
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      await page.click('[data-testid="register-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test.describe("Form Validation and UX", () => {
    test("should show real-time validation feedback", async ({ page }) => {
      await page.goto("/register");

      // Fill invalid email
      await page.fill('[data-testid="email-input"]', "invalid-email");
      await page.locator('[data-testid="email-input"]').blur();

      // Should show email validation error
      await expect(
        page.locator("text=Please enter a valid email address")
      ).toBeVisible();
    });

    test("should clear validation errors when corrected", async ({ page }) => {
      await page.goto("/register");

      // Fill invalid email
      await page.fill('[data-testid="email-input"]', "invalid-email");
      await page.locator('[data-testid="email-input"]').blur();

      // Should show error
      await expect(
        page.locator("text=Please enter a valid email address")
      ).toBeVisible();

      // Correct the email
      await page.fill('[data-testid="email-input"]', "valid@example.com");
      await page.locator('[data-testid="email-input"]').blur();

      // Error should be cleared
      await expect(
        page.locator("text=Please enter a valid email address")
      ).not.toBeVisible();
    });

    test("should handle form submission while loading", async ({ page }) => {
      await page.goto("/login");

      // Fill form
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill(
        '[data-testid="password-input"]',
        TestDataSetup.ADMIN_USER.password
      );

      // Submit form
      await page.click('[data-testid="login-button"]');

      // Button should be disabled during loading
      await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
    });

    test("should show password strength indicator", async ({ page }) => {
      await page.goto("/register");

      // Fill weak password
      await page.fill('[data-testid="password-input"]', "weak");

      // Should show password strength feedback
      await expect(
        page.locator("text=Password must be at least 12 characters")
      ).toBeVisible();
    });

    test("should handle accessibility features", async ({ page }) => {
      await page.goto("/login");

      // Check form labels are properly associated
      const emailInput = page.locator('[data-testid="email-input"]');
      const emailLabel = page.locator('label[for="email"]');

      await expect(emailInput).toBeVisible();
      await expect(emailLabel).toBeVisible();

      // Check form has proper ARIA attributes
      await expect(page.locator("form")).toHaveAttribute("novalidate");
    });
  });

  test.describe("Email Integration Tests", () => {
    test("should handle successful email sending during registration", async ({
      page,
    }) => {
      const testEmail = EmailTestHelpers.generateTestEmail();

      // Set up email success mocking
      const emailHelper = new EmailTestHelpers(page);
      await emailHelper.setupEmailMocking();
      await emailHelper.mockSuccessfulEmail();

      await page.goto("/register");

      // Fill registration form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Should successfully redirect to check-email page
      await expect(page).toHaveURL(/.*check-email/);
      await expect(
        page.locator('[data-testid="email-sent-message"]')
      ).toBeVisible();
    });

    test("should handle email sending failure during registration", async ({
      page,
    }) => {
      const testEmail = EmailTestHelpers.generateTestEmail();

      // Set up email failure mocking
      const emailHelper = await setupEmailErrorTesting(page);

      await page.goto("/register");

      // Fill registration form
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Should show error message instead of redirecting
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test("should handle successful password reset email", async ({ page }) => {
      // Set up email success mocking
      const emailHelper = new EmailTestHelpers(page);
      await emailHelper.setupEmailMocking();
      await emailHelper.mockSuccessfulEmail();

      await page.goto("/forgot-password");

      // Fill email field with safe test address
      await page.fill('[data-testid="email-input"]', TEST_EMAILS.DELIVERED);
      await page.click('[data-testid="submit-button"]');

      // Should show success message
      await expect(page.locator("text=Reset link sent!")).toBeVisible();
    });

    test("should handle password reset email failure", async ({ page }) => {
      // Set up email failure mocking
      const emailHelper = await setupEmailErrorTesting(page);

      await page.goto("/forgot-password");

      // Fill email field
      await page.fill('[data-testid="email-input"]', TEST_EMAILS.DELIVERED);
      await page.click('[data-testid="submit-button"]');

      // Should show error message
      await expect(page.locator("text=Failed to send")).toBeVisible();
    });

    test("should handle email verification resend", async ({ page }) => {
      // Set up email success mocking
      const emailHelper = new EmailTestHelpers(page);
      await emailHelper.setupEmailMocking();
      await emailHelper.mockSuccessfulEmail();

      const testEmail = TEST_EMAILS.DELIVERED;

      await page.goto(`/check-email?email=${encodeURIComponent(testEmail)}`);

      // Try to resend verification email
      await page.fill('input[type="email"]', testEmail);
      await page.click("text=Resend Verification Email");

      // Should show success message
      await expect(page.locator("text=Verification email sent!")).toBeVisible();
    });

    test("should handle rate limiting for email sends", async ({ page }) => {
      // Set up rate limiting mocking
      const emailHelper = new EmailTestHelpers(page);
      await emailHelper.setupEmailMocking();
      await emailHelper.mockRateLimit();

      await page.goto("/forgot-password");

      // Fill email field
      await page.fill('[data-testid="email-input"]', TEST_EMAILS.DELIVERED);
      await page.click('[data-testid="submit-button"]');

      // Should show rate limit message
      await expect(page.locator("text=Rate limit")).toBeVisible();
    });

    test("should use safe test email addresses", async ({ page }) => {
      // Verify we're using safe test emails that won't impact deliverability
      const testEmail = EmailTestHelpers.getTestEmail("DELIVERED");
      expect(testEmail).toBe("delivered@resend.dev");

      const generatedTestEmail = EmailTestHelpers.generateTestEmail();
      expect(generatedTestEmail).toContain("@resend.dev");
    });
  });

  test.describe("Integration Tests", () => {
    test("should handle complete user journey from registration to dashboard", async ({
      page,
    }) => {
      const testEmail = EmailTestHelpers.generateTestEmail();
      const testPassword = "TestPassword123!";

      // 1. Register
      await page.goto("/register");
      await page.fill('[data-testid="firstName-input"]', "Test");
      await page.fill('[data-testid="lastName-input"]', "User");
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);
      await page.click('[data-testid="register-button"]');

      // 2. Check email page
      await expect(page).toHaveURL(/.*check-email/);

      // 3. Simulate email verification
      const token = await TestDataSetup.createVerificationToken(testEmail);
      await page.goto(`/verify-email?token=${token}`);
      await expect(page.locator("text=Email Verified!")).toBeVisible();

      // 4. Simulate admin approval
      await TestDataSetup.updateUserStatus(testEmail, "APPROVED");

      // 5. Login
      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', testPassword);
      await page.click('[data-testid="login-button"]');

      // 6. Should access dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test("should handle password reset journey", async ({ page }) => {
      // 1. Go to forgot password
      await page.goto("/forgot-password");
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.click('[data-testid="submit-button"]');

      // 2. Use reset token
      const token = await TestDataSetup.createPasswordResetToken(
        TestDataSetup.ADMIN_USER.email
      );
      await page.goto(`/reset-password?token=${token}`);

      // 3. Set new password
      await page.fill('[data-testid="password-input"]', "NewPassword123!");
      await page.fill(
        '[data-testid="confirm-password-input"]',
        "NewPassword123!"
      );
      await page.click('button[type="submit"]');

      // 4. Should redirect to login
      await expect(page).toHaveURL(/.*login/);

      // 5. Login with new password
      await page.fill(
        '[data-testid="email-input"]',
        TestDataSetup.ADMIN_USER.email
      );
      await page.fill('[data-testid="password-input"]', "NewPassword123!");
      await page.click('[data-testid="login-button"]');

      // 6. Should access dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });
});
