import { test, expect } from "@playwright/test";

test.describe("Simple Auth Test", () => {
  test("should login with admin user and access dashboard", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill in login form with admin credentials
    await page.fill('input[name="email"]', "baawapays+test-admin@gmail.com");
    await page.fill('input[name="password"]', "SecurePassword123!");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard");

    // Verify we're on the dashboard
    await expect(page).toHaveURL("/dashboard");

    // Check that we can see dashboard content
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should redirect unapproved users to pending approval", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill in login form with verified unapproved user
    await page.fill(
      'input[name="email"]',
      "baawapays+test-verified-unapproved@gmail.com"
    );
    await page.fill('input[name="password"]', "SecurePassword123!");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to pending approval
    await page.waitForURL("/pending-approval");

    // Verify we're on the pending approval page
    await expect(page).toHaveURL("/pending-approval");

    // Check that we can see pending approval content
    await expect(page.locator("h1")).toContainText("Pending Approval");
  });

  test("should redirect rejected users to unauthorized", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill in login form with rejected user
    await page.fill('input[name="email"]', "baawapays+test-rejected@gmail.com");
    await page.fill('input[name="password"]', "SecurePassword123!");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to unauthorized
    await page.waitForURL("/unauthorized");

    // Verify we're on the unauthorized page
    await expect(page).toHaveURL("/unauthorized");

    // Check that we can see unauthorized content
    await expect(page.locator("h1")).toContainText("Unauthorized");
  });

  test("should allow access to public routes without authentication", async ({
    page,
  }) => {
    // Test verify-email page
    await page.goto("/verify-email");
    await expect(page).toHaveURL("/verify-email");

    // Test pending-approval page
    await page.goto("/pending-approval");
    await expect(page).toHaveURL("/pending-approval");

    // Test unauthorized page
    await page.goto("/unauthorized");
    await expect(page).toHaveURL("/unauthorized");
  });
});
