import { test, expect } from "@playwright/test";
import {
  testUserHelper,
  APPROVED_ADMIN,
  APPROVED_MANAGER,
  APPROVED_STAFF,
} from "./test-user-helper";

test.describe("Comprehensive Inventory & POS Workflow", () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test.describe("1. Product Management Workflow", () => {
    test("should allow admin to manage products end-to-end", async ({
      page,
    }) => {
      // Login as admin
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Navigate to inventory
      await page.goto("/inventory");
      await expect(page).toHaveURL("/inventory");

      // Test product listing
      await expect(page.locator("text=Products")).toBeVisible();
      await expect(page.locator("text=Add Product")).toBeVisible();

      // Navigate to add product
      await page.click("text=Add Product");
      await expect(page).toHaveURL("/inventory/products/add");

      // Fill product form
      await page.fill('input[name="name"]', "Test Product E2E");
      await page.fill('input[name="sku"]', "TEST-E2E-001");
      await page.fill(
        'input[name="description"]',
        "Test product for E2E testing"
      );
      await page.fill('input[name="purchasePrice"]', "1000");
      await page.fill('input[name="sellingPrice"]', "1500");
      await page.fill('input[name="currentStock"]', "50");
      await page.fill('input[name="minimumStock"]', "10");

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to products list
      await page.waitForURL(/\/inventory\/products/, { timeout: 10000 });
      await expect(page.locator("text=Test Product E2E")).toBeVisible();

      console.log("✅ Admin can create products successfully");
    });

    test("should allow manager to view and edit products", async ({ page }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Navigate to products
      await page.goto("/inventory/products");
      await expect(page).toHaveURL("/inventory/products");

      // Should see products list
      await expect(page.locator("text=Products")).toBeVisible();

      // Test product search
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500); // Wait for search results

      // Should see search results
      await expect(page.locator("text=Test Product E2E")).toBeVisible();

      console.log("✅ Manager can view and search products");
    });

    test("should block staff from product management", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Try to access add product page
      await page.goto("/inventory/products/add");
      await expect(page).toHaveURL("/unauthorized");

      console.log("✅ Staff correctly blocked from product management");
    });
  });

  test.describe("2. Category Management Workflow", () => {
    test("should allow admin to manage categories", async ({ page }) => {
      // Login as admin
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Navigate to categories
      await page.goto("/inventory/categories");
      await expect(page).toHaveURL("/inventory/categories");

      // Test category listing
      await expect(page.locator("text=Categories")).toBeVisible();
      await expect(page.locator("text=Add Category")).toBeVisible();

      // Navigate to add category
      await page.click("text=Add Category");
      await expect(page).toHaveURL("/inventory/categories/add");

      // Fill category form
      await page.fill('input[name="name"]', "Test Category E2E");
      await page.fill(
        'textarea[name="description"]',
        "Test category for E2E testing"
      );

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to categories list
      await page.waitForURL(/\/inventory\/categories/, { timeout: 10000 });
      await expect(page.locator("text=Test Category E2E")).toBeVisible();

      console.log("✅ Admin can create categories successfully");
    });

    test("should allow manager to view categories", async ({ page }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Navigate to categories
      await page.goto("/inventory/categories");
      await expect(page).toHaveURL("/inventory/categories");

      // Should see categories list
      await expect(page.locator("text=Categories")).toBeVisible();
      await expect(page.locator("text=Test Category E2E")).toBeVisible();

      console.log("✅ Manager can view categories");
    });
  });

  test.describe("3. Brand Management Workflow", () => {
    test("should allow admin to manage brands", async ({ page }) => {
      // Login as admin
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Navigate to brands
      await page.goto("/inventory/brands");
      await expect(page).toHaveURL("/inventory/brands");

      // Test brand listing
      await expect(page.locator("text=Brands")).toBeVisible();
      await expect(page.locator("text=Add Brand")).toBeVisible();

      // Navigate to add brand
      await page.click("text=Add Brand");
      await expect(page).toHaveURL("/inventory/brands/add");

      // Fill brand form
      await page.fill('input[name="name"]', "Test Brand E2E");
      await page.fill(
        'textarea[name="description"]',
        "Test brand for E2E testing"
      );

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to brands list
      await page.waitForURL(/\/inventory\/brands/, { timeout: 10000 });
      await expect(page.locator("text=Test Brand E2E")).toBeVisible();

      console.log("✅ Admin can create brands successfully");
    });
  });

  test.describe("4. Supplier Management Workflow", () => {
    test("should allow admin to manage suppliers", async ({ page }) => {
      // Login as admin
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Navigate to suppliers
      await page.goto("/inventory/suppliers");
      await expect(page).toHaveURL("/inventory/suppliers");

      // Test supplier listing
      await expect(page.locator("text=Suppliers")).toBeVisible();
      await expect(page.locator("text=Add Supplier")).toBeVisible();

      // Navigate to add supplier
      await page.click("text=Add Supplier");
      await expect(page).toHaveURL("/inventory/suppliers/add");

      // Fill supplier form
      await page.fill('input[name="name"]', "Test Supplier E2E");
      await page.fill('input[name="email"]', "test@supplier.com");
      await page.fill('input[name="phone"]', "+2348012345678");
      await page.fill('textarea[name="address"]', "Test Address, Lagos");

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to suppliers list
      await page.waitForURL(/\/inventory\/suppliers/, { timeout: 10000 });
      await expect(page.locator("text=Test Supplier E2E")).toBeVisible();

      console.log("✅ Admin can create suppliers successfully");
    });
  });

  test.describe("5. POS System Workflow", () => {
    test("should allow staff to process POS transactions", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");
      await expect(page).toHaveURL("/pos");

      // Should see POS interface
      await expect(page.locator("text=Point of Sale")).toBeVisible();
      await expect(page.locator("text=Search products")).toBeVisible();

      // Test product search
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);

      // Should see search results
      await expect(page.locator("text=Test Product E2E")).toBeVisible();

      // Add product to cart
      await page.click('button:has-text("Add to Cart")');

      // Should see product in cart
      await expect(page.locator("text=Test Product E2E")).toBeVisible();
      await expect(page.locator("text=Total:")).toBeVisible();

      console.log("✅ Staff can access POS and add products to cart");
    });

    test("should allow manager to access POS with full features", async ({
      page,
    }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Navigate to POS
      await page.goto("/pos");
      await expect(page).toHaveURL("/pos");

      // Should see full POS interface
      await expect(page.locator("text=Point of Sale")).toBeVisible();
      await expect(page.locator("text=Search products")).toBeVisible();

      // Test barcode search mode
      await page.click('button:has-text("Barcode")');
      await expect(
        page.locator('input[placeholder*="Enter barcode"]')
      ).toBeVisible();

      // Test camera mode (if available)
      await page.click('button:has-text("Camera")');
      // Note: Camera permissions may be blocked in test environment

      console.log("✅ Manager can access POS with all features");
    });

    test("should process complete POS transaction", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Search and add product
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');

      // Fill customer information
      await page.fill('input[name="customerName"]', "Test Customer");
      await page.fill('input[name="customerPhone"]', "+2348012345678");
      await page.fill('input[name="customerEmail"]', "test@customer.com");

      // Select payment method
      await page.click('input[value="cash"]');

      // Enter payment amount
      await page.fill('input[name="amountPaid"]', "2000");

      // Process payment
      await page.click('button:has-text("Process Payment")');

      // Should show success message
      await expect(
        page.locator("text=Payment processed successfully")
      ).toBeVisible();

      console.log("✅ Complete POS transaction processed successfully");
    });
  });

  test.describe("6. Sales History and Reports", () => {
    test("should allow access to transaction history", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS history
      await page.goto("/pos/history");
      await expect(page).toHaveURL("/pos/history");

      // Should see transaction history
      await expect(page.locator("text=Transaction History")).toBeVisible();

      console.log("✅ Staff can access transaction history");
    });

    test("should allow manager to access reports", async ({ page }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Navigate to inventory reports
      await page.goto("/inventory/reports");
      await expect(page).toHaveURL("/inventory/reports");

      // Should see reports interface
      await expect(page.locator("text=Reports")).toBeVisible();

      console.log("✅ Manager can access reports");
    });
  });

  test.describe("7. Low Stock Management", () => {
    test("should show low stock alerts", async ({ page }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Navigate to low stock page
      await page.goto("/inventory/low-stock");
      await expect(page).toHaveURL("/inventory/low-stock");

      // Should see low stock interface
      await expect(page.locator("text=Low Stock")).toBeVisible();

      console.log("✅ Low stock management accessible");
    });
  });

  test.describe("8. Stock Management", () => {
    test("should allow stock adjustments", async ({ page }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Navigate to inventory
      await page.goto("/inventory");
      await expect(page).toHaveURL("/inventory");

      // Should see stock management options
      await expect(page.locator("text=Stock Adjustments")).toBeVisible();

      console.log("✅ Stock management accessible");
    });
  });

  test.describe("9. Dashboard Analytics", () => {
    test("should display dashboard with analytics", async ({ page }) => {
      // Login as admin
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Navigate to dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/dashboard");

      // Should see dashboard elements
      await expect(page.locator("text=Dashboard")).toBeVisible();
      await expect(page.locator("text=Sales")).toBeVisible();
      await expect(page.locator("text=Inventory")).toBeVisible();

      console.log("✅ Dashboard analytics displayed");
    });
  });

  test.describe("10. User Management", () => {
    test("should allow admin to manage users", async ({ page }) => {
      // Login as admin
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Navigate to admin panel
      await page.goto("/admin");
      await expect(page).toHaveURL("/admin");

      // Should see user management
      await expect(page.locator("text=User Management")).toBeVisible();
      await expect(page.locator("text=Pending Users")).toBeVisible();

      console.log("✅ Admin can access user management");
    });

    test("should block non-admin from user management", async ({ page }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Try to access admin panel
      await page.goto("/admin");
      await expect(page).toHaveURL("/unauthorized");

      console.log("✅ Non-admin correctly blocked from user management");
    });
  });

  test.describe("11. Audit Logs", () => {
    test("should allow admin to view audit logs", async ({ page }) => {
      // Login as admin
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "ADMIN");
      }, APPROVED_ADMIN.email);

      // Navigate to audit logs
      await page.goto("/audit-logs");
      await expect(page).toHaveURL("/audit-logs");

      // Should see audit logs interface
      await expect(page.locator("text=Audit Logs")).toBeVisible();

      console.log("✅ Admin can access audit logs");
    });
  });

  test.describe("12. Purchase Orders", () => {
    test("should allow manager to manage purchase orders", async ({ page }) => {
      // Login as manager
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "MANAGER");
      }, APPROVED_MANAGER.email);

      // Navigate to purchase orders
      await page.goto("/inventory/purchase-orders");
      await expect(page).toHaveURL("/inventory/purchase-orders");

      // Should see purchase orders interface
      await expect(page.locator("text=Purchase Orders")).toBeVisible();

      console.log("✅ Manager can access purchase orders");
    });
  });
});
