import { test, expect } from "@playwright/test";

test.describe("Reset Password End-to-End Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reset password page with a valid token
    await page.goto("/reset-password?token=valid-test-token");
  });

  test("complete password reset flow with valid token", async ({ page }) => {
    // Mock the API responses
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true }),
      });
    });

    await page.route("/api/auth/reset-password", async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || "{}");

      // Validate the request data
      expect(postData.token).toBe("valid-test-token");
      expect(postData.password).toBe("StrongPass123!");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Password reset successfully" }),
      });
    });

    // Wait for the form to load
    await expect(page.getByText("Set New Password")).toBeVisible();
    await expect(page.getByText("Enter your new password below")).toBeVisible();

    // Fill out the form
    await page.getByTestId("password-input").fill("StrongPass123!");
    await page.getByTestId("confirm-password-input").fill("StrongPass123!");

    // Submit the form
    await page.getByTestId("reset-button").click();

    // Check loading state
    await expect(page.getByText("Resetting...")).toBeVisible();
    await expect(page.getByTestId("reset-button")).toBeDisabled();

    // Wait for redirect to login page
    await expect(page).toHaveURL(/\/login\?message=password-reset-success/);
  });

  test("shows error for invalid token", async ({ page }) => {
    // Navigate to reset password page with invalid token
    await page.goto("/reset-password?token=invalid-token");

    // Mock the API response for invalid token
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid token" }),
      });
    });

    // Wait for error message
    await expect(page.getByText("Invalid Reset Link")).toBeVisible();
    await expect(
      page.getByText(/This password reset link is invalid or has expired/)
    ).toBeVisible();
    await expect(page.getByTestId("token-error")).toBeVisible();
  });

  test("shows error for expired token", async ({ page }) => {
    // Mock the API response for expired token
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Token expired" }),
      });
    });

    // Wait for error message
    await expect(page.getByText("Invalid Reset Link")).toBeVisible();
    await expect(
      page.getByText(/This password reset link is invalid or has expired/)
    ).toBeVisible();
  });

  test("shows error for API failure during password reset", async ({
    page,
  }) => {
    // Mock the token validation to succeed
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true }),
      });
    });

    // Mock the password reset to fail
    await page.route("/api/auth/reset-password", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Token expired" }),
      });
    });

    // Fill out the form
    await page.getByTestId("password-input").fill("StrongPass123!");
    await page.getByTestId("confirm-password-input").fill("StrongPass123!");

    // Submit the form
    await page.getByTestId("reset-button").click();

    // Check error message
    await expect(page.getByText("Token expired")).toBeVisible();
    await expect(page.getByTestId("password-mismatch-error")).toBeVisible();
  });

  test("validates password requirements in real-time", async ({ page }) => {
    // Mock the token validation to succeed
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true }),
      });
    });

    // Test weak password
    await page.getByTestId("password-input").fill("weak");
    await page.getByTestId("password-input").blur();

    // Check validation error
    await expect(
      page.getByText("Password must be at least 12 characters")
    ).toBeVisible();

    // Test password without special character
    await page.getByTestId("password-input").fill("StrongPass123");
    await page.getByTestId("password-input").blur();

    // Check validation error
    await expect(
      page.getByText(/Password must contain at least one special character/)
    ).toBeVisible();

    // Test valid password
    await page.getByTestId("password-input").fill("StrongPass123!");
    await page.getByTestId("password-input").blur();

    // Should not show validation error
    await expect(page.getByText(/Password must contain/)).not.toBeVisible();
  });

  test("validates password confirmation match", async ({ page }) => {
    // Mock the token validation to succeed
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true }),
      });
    });

    // Fill passwords that don't match
    await page.getByTestId("password-input").fill("StrongPass123!");
    await page.getByTestId("confirm-password-input").fill("DifferentPass123!");

    // Submit the form
    await page.getByTestId("reset-button").click();

    // Check validation error
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("navigates to forgot password page from invalid token state", async ({
    page,
  }) => {
    // Navigate to reset password page with no token
    await page.goto("/reset-password");

    // Wait for error message
    await expect(page.getByText("Invalid Reset Link")).toBeVisible();

    // Click the "Request New Reset Link" button
    await page.getByText("Request New Reset Link").click();

    // Should navigate to forgot password page
    await expect(page).toHaveURL("/forgot-password");
  });

  test("prevents form submission with invalid data", async ({ page }) => {
    // Mock the token validation to succeed
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true }),
      });
    });

    // Don't mock the password reset endpoint - it shouldn't be called

    // Fill invalid password
    await page.getByTestId("password-input").fill("weak");
    await page.getByTestId("confirm-password-input").fill("weak");

    // Submit the form
    await page.getByTestId("reset-button").click();

    // Should show validation error and not make API call
    await expect(
      page.getByText("Password must be at least 12 characters")
    ).toBeVisible();
  });

  test("handles network errors gracefully", async ({ page }) => {
    // Mock the token validation to succeed
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true }),
      });
    });

    // Mock network error for password reset
    await page.route("/api/auth/reset-password", async (route) => {
      await route.abort("failed");
    });

    // Fill out the form
    await page.getByTestId("password-input").fill("StrongPass123!");
    await page.getByTestId("confirm-password-input").fill("StrongPass123!");

    // Submit the form
    await page.getByTestId("reset-button").click();

    // Check error message
    await expect(page.getByText("An error occurred")).toBeVisible();
  });

  test("form is accessible", async ({ page }) => {
    // Mock the token validation to succeed
    await page.route("/api/auth/validate-reset-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true }),
      });
    });

    // Check form labels and associations
    await expect(page.getByLabel("New Password")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();

    // Check input types
    await expect(page.getByTestId("password-input")).toHaveAttribute(
      "type",
      "password"
    );
    await expect(page.getByTestId("confirm-password-input")).toHaveAttribute(
      "type",
      "password"
    );

    // Check button state
    await expect(page.getByTestId("reset-button")).toBeEnabled();
    await expect(page.getByTestId("reset-button")).toHaveText("Reset Password");
  });
});
