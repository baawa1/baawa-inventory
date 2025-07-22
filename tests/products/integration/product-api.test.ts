import { describe, it, expect, beforeEach } from "@jest/globals";

// Mock fetch for API testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("Product API Integration Tests", () => {
  beforeEach(() => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe("GET /api/products", () => {
    it("should fetch products list successfully", async () => {
      const mockProducts = [
        { id: 1, name: "Test Product 1", sku: "TEST-001" },
        { id: 2, name: "Test Product 2", sku: "TEST-002" },
      ];

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          status: 200,
          json: async () => ({
            data: mockProducts,
            pagination: { page: 1, limit: 10, total: 2 },
          }),
        } as Response
      );

      const response = await fetch("/api/products?page=1&limit=10");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toEqual(mockProducts);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it("should handle search parameters", async () => {
      const mockProducts = [
        { id: 1, name: "Search Result", sku: "SEARCH-001" },
      ];

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          status: 200,
          json: async () => ({
            data: mockProducts,
            pagination: { page: 1, limit: 10, total: 1 },
          }),
        } as Response
      );

      const response = await fetch("/api/products?search=test&categoryId=1");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toEqual(mockProducts);
    });

    it("should handle authentication errors", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized" }),
        } as Response
      );

      const response = await fetch("/api/products");
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/products", () => {
    it("should create a new product successfully", async () => {
      const productData = {
        name: "New Product",
        sku: "NEW-001",
        purchasePrice: 10.5,
        sellingPrice: 15.99,
        minimumStock: 5,
        currentStock: 10,
        status: "ACTIVE",
      };

      const createdProduct = { id: 1, ...productData };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          status: 201,
          json: async () => ({ data: createdProduct }),
        } as Response
      );

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(data.data).toEqual(createdProduct);
    });

    it("should handle validation errors", async () => {
      const invalidProductData = {
        name: "", // Invalid: empty name
        sku: "INVALID-001",
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          status: 400,
          json: async () => ({
            error: "Validation failed",
            details: ["Name is required"],
          }),
        } as Response
      );

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidProductData),
      });
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });
  });

  describe("PUT /api/products/[id]", () => {
    it("should update a product successfully", async () => {
      const updateData = {
        name: "Updated Product",
        sellingPrice: 19.99,
      };

      const updatedProduct = { id: 1, ...updateData };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          status: 200,
          json: async () => ({ data: updatedProduct }),
        } as Response
      );

      const response = await fetch("/api/products/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toEqual(updatedProduct);
    });

    it("should handle product not found", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          status: 404,
          json: async () => ({ error: "Product not found" }),
        } as Response
      );

      const response = await fetch("/api/products/999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });
  });

  describe("DELETE /api/products/[id]", () => {
    it("should delete a product successfully", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          status: 200,
          json: async () => ({ message: "Product deleted successfully" }),
        } as Response
      );

      const response = await fetch("/api/products/1", {
        method: "DELETE",
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.message).toBe("Product deleted successfully");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(fetch("/api/products")).rejects.toThrow("Network error");
    });

    it("should handle server errors", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          status: 500,
          json: async () => ({ error: "Internal server error" }),
        } as Response
      );

      const response = await fetch("/api/products");
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
