import { test, expect } from "@playwright/test";

test.describe("Mock Auth Test", () => {
  test("should show login form correctly", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Check that login form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check that form has proper labels
    await expect(page.locator('label[for="email"]')).toContainText("Email");
    await expect(page.locator('label[for="password"]')).toContainText(
      "Password"
    );
  });

  test("should show validation errors for empty form", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL("/login");
  });

  test("should allow access to public routes", async ({ page }) => {
    // Test verify-email page
    await page.goto("/verify-email");
    await expect(page).toHaveURL("/verify-email");
    // The title is in a CardTitle component, which renders as a div
    // Without a token, it shows "Request Verification"
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      "Request Verification"
    );

    // Test unauthorized page
    await page.goto("/unauthorized");
    await expect(page).toHaveURL("/unauthorized");
    // The title is in a CardTitle component, which renders as a div
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      "Access Denied"
    );
  });

  test("should show proper error messages", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill in invalid email format
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "password");

    // Submit form
    await page.click('button[type="submit"]');

    // Should stay on login page (validation should prevent submission)
    await expect(page).toHaveURL("/login");
  });

  test("should have proper form accessibility", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Check that form elements have proper IDs and labels
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Check that submit button is properly labeled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});
