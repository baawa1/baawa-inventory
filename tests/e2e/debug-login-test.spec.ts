import { test, expect } from "@playwright/test";
import { APPROVED_ADMIN } from "./test-user-helper";

test.describe("Debug Login Test", () => {
  test("should debug login process", async ({ page }) => {
    // Go to login page
    await page.goto("/login");
    console.log("✅ Navigated to login page");

    // Fill in login form with approved admin user
    await page.fill('input[name="email"]', APPROVED_ADMIN.email);
    await page.fill('input[name="password"]', APPROVED_ADMIN.password);
    console.log(`✅ Filled in login form with ${APPROVED_ADMIN.email}`);

    // Click submit
    await page.click('button[type="submit"]');
    console.log("✅ Clicked submit button");

    // Wait for navigation or error
    try {
      // Wait for either a redirect or an error message
      await Promise.race([
        page.waitForURL(/\/dashboard/, { timeout: 10000 }),
        page.waitForURL(/\/pending-approval/, { timeout: 10000 }),
        page.waitForURL(/\/unauthorized/, { timeout: 10000 }),
        page.waitForSelector('[data-testid="login-error"]', { timeout: 10000 }),
      ]);
    } catch (error) {
      console.log("⏰ No redirect or error detected within 10 seconds");
    }

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Check if there are any error messages
    const errorElements = await page
      .locator('.text-destructive, [data-testid="login-error"], .error')
      .all();
    if (errorElements.length > 0) {
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log(`❌ Error message: ${errorText}`);
      }
    } else {
      console.log("✅ No error messages found");
    }

    // Check if we're still on login page
    if (currentUrl.includes("/login")) {
      console.log("⚠️ Still on login page - login may have failed");

      // Check if there's a loading state
      const loadingButton = await page
        .locator('button:has-text("Signing in...")')
        .count();
      if (loadingButton > 0) {
        console.log("⏳ Login is still in progress (loading state)");
      }
    } else {
      console.log(`✅ Successfully redirected to: ${currentUrl}`);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: "debug-login-test.png" });
    console.log("📸 Screenshot saved as debug-login-test.png");
  });
});
