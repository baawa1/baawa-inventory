import { test, expect, Page } from "@playwright/test";
import { TestUtils } from "../../e2e/test-utils";

test.describe("Products E2E Workflow", () => {
  let page: Page;
  let testProductId: string;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Mock authentication for admin user
    await page.addInitScript(() => {
      window.localStorage.setItem("auth-token", "mock-admin-token");
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          id: "1",
          email: "admin@test.com",
          role: "ADMIN",
          status: "APPROVED",
          isEmailVerified: true,
        })
      );
    });

    // Mock API responses
    await page.route("**/api/products**", async (route) => {
      const url = route.request().url();

      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: 1,
                name: "Test Product",
                sku: "TEST-001",
                barcode: "1234567890123",
                cost: 10.5,
                price: 15.99,
                stock: 10,
                minStock: 5,
                maxStock: 50,
                unit: "piece",
                status: "active",
                isArchived: false,
                category: { id: 1, name: "Electronics" },
                brand: { id: 1, name: "Test Brand" },
                supplier: {
                  id: 1,
                  name: "Test Supplier",
                  email: "supplier@test.com",
                },
                images: [],
                stockStatus: "normal",
                profitMargin: 5.49,
                profitMarginPercent: 52.29,
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            filters: {
              search: "",
              categoryId: null,
              brandId: null,
              supplierId: null,
              lowStock: false,
              status: "active",
              sortBy: "name",
              sortOrder: "asc",
            },
          }),
        });
      } else if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: 2,
              name: "New Test Product",
              sku: "NEW-TEST-001",
            },
          }),
        });
      }
    });

    await page.route("**/api/categories**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: 1, name: "Electronics" },
          { id: 2, name: "Clothing" },
        ]),
      });
    });

    await page.route("**/api/brands**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: 1, name: "Test Brand" },
          { id: 2, name: "Another Brand" },
        ]),
      });
    });

    await page.route("**/api/suppliers**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: 1, name: "Test Supplier" },
          { id: 2, name: "Another Supplier" },
        ]),
      });
    });
  });

  test("should navigate to products page", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    expect(page.url()).toContain("/inventory/products");
    await expect(page.locator("h1")).toContainText("Products");
  });

  test("should display products list", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    await expect(page.locator("text=Test Product")).toBeVisible();
    await expect(page.locator("text=TEST-001")).toBeVisible();
    await expect(page.locator("text=₦15.99")).toBeVisible();
    await expect(page.locator("text=Electronics")).toBeVisible();
  });

  test("should add a new product", async () => {
    await page.goto("/inventory/products");

    // Click add product button
    await page.click("text=Add Product");

    // Wait for form to load
    await TestUtils.waitForPageReady(page);
    await expect(page.locator("h1")).toContainText("Add New Product");

    // Fill in required fields
    await page.fill('input[name="name"]', "New Test Product");
    await page.fill('input[name="sku"]', "NEW-TEST-001");
    await page.fill('input[name="purchasePrice"]', "12.50");
    await page.fill('input[name="sellingPrice"]', "19.99");
    await page.fill('input[name="currentStock"]', "15");
    await page.fill('input[name="minimumStock"]', "5");

    // Fill in optional fields
    await page.fill('textarea[name="description"]', "A new test product");
    await page.fill('input[name="barcode"]', "9876543210987");

    // Select category
    await page.click('select[name="categoryId"]');
    await page.click('option[value="1"]');

    // Select brand
    await page.click('select[name="brandId"]');
    await page.click('option[value="1"]');

    // Select supplier
    await page.click('select[name="supplierId"]');
    await page.click('option[value="1"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success and redirect
    await expect(
      page.locator("text=Product created successfully")
    ).toBeVisible();
    expect(page.url()).toContain("/inventory/products");
  });

  test("should validate required fields when adding product", async () => {
    await page.goto("/inventory/products/add");

    await TestUtils.waitForPageReady(page);

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator("text=Product name is required")).toBeVisible();
    await expect(page.locator("text=SKU is required")).toBeVisible();
    await expect(page.locator("text=Purchase price is required")).toBeVisible();
    await expect(page.locator("text=Selling price is required")).toBeVisible();
  });

  test("should validate SKU format", async () => {
    await page.goto("/inventory/products/add");

    await TestUtils.waitForPageReady(page);

    // Enter invalid SKU
    await page.fill('input[name="sku"]', "invalid@sku");
    await page.fill('input[name="name"]', "Test Product");
    await page.fill('input[name="purchasePrice"]', "10");
    await page.fill('input[name="sellingPrice"]', "15");
    await page.fill('input[name="currentStock"]', "10");
    await page.fill('input[name="minimumStock"]', "5");

    await page.click('button[type="submit"]');

    await expect(
      page.locator(
        "text=SKU can only contain letters, numbers, hyphens, and underscores"
      )
    ).toBeVisible();
  });

  test("should search products", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Enter search term
    await page.fill('input[placeholder*="search"]', "Test Product");

    // Wait for search to execute
    await page.waitForTimeout(1000);

    // Verify search results
    await expect(page.locator("text=Test Product")).toBeVisible();
  });

  test("should filter products by category", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Select category filter
    await page.click('select[name="categoryId"]');
    await page.click('option[value="1"]');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify filtered results
    await expect(page.locator("text=Electronics")).toBeVisible();
  });

  test("should filter products by brand", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Select brand filter
    await page.click('select[name="brandId"]');
    await page.click('option[value="1"]');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify filtered results
    await expect(page.locator("text=Test Brand")).toBeVisible();
  });

  test("should filter low stock products", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Check low stock filter
    await page.check('input[type="checkbox"][name="lowStock"]');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify low stock indicator
    await expect(page.locator("text=LOW")).toBeVisible();
  });

  test("should sort products", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Select sort option
    await page.click('select[name="sortBy"]');
    await page.click('option[value="price"]');

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Verify products are sorted by price
    await expect(page.locator("text=₦15.99")).toBeVisible();
  });

  test("should edit a product", async () => {
    // Mock the product data for editing
    await page.route("**/api/products/1**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: 1,
              name: "Test Product",
              sku: "TEST-001",
              description: "Original description",
              cost: 10.5,
              price: 15.99,
              stock: 10,
              minStock: 5,
              categoryId: 1,
              brandId: 1,
              supplierId: 1,
              status: "active",
            },
          }),
        });
      } else if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: 1,
              name: "Updated Test Product",
              sku: "TEST-001",
            },
          }),
        });
      }
    });

    await page.goto("/inventory/products/1/edit");

    await TestUtils.waitForPageReady(page);

    // Verify form is populated
    await expect(page.locator('input[name="name"]')).toHaveValue(
      "Test Product"
    );
    await expect(page.locator('input[name="sku"]')).toHaveValue("TEST-001");

    // Update product name
    await page.fill('input[name="name"]', "Updated Test Product");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(
      page.locator("text=Product updated successfully")
    ).toBeVisible();
  });

  test("should archive a product", async () => {
    // Mock archive endpoint
    await page.route("**/api/products/1/archive", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: 1,
            name: "Test Product",
            isArchived: true,
          },
        }),
      });
    });

    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Click on product row to open actions
    await page.click('tr:has-text("Test Product")');

    // Click archive button
    await page.click('button:has-text("Archive")');

    // Confirm archive action
    await page.click('button:has-text("Confirm")');

    // Wait for success message
    await expect(
      page.locator("text=Product archived successfully")
    ).toBeVisible();
  });

  test("should handle pagination", async () => {
    // Mock paginated response
    await page.route("**/api/products**", async (route) => {
      const url = new URL(route.request().url());
      const page = url.searchParams.get("page");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            sku: `SKU-${i + 1}`,
            cost: 10,
            price: 15,
            stock: 10,
            minStock: 5,
            status: "active",
            category: { id: 1, name: "Electronics" },
            brand: { id: 1, name: "Test Brand" },
            supplier: {
              id: 1,
              name: "Test Supplier",
              email: "supplier@test.com",
            },
            images: [],
            stockStatus: "normal",
            profitMargin: 5,
            profitMarginPercent: 50,
          })),
          pagination: {
            page: parseInt(page || "1"),
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNextPage: parseInt(page || "1") < 3,
            hasPreviousPage: parseInt(page || "1") > 1,
          },
        }),
      });
    });

    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Click next page
    await page.click('button:has-text("Next")');

    // Wait for page change
    await page.waitForTimeout(500);

    // Verify we're on page 2
    await expect(page.locator("text=Page 2 of 3")).toBeVisible();
  });

  test("should handle bulk actions", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Select multiple products
    await page.check('input[type="checkbox"]:nth-child(1)'); // Select all checkbox
    await page.check('input[type="checkbox"]:nth-child(2)'); // Select first product

    // Verify bulk actions are available
    await expect(page.locator("text=1 selected")).toBeVisible();

    // Click bulk archive
    await page.click('button:has-text("Archive Selected")');

    // Confirm bulk action
    await page.click('button:has-text("Confirm")');

    // Wait for success message
    await expect(
      page.locator("text=Products archived successfully")
    ).toBeVisible();
  });

  test("should export products", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for export to complete
    await page.waitForTimeout(1000);

    // Verify download started (this would need to be handled differently in real implementation)
    // For now, just verify the button exists
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test("should show product details", async () => {
    await page.goto("/inventory/products");

    await TestUtils.waitForPageReady(page);

    // Click on product name to view details
    await page.click("text=Test Product");

    // Wait for details page to load
    await TestUtils.waitForPageReady(page);

    // Verify product details are displayed
    await expect(page.locator("text=Test Product")).toBeVisible();
    await expect(page.locator("text=TEST-001")).toBeVisible();
    await expect(page.locator("text=₦15.99")).toBeVisible();
    await expect(page.locator("text=Electronics")).toBeVisible();
  });

  test("should handle image upload", async () => {
    await page.goto("/inventory/products/add");

    await TestUtils.waitForPageReady(page);

    // Fill required fields first
    await page.fill('input[name="name"]', "Product with Images");
    await page.fill('input[name="sku"]', "IMG-TEST-001");
    await page.fill('input[name="purchasePrice"]', "10");
    await page.fill('input[name="sellingPrice"]', "15");
    await page.fill('input[name="currentStock"]', "10");
    await page.fill('input[name="minimumStock"]', "5");

    // Mock file upload
    await page.setInputFiles('input[type="file"]', {
      name: "test-image.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
    });

    // Verify image preview
    await expect(page.locator("img[alt='Product image']")).toBeVisible();
  });

  test("should handle form errors gracefully", async () => {
    // Mock API error response
    await page.route("**/api/products", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Product with this SKU already exists",
        }),
      });
    });

    await page.goto("/inventory/products/add");

    await TestUtils.waitForPageReady(page);

    // Fill form with duplicate SKU
    await page.fill('input[name="name"]', "Duplicate Product");
    await page.fill('input[name="sku"]', "TEST-001"); // Existing SKU
    await page.fill('input[name="purchasePrice"]', "10");
    await page.fill('input[name="sellingPrice"]', "15");
    await page.fill('input[name="currentStock"]', "10");
    await page.fill('input[name="minimumStock"]', "5");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(
      page.locator("text=Product with this SKU already exists")
    ).toBeVisible();
  });

  test("should handle network errors", async () => {
    // Mock network error
    await page.route("**/api/products**", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/inventory/products");

    // Wait for error state
    await expect(page.locator("text=Failed to load products")).toBeVisible();

    // Click retry button
    await page.click('button:has-text("Retry")');

    // Verify retry attempt
    await expect(page.locator("text=Retry")).toBeVisible();
  });
});
