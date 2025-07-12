import { test, expect } from "@playwright/test";

test("Debug registration flow", async ({ page }) => {
  const testEmail = `debug-test-${Date.now()}@gmail.com`;

  // Go to registration page
  await page.goto("/register");

  // Wait for form to load
  await page.waitForSelector("form");

  // Fill the form
  await page.fill('input[name="firstName"]', "Debug");
  await page.fill('input[name="lastName"]', "Test");
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', "StrongPassword123!");
  await page.fill('input[name="confirmPassword"]', "StrongPassword123!");

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for response
  await page.waitForTimeout(2000);

  // Check what page we're on
  console.log("Current URL:", page.url());

  // Take a screenshot
  await page.screenshot({ path: "debug-registration.png" });

  // Check if success message is visible
  const successText = await page.locator("text=Check Your Email!").isVisible();
  console.log("Success message visible:", successText);

  // Check if button is visible
  const buttonText = await page
    .locator("text=Go to Email Verification")
    .isVisible();
  console.log("Button visible:", buttonText);

  // List all buttons on the page
  const buttons = await page.locator("button").all();
  console.log("Number of buttons:", buttons.length);

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    console.log(`Button ${i}: "${text}"`);
  }
});
