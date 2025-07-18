import { test, expect } from "@playwright/test";

test.describe("Category E2E Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");

    // Login as admin
    await page.fill('[data-testid="email-input"]', "admin@test.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');

    await page.waitForURL("/dashboard");
  });

  test("Complete category management workflow", async ({ page }) => {
    // Navigate to categories page
    await page.click('[data-testid="nav-categories"]');
    await page.waitForURL("/dashboard/categories");

    // Create a new category
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');

    await page.fill('[data-testid="category-name-input"]', "Test Category");
    await page.fill(
      '[data-testid="category-description-input"]',
      "Test Description"
    );
    await page.click('[data-testid="submit-category-button"]');

    // Verify category was created
    await expect(page.locator("text=Test Category")).toBeVisible();
    await expect(page.locator("text=Test Description")).toBeVisible();

    // Edit the category
    await page.click('[data-testid="edit-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');

    await page.fill(
      '[data-testid="category-name-input"]',
      "Updated Test Category"
    );
    await page.click('[data-testid="submit-category-button"]');

    // Verify category was updated
    await expect(page.locator("text=Updated Test Category")).toBeVisible();

    // Toggle category status
    await page.click('[data-testid="toggle-category-status"]');
    await expect(
      page.locator('[data-testid="category-status-inactive"]')
    ).toBeVisible();

    // Search for category
    await page.fill(
      '[data-testid="search-categories-input"]',
      "Updated Test Category"
    );
    await expect(page.locator("text=Updated Test Category")).toBeVisible();

    // Delete the category
    await page.click('[data-testid="delete-category-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify category was deleted
    await expect(page.locator("text=Updated Test Category")).not.toBeVisible();
  });

  test("Category hierarchy management", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');

    // Create parent category
    await page.click('[data-testid="create-category-button"]');
    await page.fill('[data-testid="category-name-input"]', "Parent Category");
    await page.fill(
      '[data-testid="category-description-input"]',
      "Parent Description"
    );
    await page.click('[data-testid="submit-category-button"]');
    await page.waitForSelector("text=Parent Category");

    // Create child category
    await page.click('[data-testid="create-category-button"]');
    await page.fill('[data-testid="category-name-input"]', "Child Category");
    await page.fill(
      '[data-testid="category-description-input"]',
      "Child Description"
    );
    await page.selectOption(
      '[data-testid="parent-category-select"]',
      "parent-category-id"
    );
    await page.click('[data-testid="submit-category-button"]');
    await page.waitForSelector("text=Child Category");

    // Verify hierarchy is displayed
    await expect(page.locator("text=Parent Category")).toBeVisible();
    await expect(page.locator("text=Child Category")).toBeVisible();
    await expect(
      page.locator("text=Subcategory of Parent Category")
    ).toBeVisible();

    // Test moving child to different parent
    await page.click('[data-testid="edit-category-button"]');
    await page.selectOption('[data-testid="parent-category-select"]', "none");
    await page.click('[data-testid="submit-category-button"]');

    // Verify child is now a top-level category
    await expect(page.locator("text=Child Category")).toBeVisible();
    await expect(
      page.locator("text=Subcategory of Parent Category")
    ).not.toBeVisible();
  });

  test("Category validation errors", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');
    await page.click('[data-testid="create-category-button"]');

    // Try to submit empty form
    await page.click('[data-testid="submit-category-button"]');
    await expect(page.locator("text=Category name is required")).toBeVisible();

    // Try to submit with invalid name
    await page.fill('[data-testid="category-name-input"]', "a");
    await page.click('[data-testid="submit-category-button"]');
    await expect(
      page.locator("text=Category name must be at least 2 characters")
    ).toBeVisible();

    // Try to submit with too long name
    await page.fill('[data-testid="category-name-input"]', "a".repeat(101));
    await page.click('[data-testid="submit-category-button"]');
    await expect(
      page.locator("text=Category name must be at most 100 characters")
    ).toBeVisible();

    // Test circular reference prevention
    await page.fill('[data-testid="category-name-input"]', "Test Category");
    await page.selectOption(
      '[data-testid="parent-category-select"]',
      "child-category-id"
    );
    await page.click('[data-testid="submit-category-button"]');
    await expect(
      page.locator("text=Cannot create circular reference")
    ).toBeVisible();
  });

  test("Category search and filtering", async ({ page }) => {
    // Create multiple categories
    await page.click('[data-testid="nav-categories"]');

    const categories = ["Electronics", "Clothing", "Books", "Sports"];

    for (const category of categories) {
      await page.click('[data-testid="create-category-button"]');
      await page.fill('[data-testid="category-name-input"]', category);
      await page.fill(
        '[data-testid="category-description-input"]',
        `${category} description`
      );
      await page.click('[data-testid="submit-category-button"]');
      await page.waitForSelector(`text=${category}`);
    }

    // Test search functionality
    await page.fill('[data-testid="search-categories-input"]', "Electronics");
    await expect(page.locator("text=Electronics")).toBeVisible();
    await expect(page.locator("text=Clothing")).not.toBeVisible();

    // Clear search
    await page.fill('[data-testid="search-categories-input"]', "");
    await expect(page.locator("text=Electronics")).toBeVisible();
    await expect(page.locator("text=Clothing")).toBeVisible();

    // Test status filtering
    await page.click('[data-testid="filter-active-categories"]');
    await expect(page.locator("text=Electronics")).toBeVisible();

    await page.click('[data-testid="filter-inactive-categories"]');
    await expect(page.locator("text=Electronics")).not.toBeVisible();

    // Test hierarchy filtering
    await page.click('[data-testid="filter-top-level-categories"]');
    await expect(page.locator("text=Electronics")).toBeVisible();

    await page.click('[data-testid="filter-subcategories"]');
    await expect(page.locator("text=Electronics")).not.toBeVisible();
  });

  test("Category bulk operations", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');

    // Create multiple categories
    const categories = ["Category 1", "Category 2", "Category 3"];

    for (const category of categories) {
      await page.click('[data-testid="create-category-button"]');
      await page.fill('[data-testid="category-name-input"]', category);
      await page.fill(
        '[data-testid="category-description-input"]',
        `${category} description`
      );
      await page.click('[data-testid="submit-category-button"]');
      await page.waitForSelector(`text=${category}`);
    }

    // Select multiple categories
    await page.click('[data-testid="select-all-categories"]');

    // Bulk deactivate
    await page.click('[data-testid="bulk-deactivate-categories"]');
    await page.click('[data-testid="confirm-bulk-action"]');

    // Verify all categories are inactive
    for (const category of categories) {
      await expect(
        page.locator(`[data-testid="${category}-status-inactive"]`)
      ).toBeVisible();
    }

    // Bulk activate
    await page.click('[data-testid="select-all-categories"]');
    await page.click('[data-testid="bulk-activate-categories"]');
    await page.click('[data-testid="confirm-bulk-action"]');

    // Verify all categories are active
    for (const category of categories) {
      await expect(
        page.locator(`[data-testid="${category}-status-active"]`)
      ).toBeVisible();
    }

    // Bulk delete
    await page.click('[data-testid="select-all-categories"]');
    await page.click('[data-testid="bulk-delete-categories"]');
    await page.click('[data-testid="confirm-bulk-action"]');

    // Verify all categories are deleted
    for (const category of categories) {
      await expect(page.locator(`text=${category}`)).not.toBeVisible();
    }
  });

  test("Category pagination", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');

    // Create more than 10 categories to test pagination
    for (let i = 1; i <= 15; i++) {
      await page.click('[data-testid="create-category-button"]');
      await page.fill('[data-testid="category-name-input"]', `Category ${i}`);
      await page.fill(
        '[data-testid="category-description-input"]',
        `Description ${i}`
      );
      await page.click('[data-testid="submit-category-button"]');
      await page.waitForSelector(`text=Category ${i}`);
    }

    // Verify first page shows 10 categories
    await expect(page.locator('[data-testid="category-row"]')).toHaveCount(10);

    // Navigate to second page
    await page.click('[data-testid="next-page-button"]');
    await expect(page.locator("text=Category 11")).toBeVisible();
    await expect(page.locator("text=Category 1")).not.toBeVisible();

    // Navigate back to first page
    await page.click('[data-testid="prev-page-button"]');
    await expect(page.locator("text=Category 1")).toBeVisible();
    await expect(page.locator("text=Category 11")).not.toBeVisible();
  });

  test("Category export functionality", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');

    // Create some categories
    const categories = ["Export Category 1", "Export Category 2"];

    for (const category of categories) {
      await page.click('[data-testid="create-category-button"]');
      await page.fill('[data-testid="category-name-input"]', category);
      await page.fill(
        '[data-testid="category-description-input"]',
        `${category} description`
      );
      await page.click('[data-testid="submit-category-button"]');
      await page.waitForSelector(`text=${category}`);
    }

    // Export categories
    await page.click('[data-testid="export-categories-button"]');

    // Wait for download to start
    const downloadPromise = page.waitForEvent("download");
    await page.click('[data-testid="confirm-export-button"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /categories-export-\d{4}-\d{2}-\d{2}\.csv/
    );
  });

  test("Category import functionality", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');

    // Click import button
    await page.click('[data-testid="import-categories-button"]');

    // Upload CSV file
    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: "categories-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "name,description,isActive,parentId\nImported Category 1,Description 1,true,\nImported Category 2,Description 2,false,"
      ),
    });

    await page.click('[data-testid="confirm-import-button"]');

    // Verify categories were imported
    await expect(page.locator("text=Imported Category 1")).toBeVisible();
    await expect(page.locator("text=Imported Category 2")).toBeVisible();
  });

  test("Category error handling", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');

    // Test network error during creation
    await page.route("/api/categories", (route) => route.abort());

    await page.click('[data-testid="create-category-button"]');
    await page.fill('[data-testid="category-name-input"]', "Error Category");
    await page.click('[data-testid="submit-category-button"]');

    await expect(page.locator("text=Failed to create category")).toBeVisible();

    // Restore network
    await page.unroute("/api/categories");

    // Test validation error
    await page.fill('[data-testid="category-name-input"]', "");
    await page.click('[data-testid="submit-category-button"]');

    await expect(page.locator("text=Category name is required")).toBeVisible();
  });

  test("Category accessibility", async ({ page }) => {
    await page.click('[data-testid="nav-categories"]');

    // Test keyboard navigation
    await page.keyboard.press("Tab");
    await expect(
      page.locator('[data-testid="create-category-button"]:focus')
    ).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="category-form"]')).toBeVisible();

    // Test screen reader support
    await expect(
      page.locator('[data-testid="category-name-input"]')
    ).toHaveAttribute("aria-label");
    await expect(
      page.locator('[data-testid="submit-category-button"]')
    ).toHaveAttribute("aria-label");

    // Test focus management
    await page.click('[data-testid="cancel-button"]');
    await expect(
      page.locator('[data-testid="create-category-button"]:focus')
    ).toBeVisible();
  });
});
