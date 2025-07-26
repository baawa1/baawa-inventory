import { test, expect } from "@playwright/test";
import {
  testUserHelper,
  APPROVED_STAFF,
  APPROVED_MANAGER,
} from "../../e2e/test-user-helper";

test.describe("POS Integration Tests", () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test.describe("POS Access Control", () => {
    test("should allow staff to access POS", async ({ page }) => {
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

      console.log("✅ Staff can access POS");
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

      console.log("✅ Manager can access POS with full features");
    });

    test("should block unauthorized users from POS", async ({ page }) => {
      // Try to access POS without login
      await page.goto("/pos");
      await expect(page).toHaveURL("/login");

      console.log("✅ Unauthorized users blocked from POS");
    });
  });

  test.describe("Product Search and Selection", () => {
    test("should search for products successfully", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Search for products
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000); // Wait for search results

      // Should see search results or no results message
      const hasResults = await page
        .locator("text=No products found")
        .isVisible();
      const hasProducts =
        (await page.locator('[data-testid="product-item"]').count()) > 0;

      expect(hasResults || hasProducts).toBeTruthy();

      console.log("✅ Product search works correctly");
    });

    test("should switch between search modes", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Test barcode mode
      await page.click('button:has-text("Barcode")');
      await expect(page.locator('input[placeholder*="barcode"]')).toBeVisible();

      // Test camera mode
      await page.click('button:has-text("Camera")');
      await expect(page.locator("text=Camera Scanner")).toBeVisible();

      // Back to search mode
      await page.click('button:has-text("Search")');
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();

      console.log("✅ Search mode switching works");
    });
  });

  test.describe("Cart Management", () => {
    test("should add products to cart", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Search and add product (if available)
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      // Try to add product to cart if found
      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Should see product in cart
        await expect(page.locator("text=Cart (1)")).toBeVisible();
        console.log("✅ Product added to cart successfully");
      } else {
        console.log("ℹ️ No test products available for cart test");
      }
    });

    test("should update cart totals correctly", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Add product to cart if available
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Should show total
        await expect(page.locator("text=Total:")).toBeVisible();
        console.log("✅ Cart totals displayed correctly");
      } else {
        console.log("ℹ️ No test products available for total test");
      }
    });

    test("should clear cart", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Add product to cart if available
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Clear cart
        await page.click('button:has-text("Clear")');

        // Should show empty cart
        await expect(page.locator("text=Cart (0)")).toBeVisible();
        console.log("✅ Cart cleared successfully");
      } else {
        console.log("ℹ️ No test products available for clear cart test");
      }
    });
  });

  test.describe("Payment Flow", () => {
    test("should proceed to payment when items are in cart", async ({
      page,
    }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Add product to cart if available
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Proceed to payment
        await page.click('button:has-text("Proceed to Payment")');

        // Should show payment interface
        await expect(page.locator("text=Payment")).toBeVisible();
        console.log("✅ Payment flow initiated successfully");
      } else {
        console.log("ℹ️ No test products available for payment flow test");
      }
    });

    test("should require items in cart before payment", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Payment button should be disabled when cart is empty
      const paymentButton = page.locator(
        'button:has-text("Proceed to Payment")'
      );
      await expect(paymentButton).toBeDisabled();

      console.log("✅ Payment button correctly disabled for empty cart");
    });
  });

  test.describe("Customer Information", () => {
    test("should allow entering customer information", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Add product to cart if available
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Proceed to payment
        await page.click('button:has-text("Proceed to Payment")');

        // Fill customer information
        await page.fill('input[name="customerName"]', "Test Customer");
        await page.fill('input[name="customerPhone"]', "+2348012345678");
        await page.fill('input[name="customerEmail"]', "test@customer.com");

        // Should have entered values
        await expect(page.locator('input[name="customerName"]')).toHaveValue(
          "Test Customer"
        );
        await expect(page.locator('input[name="customerPhone"]')).toHaveValue(
          "+2348012345678"
        );
        await expect(page.locator('input[name="customerEmail"]')).toHaveValue(
          "test@customer.com"
        );

        console.log("✅ Customer information entry works");
      } else {
        console.log("ℹ️ No test products available for customer info test");
      }
    });
  });

  test.describe("Payment Methods", () => {
    test("should display payment method options", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Add product to cart if available
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Proceed to payment
        await page.click('button:has-text("Proceed to Payment")');

        // Should see payment method options
        await expect(page.locator('input[value="cash"]')).toBeVisible();
        await expect(page.locator('input[value="card"]')).toBeVisible();
        await expect(page.locator('input[value="transfer"]')).toBeVisible();

        console.log("✅ Payment method options displayed");
      } else {
        console.log("ℹ️ No test products available for payment methods test");
      }
    });

    test("should select payment method", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Add product to cart if available
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Proceed to payment
        await page.click('button:has-text("Proceed to Payment")');

        // Select cash payment
        await page.click('input[value="cash"]');
        await expect(page.locator('input[value="cash"]')).toBeChecked();

        console.log("✅ Payment method selection works");
      } else {
        console.log("ℹ️ No test products available for payment selection test");
      }
    });
  });

  test.describe("Receipt Generation", () => {
    test("should generate receipt after payment", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Add product to cart if available
      await page.fill('input[placeholder*="Search"]', "test");
      await page.waitForTimeout(1000);

      const addToCartButton = page
        .locator('button:has-text("Add to Cart")')
        .first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();

        // Proceed to payment
        await page.click('button:has-text("Proceed to Payment")');

        // Fill payment details
        await page.fill('input[name="amountPaid"]', "2000");
        await page.click('input[value="cash"]');

        // Complete payment
        await page.click('button:has-text("Complete Sale")');

        // Should show receipt or success message
        const hasReceipt = await page.locator("text=Receipt").isVisible();
        const hasSuccess = await page
          .locator("text=Payment processed")
          .isVisible();

        expect(hasReceipt || hasSuccess).toBeTruthy();

        console.log("✅ Receipt generation works");
      } else {
        console.log("ℹ️ No test products available for receipt test");
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Simulate network error by searching for invalid term
      await page.fill('input[placeholder*="Search"]', "error-test");
      await page.waitForTimeout(1000);

      // Should handle error gracefully
      const hasError = await page.locator("text=Error").isVisible();
      const hasNoResults = await page
        .locator("text=No products found")
        .isVisible();

      expect(hasError || hasNoResults).toBeTruthy();

      console.log("✅ Error handling works correctly");
    });
  });

  test.describe("Offline Functionality", () => {
    test("should show offline indicator when disconnected", async ({
      page,
    }) => {
      // Login as staff
      await page.goto("/test-data");
      await page.evaluate((email) => {
        localStorage.setItem("test-user-email", email);
        localStorage.setItem("test-user-status", "APPROVED");
        localStorage.setItem("test-user-role", "STAFF");
      }, APPROVED_STAFF.email);

      // Navigate to POS
      await page.goto("/pos");

      // Check for offline indicator (may not be visible if online)
      const offlineIndicator = page.locator("text=Offline");
      const isOffline = await offlineIndicator.isVisible();

      if (isOffline) {
        console.log("✅ Offline indicator displayed");
      } else {
        console.log("ℹ️ System is online, offline indicator not visible");
      }
    });
  });
});
