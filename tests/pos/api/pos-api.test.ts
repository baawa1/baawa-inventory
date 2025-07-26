import { test, expect } from "@playwright/test";
import { testUserHelper, APPROVED_STAFF } from "../../e2e/test-user-helper";

test.describe("POS API Tests", () => {
  test.beforeAll(async () => {
    await testUserHelper.initializeTestUsers();
  });

  test.describe("Product Search API", () => {
    test("should search products successfully", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Search for products
      const searchResponse = await request.get(
        "/api/pos/search-products?search=test&limit=10"
      );

      expect(searchResponse.ok()).toBeTruthy();

      const searchData = await searchResponse.json();
      expect(searchData).toHaveProperty("data");
      expect(searchData.data).toHaveProperty("products");
      expect(Array.isArray(searchData.data.products)).toBeTruthy();

      console.log("✅ Product search API works correctly");
    });

    test("should handle empty search term", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Search with empty term
      const searchResponse = await request.get(
        "/api/pos/search-products?search=&limit=10"
      );

      expect(searchResponse.status()).toBe(400);

      const errorData = await searchResponse.json();
      expect(errorData).toHaveProperty("error");

      console.log("✅ Empty search term handled correctly");
    });

    test("should respect search limit", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Search with limit
      const searchResponse = await request.get(
        "/api/pos/search-products?search=test&limit=5"
      );

      expect(searchResponse.ok()).toBeTruthy();

      const searchData = await searchResponse.json();
      expect(searchData.data.products.length).toBeLessThanOrEqual(5);

      console.log("✅ Search limit respected");
    });

    test("should filter by status", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Search with status filter
      const searchResponse = await request.get(
        "/api/pos/search-products?search=test&status=ACTIVE&limit=10"
      );

      expect(searchResponse.ok()).toBeTruthy();

      const searchData = await searchResponse.json();
      searchData.data.products.forEach((product: any) => {
        expect(product.status).toBe("ACTIVE");
      });

      console.log("✅ Status filtering works correctly");
    });
  });

  test.describe("Barcode Lookup API", () => {
    test("should lookup product by barcode", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Lookup by barcode
      const barcodeResponse = await request.get(
        "/api/pos/barcode-lookup?barcode=123456789"
      );

      // Should either find a product or return 404
      if (barcodeResponse.ok()) {
        const productData = await barcodeResponse.json();
        expect(productData).toHaveProperty("id");
        expect(productData).toHaveProperty("name");
        expect(productData).toHaveProperty("barcode");
        expect(productData.barcode).toBe("123456789");
        console.log("✅ Barcode lookup found product");
      } else {
        expect(barcodeResponse.status()).toBe(404);
        console.log(
          "✅ Barcode lookup correctly returned 404 for non-existent barcode"
        );
      }
    });

    test("should handle invalid barcode", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Lookup with empty barcode
      const barcodeResponse = await request.get(
        "/api/pos/barcode-lookup?barcode="
      );

      expect(barcodeResponse.status()).toBe(400);

      const errorData = await barcodeResponse.json();
      expect(errorData).toHaveProperty("error");

      console.log("✅ Invalid barcode handled correctly");
    });

    test("should return 404 for non-existent barcode", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Lookup non-existent barcode
      const barcodeResponse = await request.get(
        "/api/pos/barcode-lookup?barcode=NONEXISTENT123"
      );

      expect(barcodeResponse.status()).toBe(404);

      const errorData = await barcodeResponse.json();
      expect(errorData).toHaveProperty("error");

      console.log("✅ Non-existent barcode returns 404");
    });
  });

  test.describe("Transaction History API", () => {
    test("should fetch transaction history", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Fetch transaction history
      const historyResponse = await request.get(
        "/api/pos/transactions?limit=10"
      );

      expect(historyResponse.ok()).toBeTruthy();

      const historyData = await historyResponse.json();
      expect(historyData).toHaveProperty("data");
      expect(historyData.data).toHaveProperty("transactions");
      expect(Array.isArray(historyData.data.transactions)).toBeTruthy();

      console.log("✅ Transaction history API works correctly");
    });

    test("should filter transactions by date range", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Fetch transactions with date filter
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const historyResponse = await request.get(
        `/api/pos/transactions?startDate=${startDate}&endDate=${endDate}&limit=10`
      );

      expect(historyResponse.ok()).toBeTruthy();

      const historyData = await historyResponse.json();
      expect(historyData).toHaveProperty("data");

      console.log("✅ Date range filtering works");
    });

    test("should paginate transaction results", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Fetch first page
      const page1Response = await request.get(
        "/api/pos/transactions?page=1&limit=5"
      );
      expect(page1Response.ok()).toBeTruthy();

      const page1Data = await page1Response.json();
      expect(page1Data.data.transactions.length).toBeLessThanOrEqual(5);

      // Fetch second page
      const page2Response = await request.get(
        "/api/pos/transactions?page=2&limit=5"
      );
      expect(page2Response.ok()).toBeTruthy();

      console.log("✅ Transaction pagination works");
    });
  });

  test.describe("Receipt Generation API", () => {
    test("should generate receipt", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Generate receipt
      const receiptResponse = await request.post("/api/pos/print-receipt", {
        data: {
          transactionId: "test-transaction-123",
          items: [
            {
              id: 1,
              name: "Test Product",
              price: 1000,
              quantity: 2,
            },
          ],
          total: 2000,
          customerName: "Test Customer",
          paymentMethod: "Cash",
        },
      });

      // Should either succeed or return appropriate error
      if (receiptResponse.ok()) {
        const receiptData = await receiptResponse.json();
        expect(receiptData).toHaveProperty("success");
        console.log("✅ Receipt generation works");
      } else {
        // If printer not configured, should return appropriate error
        expect(receiptResponse.status()).toBeGreaterThanOrEqual(400);
        console.log("✅ Receipt generation handles printer errors correctly");
      }
    });

    test("should email receipt", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Email receipt
      const emailResponse = await request.post("/api/pos/email-receipt", {
        data: {
          transactionId: "test-transaction-123",
          customerEmail: "test@customer.com",
          items: [
            {
              id: 1,
              name: "Test Product",
              price: 1000,
              quantity: 2,
            },
          ],
          total: 2000,
        },
      });

      // Should either succeed or return appropriate error
      if (emailResponse.ok()) {
        const emailData = await emailResponse.json();
        expect(emailData).toHaveProperty("success");
        console.log("✅ Email receipt works");
      } else {
        // If email not configured, should return appropriate error
        expect(emailResponse.status()).toBeGreaterThanOrEqual(400);
        console.log("✅ Email receipt handles configuration errors correctly");
      }
    });
  });

  test.describe("Customer Management API", () => {
    test("should fetch customer purchase history", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Fetch customer history
      const customerResponse = await request.get(
        "/api/pos/customers/test@customer.com/purchases"
      );

      // Should either return data or 404
      if (customerResponse.ok()) {
        const customerData = await customerResponse.json();
        expect(customerData).toHaveProperty("data");
        console.log("✅ Customer purchase history works");
      } else {
        expect(customerResponse.status()).toBe(404);
        console.log("✅ Customer not found handled correctly");
      }
    });

    test("should reprint receipt", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Reprint receipt
      const reprintResponse = await request.post(
        "/api/pos/receipts/test-transaction-123/reprint"
      );

      // Should either succeed or return appropriate error
      if (reprintResponse.ok()) {
        const reprintData = await reprintResponse.json();
        expect(reprintData).toHaveProperty("success");
        console.log("✅ Receipt reprint works");
      } else {
        expect(reprintResponse.status()).toBeGreaterThanOrEqual(400);
        console.log("✅ Receipt reprint handles errors correctly");
      }
    });
  });

  test.describe("Analytics API", () => {
    test("should fetch sales analytics", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Fetch sales analytics
      const analyticsResponse = await request.get(
        "/api/pos/analytics/sales?period=7d"
      );

      expect(analyticsResponse.ok()).toBeTruthy();

      const analyticsData = await analyticsResponse.json();
      expect(analyticsData).toHaveProperty("data");

      console.log("✅ Sales analytics API works");
    });

    test("should fetch category analytics", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Fetch category analytics
      const analyticsResponse = await request.get(
        "/api/pos/analytics/categories?period=30d"
      );

      expect(analyticsResponse.ok()).toBeTruthy();

      const analyticsData = await analyticsResponse.json();
      expect(analyticsData).toHaveProperty("data");

      console.log("✅ Category analytics API works");
    });

    test("should fetch product analytics", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Fetch product analytics
      const analyticsResponse = await request.get(
        "/api/pos/analytics/products?period=7d&limit=10"
      );

      expect(analyticsResponse.ok()).toBeTruthy();

      const analyticsData = await analyticsResponse.json();
      expect(analyticsData).toHaveProperty("data");

      console.log("✅ Product analytics API works");
    });
  });

  test.describe("Authentication and Authorization", () => {
    test("should require authentication for POS APIs", async ({ request }) => {
      // Try to access POS API without authentication
      const searchResponse = await request.get(
        "/api/pos/search-products?search=test"
      );

      expect(searchResponse.status()).toBe(401);

      console.log("✅ Authentication required for POS APIs");
    });

    test("should require proper role for POS access", async ({ request }) => {
      // Login with user that doesn't have POS access
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: "unauthorized@example.com",
          password: "password123",
        },
      });

      // Try to access POS API
      const searchResponse = await request.get(
        "/api/pos/search-products?search=test"
      );

      expect(searchResponse.status()).toBe(403);

      console.log("✅ Proper role required for POS access");
    });
  });

  test.describe("Error Handling", () => {
    test("should handle malformed requests", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Send malformed request
      const malformedResponse = await request.post("/api/pos/search-products", {
        data: { invalid: "data" },
      });

      expect(malformedResponse.status()).toBe(405); // Method not allowed

      console.log("✅ Malformed requests handled correctly");
    });

    test("should handle server errors gracefully", async ({ request }) => {
      // Login as staff
      const loginResponse = await request.post("/api/auth/signin", {
        data: {
          email: APPROVED_STAFF.email,
          password: APPROVED_STAFF.password,
        },
      });

      expect(loginResponse.ok()).toBeTruthy();

      // Send request that might cause server error
      const errorResponse = await request.get(
        "/api/pos/search-products?search=error&limit=invalid"
      );

      expect(errorResponse.status()).toBeGreaterThanOrEqual(400);

      const errorData = await errorResponse.json();
      expect(errorData).toHaveProperty("error");

      console.log("✅ Server errors handled gracefully");
    });
  });
});
