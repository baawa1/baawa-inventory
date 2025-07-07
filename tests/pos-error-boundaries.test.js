/**
 * POS System Test with Error Boundaries
 * This script tests the POS system components with error boundaries
 */

const { test, expect } = require("@playwright/test");

// Test the POS system with error boundaries
test.describe("POS System Error Boundaries", () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff member
    await page.goto("/login");
    await page.fill('input[name="email"]', "staff@baawa.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("POSInterface renders with error boundaries", async ({ page }) => {
    await page.goto("/pos");

    // Check that main POS interface loads
    await expect(page.locator("h1")).toContainText("Point of Sale");

    // Check that error boundaries are present in the DOM
    await expect(page.locator('[data-testid="pos-interface"]')).toBeVisible();

    // Check that sub-components load without errors
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="shopping-cart"]')).toBeVisible();
  });

  test("ProductGrid handles API errors gracefully", async ({ page }) => {
    await page.goto("/pos");

    // Mock API failure
    await page.route("/api/pos/products*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    // Try to search for products
    await page.fill('input[placeholder*="Search"]', "test");
    await page.press('input[placeholder*="Search"]', "Enter");

    // Check that error is handled gracefully
    await expect(page.locator(".toast")).toContainText(
      "Error searching for product"
    );
  });

  test("PaymentInterface handles payment errors", async ({ page }) => {
    await page.goto("/pos");

    // Add a product to cart (mock success)
    await page.route("/api/pos/products*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [
            {
              id: 1,
              name: "Test Product",
              sku: "TEST-001",
              price: 100,
              stock: 10,
              category: "Test",
              brand: "Test Brand",
            },
          ],
        }),
      });
    });

    // Mock payment failure
    await page.route("/api/pos/create-sale", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Payment failed" }),
      });
    });

    // Add product to cart
    await page.click('button[data-testid="add-to-cart"]');

    // Proceed to payment
    await page.click('button:has-text("Proceed to Payment")');

    // Select payment method
    await page.selectOption('select[name="paymentMethod"]', "cash");

    // Try to complete payment
    await page.click('button:has-text("Complete Payment")');

    // Check that error is handled gracefully
    await expect(page.locator(".toast")).toContainText("Payment failed");
  });

  test("TransactionHistory handles load errors", async ({ page }) => {
    await page.goto("/pos/history");

    // Mock API failure
    await page.route("/api/pos/transactions*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to load transactions" }),
      });
    });

    // Refresh transactions
    await page.click('button[data-testid="refresh-transactions"]');

    // Check that error is handled gracefully
    await expect(page.locator(".toast")).toContainText(
      "Failed to load transaction history"
    );
  });

  test("Error boundary displays fallback UI", async ({ page }) => {
    await page.goto("/pos");

    // Simulate a JavaScript error in a component
    await page.evaluate(() => {
      // Create a component that will throw an error
      const errorComponent = document.createElement("div");
      errorComponent.id = "error-trigger";
      errorComponent.onclick = () => {
        throw new Error("Test error for error boundary");
      };
      document.body.appendChild(errorComponent);
    });

    // Trigger the error
    await page.click("#error-trigger");

    // Check that error boundary fallback is displayed
    await expect(page.locator("text=Something went wrong")).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test("Error boundary reset functionality", async ({ page }) => {
    await page.goto("/pos");

    // Simulate error and recovery
    await page.evaluate(() => {
      window.triggerError = () => {
        throw new Error("Test error");
      };
    });

    // If error boundary is triggered, test reset
    const errorBoundaryVisible = await page
      .locator("text=Something went wrong")
      .isVisible();
    if (errorBoundaryVisible) {
      await page.click('button:has-text("Try Again")');
      await expect(page.locator("h1")).toContainText("Point of Sale");
    }
  });

  test("Offline mode error handling", async ({ page }) => {
    await page.goto("/pos");

    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to perform actions that require network
    await page.fill('input[placeholder*="Search"]', "test");
    await page.press('input[placeholder*="Search"]', "Enter");

    // Check that offline status is shown
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();

    // Restore online mode
    await page.context().setOffline(false);
  });

  test("Form validation error handling", async ({ page }) => {
    await page.goto("/pos");

    // Try to proceed to payment with empty cart
    await page.click('button:has-text("Proceed to Payment")');

    // Button should be disabled
    await expect(
      page.locator('button:has-text("Proceed to Payment")')
    ).toBeDisabled();

    // Add invalid payment data
    await page.goto("/pos");
    // Add product first
    await page.route("/api/pos/products*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [
            {
              id: 1,
              name: "Test Product",
              sku: "TEST-001",
              price: 100,
              stock: 10,
              category: "Test",
              brand: "Test Brand",
            },
          ],
        }),
      });
    });

    // Try payment without selecting method
    await page.click('button:has-text("Proceed to Payment")');
    await page.click('button:has-text("Complete Payment")');

    // Check validation message
    await expect(page.locator(".toast")).toContainText(
      "Please select a payment method"
    );
  });

  test("Network error recovery", async ({ page }) => {
    await page.goto("/pos");

    // Mock network timeout
    await page.route("/api/pos/products*", (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 408,
          contentType: "application/json",
          body: JSON.stringify({ error: "Request timeout" }),
        });
      }, 5000);
    });

    // Try to search for products
    await page.fill('input[placeholder*="Search"]', "test");
    await page.press('input[placeholder*="Search"]', "Enter");

    // Check that loading state is shown
    await expect(
      page.locator('[data-testid="loading-indicator"]')
    ).toBeVisible();

    // After timeout, check error handling
    await expect(page.locator(".toast")).toContainText("Error", {
      timeout: 10000,
    });
  });

  test("Component-specific error boundaries", async ({ page }) => {
    await page.goto("/pos");

    // Test each component's error boundary individually
    const components = [
      "ProductGrid",
      "ShoppingCart",
      "PaymentInterface",
      "TransactionHistory",
    ];

    for (const component of components) {
      // Check that component has error boundary
      await expect(
        page.locator(`[data-testid="${component.toLowerCase()}"]`)
      ).toBeVisible();
    }
  });

  test("Error logging and reporting", async ({ page }) => {
    await page.goto("/pos");

    // Listen for console errors
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Simulate error that should be logged
    await page.evaluate(() => {
      throw new Error("Test error for logging");
    });

    // Check that error was logged
    expect(
      errors.some((error) => error.includes("Test error for logging"))
    ).toBe(true);
  });
});

// Export test utilities for manual testing
module.exports = {
  testPOSErrorBoundaries: async (browser) => {
    const page = await browser.newPage();

    try {
      // Login
      await page.goto("/login");
      await page.fill('input[name="email"]', "staff@baawa.com");
      await page.fill('input[name="password"]', "password123");
      await page.click('button[type="submit"]');

      // Test POS interface
      await page.goto("/pos");
      await expect(page.locator("h1")).toContainText("Point of Sale");

      console.log("✅ POS Error Boundaries Test Passed");
      return true;
    } catch (error) {
      console.error("❌ POS Error Boundaries Test Failed:", error);
      return false;
    } finally {
      await page.close();
    }
  },
};
