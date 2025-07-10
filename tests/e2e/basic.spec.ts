import { test, expect } from "@playwright/test";

test("basic page load", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Inventory POS/);
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("h1")).toContainText(/Login/);
});

test("register page loads", async ({ page }) => {
  await page.goto("/register");
  await expect(page.locator("h1")).toContainText(/Register/);
});
