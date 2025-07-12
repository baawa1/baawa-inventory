import { test, expect } from "@playwright/test";

test.describe("Unverified Email Basic Access Control", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data before each test
    await page.goto("/");
  });

  test("should redirect unverified users to login when accessing protected routes", async ({
    page,
  }) => {
    // Try to access a protected route without being logged in
    await page.goto("/dashboard");

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");

    console.log("✅ Unverified user correctly redirected to login");
  });

  test("should allow access to public routes", async ({ page }) => {
    // Try to access public routes
    const publicRoutes = ["/", "/login", "/register"];

    for (const route of publicRoutes) {
      await page.goto(route);
      expect(page.url()).toContain(route);
      console.log(`✅ Public route ${route} accessible`);
    }
  });

  test("should show registration form", async ({ page }) => {
    await page.goto("/register");
    await page.waitForSelector("form");

    // Check for form fields
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    console.log("✅ Registration form accessible");
  });

  test("should redirect to check-email after registration", async ({
    page,
  }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.waitForSelector("form");

    // Fill registration form
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "StrongPassword123!");
    await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

    await page.click('button[type="submit"]');

    // Should be redirected to check-email
    await page.waitForURL(/\/check-email/, { timeout: 10000 });
    expect(page.url()).toContain("/check-email");

    console.log("✅ Registration redirects to check-email");
  });
});
