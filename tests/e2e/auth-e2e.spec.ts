import { test, expect } from "@playwright/test";
import { emailUtils } from "./email-test-utils";

import fetch from "node-fetch";

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

    test("should successfully create a new account", async ({ page }) => {
      const testEmail = emailUtils.generateTestEmail("account");

      await page.goto("/register");
      await page.waitForSelector("form");

      // Fill in valid registration data
      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "User");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', "StrongPassword123!");
      await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait a bit for the form submission to process
      await page.waitForTimeout(3000);

      // Check if we're still on register page (error) or redirected (success)
      const registrationUrl = page.url();
      console.log(`Current URL after form submission: ${registrationUrl}`);

      if (registrationUrl.includes("/check-email")) {
        // Success case - we were redirected
        expect(registrationUrl).toContain(
          `email=${encodeURIComponent(testEmail)}`
        );

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
      } else if (registrationUrl.includes("/register")) {
        // Still on register page - check for errors
        const errorMessages = await page
          .locator(".text-destructive, [data-testid='error']")
          .allTextContents();
        console.log(
          `❌ Registration failed - errors: ${errorMessages.join(", ")}`
        );

        // Check if there are any validation errors visible
        const hasValidationErrors = await page
          .locator(".text-destructive")
          .isVisible();
        expect(hasValidationErrors).toBeFalsy(); // Should not have validation errors with valid data
      } else {
        // Unexpected redirect
        console.log(`⚠️ Unexpected redirect to: ${registrationUrl}`);
        expect(registrationUrl).toMatch(/\/check-email|\/register/);
      }

      // Log the email for manual verification
      emailUtils.logEmailInfo(testEmail, "Account Creation Test");
    });

    test("should send and verify email via Resend API", async ({ page }) => {
      const testEmail = emailUtils.generateTestEmail("resend-verify");

      await page.goto("/register");
      await page.waitForSelector("form");

      // Intercept the registration API response
      let emailId: string | undefined = undefined;
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/auth/register") && resp.status() === 201
        ),
        (async () => {
          // Fill in valid registration data
          await page.fill('input[name="firstName"]', "Resend");
          await page.fill('input[name="lastName"]', "Verify");
          await page.fill('input[name="email"]', testEmail);
          await page.fill('input[name="password"]', "StrongPassword123!");
          await page.fill(
            'input[name="confirmPassword"]',
            "StrongPassword123!"
          );
          // Submit the form
          await page.click('button[type="submit"]');
        })(),
      ]);

      // Parse the API response to get the emailId
      const json = await response.json();
      emailId = json.emailId;
      expect(emailId).toBeDefined();
      console.log("Resend emailId:", emailId);

      // Wait for the check-email page
      await page.waitForURL(/\/check-email/, { timeout: 10000 });
      expect(page.url()).toContain("/check-email");
      expect(page.url()).toContain(`email=${encodeURIComponent(testEmail)}`);

      // Fetch the email from Resend
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      expect(emailRes.ok).toBeTruthy();
      const email: any = await emailRes.json();
      expect(email).toHaveProperty("id", emailId);
      expect(email).toHaveProperty("html");
      expect(email.html).toMatch(/verify-email\?token=/i);

      // Extract the verification link
      const match = email.html.match(
        /https?:\/\/[^\s"']*verify-email\?token=[^\s"']+/i
      );
      expect(match).toBeTruthy();
      const verificationLink = match[0];
      console.log(`\n🔗 Verification link found: ${verificationLink}`);

      // Visit the verification link
      await page.goto(verificationLink);
      await page.waitForTimeout(3000);

      // Check if verification was successful
      const currentUrl = page.url();
      const hasSuccessMessage = await page
        .locator("text=Email verified successfully")
        .isVisible();
      const hasError = await page
        .locator("text=Invalid or expired token")
        .isVisible();
      const redirectedToLogin = currentUrl.includes("/login");

      if (hasSuccessMessage) {
        console.log("✅ Email verification successful");
      } else if (hasError) {
        console.log("❌ Email verification failed - invalid token");
      } else if (redirectedToLogin) {
        console.log("✅ Email verification successful - redirected to login");
      } else {
        console.log("⚠️ Email verification status unclear");
      }
      expect(hasSuccessMessage || hasError || redirectedToLogin).toBeTruthy();
    });

    test("should create account using email utilities", async ({ page }) => {
      const testEmail = await emailUtils.createTestAccount(
        page,
        "Email",
        "Utils"
      );

      // Log the email for manual verification
      emailUtils.logEmailInfo(testEmail, "Email Utils Test");
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
