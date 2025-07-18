import { test, expect } from "@playwright/test";
import {
  testUserHelper,
  APPROVED_ADMIN,
  APPROVED_MANAGER,
  APPROVED_STAFF,
} from "./test-user-helper";

test.describe("POS Transaction Workflow", () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test.describe("1. POS Interface Access", () => {
    test("should allow all approved users to access POS", async ({ page }) => {
      const users = [
        { user: APPROVED_ADMIN, role: "ADMIN" },
        { user: APPROVED_MANAGER, role: "MANAGER" },
        { user: APPROVED_STAFF, role: "STAFF" },
      ];

      for (const { user, role } of users) {
        // Login as user
        await page.goto("/test-data");
        await page.evaluate((email) => {
          localStorage.setItem("test-user-email", email);
          localStorage.setItem("test-user-status", "APPROVED");
          localStorage.setItem("test-user-role", "STAFF");
        }, user.email);

        // Navigate to POS
        await page.goto("/pos");
        await expect(page).toHaveURL("/pos");

        // Should see POS interface
        await expect(page.locator("text=Point of Sale")).toBeVisible();
        await expect(page.locator("text=Search products")).toBeVisible();

        console.log(`✅ ${role} can access POS interface`);
      }
    });

    test("should block unapproved users from POS", async ({ page }) => {
      // Try to access POS without authentication
      await page.goto("/pos");
      await expect(page).toHaveURL("/login");

      console.log("✅ Unauthenticated users blocked from POS");
    });
  });

  test.describe("2. Product Search and Selection", () => {
    test("should search products by name", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Search for a product
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);

      // Should see search results
      await expect(page.locator("text=Test Product E2E")).toBeVisible();

      console.log("✅ Product search by name works");
    });

    test("should search products by barcode", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Switch to barcode mode
      await page.click('button:has-text("Barcode")');
      await expect(
        page.locator('input[placeholder*="Enter barcode"]')
      ).toBeVisible();

      // Enter barcode
      await page.fill('input[placeholder*="Enter barcode"]', "TEST-E2E-001");
      await page.press('input[placeholder*="Enter barcode"]', "Enter");

      // Should find product by barcode
      await expect(page.locator("text=Test Product E2E")).toBeVisible();

      console.log("✅ Product search by barcode works");
    });

    test("should handle invalid barcode gracefully", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Switch to barcode mode
      await page.click('button:has-text("Barcode")');

      // Enter invalid barcode
      await page.fill('input[placeholder*="Enter barcode"]', "INVALID-BARCODE");
      await page.press('input[placeholder*="Enter barcode"]', "Enter");

      // Should show error message
      await expect(page.locator("text=Product not found")).toBeVisible();

      console.log("✅ Invalid barcode handled gracefully");
    });
  });

  test.describe("3. Shopping Cart Management", () => {
    test("should add products to cart", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Search and add product
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Should see product in cart
      await expect(page.locator("text=Test Product E2E")).toBeVisible();
      await expect(page.locator("text=Total:")).toBeVisible();

      console.log("✅ Product added to cart successfully");
    });

    test("should update quantities in cart", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Increase quantity
      await page.click('button:has-text("+")');
      await expect(page.locator('input[value="2"]')).toBeVisible();

      // Decrease quantity
      await page.click('button:has-text("-")');
      await expect(page.locator('input[value="1"]')).toBeVisible();

      console.log("✅ Cart quantity updates work");
    });

    test("should remove products from cart", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Remove product
      await page.click('button:has-text("Remove")');
      await expect(page.locator("text=Test Product E2E")).not.toBeVisible();

      console.log("✅ Product removed from cart successfully");
    });

    test("should calculate totals correctly", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Check subtotal
      await expect(page.locator("text=₦1,500")).toBeVisible();

      // Add quantity
      await page.click('button:has-text("+")');
      await expect(page.locator("text=₦3,000")).toBeVisible();

      console.log("✅ Cart totals calculated correctly");
    });
  });

  test.describe("4. Payment Processing", () => {
    test("should process cash payment", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');

      // Fill customer information
      await page.fill('input[name="customerName"]', "Cash Customer");
      await page.fill('input[name="customerPhone"]', "+2348012345678");

      // Select cash payment
      await page.click('input[value="cash"]');

      // Enter payment amount
      await page.fill('input[name="amountPaid"]', "2000");

      // Process payment
      await page.click('button:has-text("Process Payment")');

      // Should show success message
      await expect(
        page.locator("text=Payment processed successfully")
      ).toBeVisible();

      console.log("✅ Cash payment processed successfully");
    });

    test("should process card payment", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');

      // Fill customer information
      await page.fill('input[name="customerName"]', "Card Customer");
      await page.fill('input[name="customerEmail"]', "card@customer.com");

      // Select card payment
      await page.click('input[value="card"]');

      // Process payment
      await page.click('button:has-text("Process Payment")');

      // Should show success message
      await expect(
        page.locator("text=Payment processed successfully")
      ).toBeVisible();

      console.log("✅ Card payment processed successfully");
    });

    test("should handle insufficient cash payment", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');

      // Select cash payment
      await page.click('input[value="cash"]');

      // Enter insufficient amount
      await page.fill('input[name="amountPaid"]', "1000");

      // Try to process payment
      await page.click('button:has-text("Process Payment")');

      // Should show error message
      await expect(
        page.locator("text=Insufficient payment amount")
      ).toBeVisible();

      console.log("✅ Insufficient payment handled correctly");
    });

    test("should calculate change correctly", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');

      // Select cash payment
      await page.click('input[value="cash"]');

      // Enter amount with change
      await page.fill('input[name="amountPaid"]', "2000");

      // Should show change calculation
      await expect(page.locator("text=Change: ₦500")).toBeVisible();

      console.log("✅ Change calculation works correctly");
    });
  });

  test.describe("5. Receipt Generation", () => {
    test("should generate receipt after successful payment", async ({
      page,
    }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');

      // Fill customer information
      await page.fill('input[name="customerName"]', "Receipt Customer");
      await page.fill('input[name="customerEmail"]', "receipt@customer.com");

      // Select payment method
      await page.click('input[value="card"]');

      // Process payment
      await page.click('button:has-text("Process Payment")');

      // Should show receipt
      await expect(page.locator("text=Receipt")).toBeVisible();
      await expect(page.locator("text=Test Product E2E")).toBeVisible();
      await expect(page.locator("text=₦1,500")).toBeVisible();

      console.log("✅ Receipt generated successfully");
    });

    test("should send email receipt when customer email provided", async ({
      page,
    }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');

      // Fill customer information with email
      await page.fill('input[name="customerName"]', "Email Customer");
      await page.fill('input[name="customerEmail"]', "email@customer.com");

      // Select payment method
      await page.click('input[value="card"]');

      // Process payment
      await page.click('button:has-text("Process Payment")');

      // Should show email receipt message
      await expect(page.locator("text=Email receipt sent")).toBeVisible();

      console.log("✅ Email receipt sent successfully");
    });
  });

  test.describe("6. Stock Integration", () => {
    test("should update stock after sale", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Check initial stock
      await page.goto("/inventory/products");
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);

      // Note initial stock level
      const initialStock = await page.locator("text=50").textContent();

      // Process sale
      await page.goto("/pos");
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');
      await page.click('button:has-text("Proceed to Payment")');
      await page.click('input[value="card"]');
      await page.click('button:has-text("Process Payment")');

      // Check updated stock
      await page.goto("/inventory/products");
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);

      // Stock should be reduced
      await expect(page.locator("text=49")).toBeVisible();

      console.log("✅ Stock updated after sale");
    });

    test("should prevent sale when stock is insufficient", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Add product to cart
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');

      // Try to add more than available stock
      for (let i = 0; i < 100; i++) {
        await page.click('button:has-text("+")');
      }

      // Should show stock warning
      await expect(page.locator("text=Insufficient stock")).toBeVisible();

      console.log("✅ Insufficient stock handled correctly");
    });
  });

  test.describe("7. Transaction History", () => {
    test("should record transaction in history", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Process a transaction
      await page.goto("/pos");
      await page.fill('input[placeholder*="Search"]', "Test Product");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Add to Cart")');
      await page.click('button:has-text("Proceed to Payment")');
      await page.click('input[value="card"]');
      await page.click('button:has-text("Process Payment")');

      // Check transaction history
      await page.goto("/pos/history");
      await expect(page.locator("text=Transaction History")).toBeVisible();
      await expect(page.locator("text=Test Product E2E")).toBeVisible();

      console.log("✅ Transaction recorded in history");
    });
  });

  test.describe("8. Error Handling", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Simulate offline mode by blocking network
      await page.route("**/*", (route) => route.abort());

      // Try to search products
      await page.fill('input[placeholder*="Search"]', "Test Product");

      // Should show offline message
      await expect(page.locator("text=Offline")).toBeVisible();

      console.log("✅ Network errors handled gracefully");
    });

    test("should handle invalid product data", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      await page.goto("/pos");

      // Search for non-existent product
      await page.fill('input[placeholder*="Search"]', "NonExistentProduct");
      await page.waitForTimeout(500);

      // Should show no results message
      await expect(page.locator("text=No products found")).toBeVisible();

      console.log("✅ Invalid product data handled gracefully");
    });
  });
});
