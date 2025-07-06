/**
 * Integration test script for stock management workflow
 * Tests the complete stock adjustment and reconciliation system
 */
import { test, expect } from "@playwright/test";

test.describe("Stock Management Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto("/login");
    await page.fill('[name="email"]', "admin@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("Complete Add Stock Workflow", async ({ page }) => {
    // Navigate to products page
    await page.goto("/inventory/products");
    await expect(page).toHaveTitle(/Products/);

    // Click on first product's actions menu
    await page.click('[data-testid="product-actions"]:first-child');
    await page.click("text=Add Stock");

    // Fill in stock addition form
    await page.fill('[name="quantity"]', "50");
    await page.fill('[name="costPerUnit"]', "25.00");
    await page.fill('[name="notes"]', "Test stock addition");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator("text=Stock added successfully")).toBeVisible();

    // Verify stock was updated in the products list
    // This would require checking the updated stock count
  });

  test("Complete Stock Reconciliation Workflow", async ({ page }) => {
    // Navigate to products page
    await page.goto("/inventory/products");

    // Click "Reconcile Stock" button
    await page.click("text=Reconcile Stock");

    // Fill in reconciliation details
    await page.fill('[name="title"]', "Test Reconciliation - January 2025");
    await page.fill('[name="description"]', "Monthly stock count test");

    // Add a product to reconciliation
    await page.fill(
      '[placeholder="Search products by name or SKU..."]',
      "Test Product"
    );
    await page.click('[data-testid="product-search-result"]:first-child');

    // Update physical count
    await page.fill('[name="items.0.physicalCount"]', "95");
    await page.fill(
      '[name="items.0.discrepancyReason"]',
      "Found additional units in storage"
    );

    // Save as draft first
    await page.click("text=Save Draft");
    await expect(
      page.locator("text=Reconciliation saved as draft")
    ).toBeVisible();

    // Submit for approval
    await page.click("text=Submit for Approval");
    await expect(
      page.locator("text=Reconciliation submitted for approval")
    ).toBeVisible();

    // Navigate to reconciliations list
    await page.goto("/inventory/stock-reconciliations");

    // Verify reconciliation is in pending status
    await expect(
      page.locator("text=Test Reconciliation - January 2025")
    ).toBeVisible();
    await expect(page.locator('[data-status="PENDING"]')).toBeVisible();

    // Approve the reconciliation (as admin)
    await page.click('[data-testid="reconciliation-actions"]:first-child');
    await page.click("text=Approve");

    // Verify approval
    await expect(
      page.locator("text=Reconciliation approved successfully")
    ).toBeVisible();
    await expect(page.locator('[data-status="APPROVED"]')).toBeVisible();
  });

  test("Stock Reconciliation Detail View", async ({ page }) => {
    // Navigate to reconciliations list
    await page.goto("/inventory/stock-reconciliations");

    // Click on a reconciliation to view details
    await page.click('[data-testid="reconciliation-link"]:first-child');

    // Verify detail page elements
    await expect(page.locator("h1")).toContainText("Stock Reconciliation");
    await expect(
      page.locator('[data-testid="reconciliation-status"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="reconciliation-items"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="reconciliation-summary"]')
    ).toBeVisible();
  });

  test("Permission-based Access Control", async ({ page }) => {
    // Test admin permissions
    await page.goto("/inventory/stock-reconciliations");
    await expect(page.locator("text=New Reconciliation")).toBeVisible();

    // Test approval actions for admin
    if ((await page.locator('[data-status="PENDING"]').count()) > 0) {
      await expect(page.locator("text=Approve")).toBeVisible();
      await expect(page.locator("text=Reject")).toBeVisible();
    }
  });

  test("Data Validation and Error Handling", async ({ page }) => {
    // Test stock addition validation
    await page.goto("/inventory/products");
    await page.click('[data-testid="product-actions"]:first-child');
    await page.click("text=Add Stock");

    // Try to submit without required fields
    await page.click('button[type="submit"]');
    await expect(
      page.locator("text=Quantity must be a positive integer")
    ).toBeVisible();

    // Test invalid values
    await page.fill('[name="quantity"]', "-5");
    await page.fill('[name="costPerUnit"]', "-10");
    await page.click('button[type="submit"]');
    await expect(
      page.locator("text=Quantity must be a positive integer")
    ).toBeVisible();
    await expect(
      page.locator("text=Cost per unit must be positive")
    ).toBeVisible();
  });

  test("Search and Filtering", async ({ page }) => {
    // Test product search in reconciliation dialog
    await page.goto("/inventory/products");
    await page.click("text=Reconcile Stock");

    await page.fill(
      '[placeholder="Search products by name or SKU..."]',
      "Test"
    );
    await expect(
      page.locator('[data-testid="product-search-results"]')
    ).toBeVisible();

    // Test reconciliation list filtering
    await page.goto("/inventory/stock-reconciliations");

    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', "PENDING");
    await expect(page.locator('[data-status="PENDING"]')).toBeVisible();

    // Search by title
    await page.fill('[placeholder="Search reconciliations..."]', "Test");
    // Verify search results
  });
});

export default test;
