import { test, expect } from "@playwright/test";
import { setupTestDatabase, cleanupTestDatabase } from "../setup-env";

test.describe("Brand E2E Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await setupTestDatabase();
    await page.goto("/login");

    // Login as admin
    await page.fill('[data-testid="email-input"]', "admin@test.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');

    await page.waitForURL("/dashboard");
  });

  test.afterEach(async () => {
    await cleanupTestDatabase();
  });

  test("Complete brand management workflow", async ({ page }) => {
    // Navigate to brands page
    await page.click('[data-testid="nav-brands"]');
    await page.waitForURL("/dashboard/brands");

    // Create a new brand
    await page.click('[data-testid="create-brand-button"]');
    await page.waitForSelector('[data-testid="brand-form"]');

    await page.fill('[data-testid="brand-name-input"]', "Test Brand");
    await page.fill(
      '[data-testid="brand-description-input"]',
      "Test Description"
    );
    await page.click('[data-testid="submit-brand-button"]');

    // Verify brand was created
    await expect(page.locator("text=Test Brand")).toBeVisible();
    await expect(page.locator("text=Test Description")).toBeVisible();

    // Edit the brand
    await page.click('[data-testid="edit-brand-button"]');
    await page.waitForSelector('[data-testid="brand-form"]');

    await page.fill('[data-testid="brand-name-input"]', "Updated Test Brand");
    await page.click('[data-testid="submit-brand-button"]');

    // Verify brand was updated
    await expect(page.locator("text=Updated Test Brand")).toBeVisible();

    // Toggle brand status
    await page.click('[data-testid="toggle-brand-status"]');
    await expect(
      page.locator('[data-testid="brand-status-inactive"]')
    ).toBeVisible();

    // Search for brand
    await page.fill(
      '[data-testid="search-brands-input"]',
      "Updated Test Brand"
    );
    await expect(page.locator("text=Updated Test Brand")).toBeVisible();

    // Delete the brand
    await page.click('[data-testid="delete-brand-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify brand was deleted
    await expect(page.locator("text=Updated Test Brand")).not.toBeVisible();
  });

  test("Brand validation errors", async ({ page }) => {
    await page.click('[data-testid="nav-brands"]');
    await page.click('[data-testid="create-brand-button"]');

    // Try to submit empty form
    await page.click('[data-testid="submit-brand-button"]');
    await expect(page.locator("text=Brand name is required")).toBeVisible();

    // Try to submit with invalid name
    await page.fill('[data-testid="brand-name-input"]', "a");
    await page.click('[data-testid="submit-brand-button"]');
    await expect(
      page.locator("text=Brand name must be at least 2 characters")
    ).toBeVisible();

    // Try to submit with too long name
    await page.fill('[data-testid="brand-name-input"]', "a".repeat(101));
    await page.click('[data-testid="submit-brand-button"]');
    await expect(
      page.locator("text=Brand name must be at most 100 characters")
    ).toBeVisible();
  });

  test("Brand search and filtering", async ({ page }) => {
    // Create multiple brands
    await page.click('[data-testid="nav-brands"]');

    const brands = ["Apple", "Samsung", "Google", "Microsoft"];

    for (const brand of brands) {
      await page.click('[data-testid="create-brand-button"]');
      await page.fill('[data-testid="brand-name-input"]', brand);
      await page.fill(
        '[data-testid="brand-description-input"]',
        `${brand} description`
      );
      await page.click('[data-testid="submit-brand-button"]');
      await page.waitForSelector(`text=${brand}`);
    }

    // Test search functionality
    await page.fill('[data-testid="search-brands-input"]', "Apple");
    await expect(page.locator("text=Apple")).toBeVisible();
    await expect(page.locator("text=Samsung")).not.toBeVisible();

    // Clear search
    await page.fill('[data-testid="search-brands-input"]', "");
    await expect(page.locator("text=Apple")).toBeVisible();
    await expect(page.locator("text=Samsung")).toBeVisible();

    // Test status filtering
    await page.click('[data-testid="filter-active-brands"]');
    await expect(page.locator("text=Apple")).toBeVisible();

    await page.click('[data-testid="filter-inactive-brands"]');
    await expect(page.locator("text=Apple")).not.toBeVisible();
  });

  test("Brand bulk operations", async ({ page }) => {
    await page.click('[data-testid="nav-brands"]');

    // Create multiple brands
    const brands = ["Brand 1", "Brand 2", "Brand 3"];

    for (const brand of brands) {
      await page.click('[data-testid="create-brand-button"]');
      await page.fill('[data-testid="brand-name-input"]', brand);
      await page.fill(
        '[data-testid="brand-description-input"]',
        `${brand} description`
      );
      await page.click('[data-testid="submit-brand-button"]');
      await page.waitForSelector(`text=${brand}`);
    }

    // Select multiple brands
    await page.click('[data-testid="select-all-brands"]');

    // Bulk deactivate
    await page.click('[data-testid="bulk-deactivate-brands"]');
    await page.click('[data-testid="confirm-bulk-action"]');

    // Verify all brands are inactive
    for (const brand of brands) {
      await expect(
        page.locator(`[data-testid="${brand}-status-inactive"]`)
      ).toBeVisible();
    }

    // Bulk activate
    await page.click('[data-testid="select-all-brands"]');
    await page.click('[data-testid="bulk-activate-brands"]');
    await page.click('[data-testid="confirm-bulk-action"]');

    // Verify all brands are active
    for (const brand of brands) {
      await expect(
        page.locator(`[data-testid="${brand}-status-active"]`)
      ).toBeVisible();
    }

    // Bulk delete
    await page.click('[data-testid="select-all-brands"]');
    await page.click('[data-testid="bulk-delete-brands"]');
    await page.click('[data-testid="confirm-bulk-action"]');

    // Verify all brands are deleted
    for (const brand of brands) {
      await expect(page.locator(`text=${brand}`)).not.toBeVisible();
    }
  });

  test("Brand pagination", async ({ page }) => {
    await page.click('[data-testid="nav-brands"]');

    // Create more than 10 brands to test pagination
    for (let i = 1; i <= 15; i++) {
      await page.click('[data-testid="create-brand-button"]');
      await page.fill('[data-testid="brand-name-input"]', `Brand ${i}`);
      await page.fill(
        '[data-testid="brand-description-input"]',
        `Description ${i}`
      );
      await page.click('[data-testid="submit-brand-button"]');
      await page.waitForSelector(`text=Brand ${i}`);
    }

    // Verify first page shows 10 brands
    await expect(page.locator('[data-testid="brand-row"]')).toHaveCount(10);

    // Navigate to second page
    await page.click('[data-testid="next-page-button"]');
    await expect(page.locator("text=Brand 11")).toBeVisible();
    await expect(page.locator("text=Brand 1")).not.toBeVisible();

    // Navigate back to first page
    await page.click('[data-testid="prev-page-button"]');
    await expect(page.locator("text=Brand 1")).toBeVisible();
    await expect(page.locator("text=Brand 11")).not.toBeVisible();
  });

  test("Brand export functionality", async ({ page }) => {
    await page.click('[data-testid="nav-brands"]');

    // Create some brands
    const brands = ["Export Brand 1", "Export Brand 2"];

    for (const brand of brands) {
      await page.click('[data-testid="create-brand-button"]');
      await page.fill('[data-testid="brand-name-input"]', brand);
      await page.fill(
        '[data-testid="brand-description-input"]',
        `${brand} description`
      );
      await page.click('[data-testid="submit-brand-button"]');
      await page.waitForSelector(`text=${brand}`);
    }

    // Export brands
    await page.click('[data-testid="export-brands-button"]');

    // Wait for download to start
    const downloadPromise = page.waitForEvent("download");
    await page.click('[data-testid="confirm-export-button"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /brands-export-\d{4}-\d{2}-\d{2}\.csv/
    );
  });

  test("Brand import functionality", async ({ page }) => {
    await page.click('[data-testid="nav-brands"]');

    // Click import button
    await page.click('[data-testid="import-brands-button"]');

    // Upload CSV file
    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: "brands-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "name,description,isActive\nImported Brand 1,Description 1,true\nImported Brand 2,Description 2,false"
      ),
    });

    await page.click('[data-testid="confirm-import-button"]');

    // Verify brands were imported
    await expect(page.locator("text=Imported Brand 1")).toBeVisible();
    await expect(page.locator("text=Imported Brand 2")).toBeVisible();
  });

  test("Brand error handling", async ({ page }) => {
    await page.click('[data-testid="nav-brands"]');

    // Test network error during creation
    await page.route("/api/brands", (route) => route.abort());

    await page.click('[data-testid="create-brand-button"]');
    await page.fill('[data-testid="brand-name-input"]', "Error Brand");
    await page.click('[data-testid="submit-brand-button"]');

    await expect(page.locator("text=Failed to create brand")).toBeVisible();

    // Restore network
    await page.unroute("/api/brands");

    // Test validation error
    await page.fill('[data-testid="brand-name-input"]', "");
    await page.click('[data-testid="submit-brand-button"]');

    await expect(page.locator("text=Brand name is required")).toBeVisible();
  });

  test("Brand accessibility", async ({ page }) => {
    await page.click('[data-testid="nav-brands"]');

    // Test keyboard navigation
    await page.keyboard.press("Tab");
    await expect(
      page.locator('[data-testid="create-brand-button"]:focus')
    ).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="brand-form"]')).toBeVisible();

    // Test screen reader support
    await expect(
      page.locator('[data-testid="brand-name-input"]')
    ).toHaveAttribute("aria-label");
    await expect(
      page.locator('[data-testid="submit-brand-button"]')
    ).toHaveAttribute("aria-label");

    // Test focus management
    await page.click('[data-testid="cancel-button"]');
    await expect(
      page.locator('[data-testid="create-brand-button"]:focus')
    ).toBeVisible();
  });
});
