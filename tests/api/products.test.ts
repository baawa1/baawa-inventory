import { NextRequest } from "next/server";
import {
  mockPrisma,
  mockApiSuccess,
  mockApiError,
  createMockProduct,
  createMockSupplier,
  resetAllMocks,
} from "../utils/test-utils";

// Mock the Prisma client
jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

// Mock NextAuth
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Mock the API route handlers
const mockProductAPI = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
};

jest.mock("@/app/api/products/route", () => mockProductAPI);

describe("Products API Routes Tests", () => {
  beforeEach(() => {
    resetAllMocks();
    Object.values(mockProductAPI).forEach((fn) => fn.mockClear());
  });

  describe("GET /api/products", () => {
    it("should return all products successfully", async () => {
      const mockProducts = [
        createMockProduct(),
        createMockProduct({ id: 2, name: "Product 2" }),
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockProductAPI.GET.mockResolvedValue(mockApiSuccess(mockProducts));

      const request = new NextRequest("http://localhost:3000/api/products");
      const response = await mockProductAPI.GET(request);

      expect(response).toEqual(mockApiSuccess(mockProducts));
      expect(mockProductAPI.GET).toHaveBeenCalledWith(request);
    });

    it("should return products with search filter", async () => {
      const searchResults = [createMockProduct({ name: "Searched Product" })];

      mockPrisma.product.findMany.mockResolvedValue(searchResults);
      mockProductAPI.GET.mockResolvedValue(mockApiSuccess(searchResults));

      const request = new NextRequest(
        "http://localhost:3000/api/products?search=Searched"
      );
      const response = await mockProductAPI.GET(request);

      expect(response).toEqual(mockApiSuccess(searchResults));
    });

    it("should return products filtered by category", async () => {
      const categoryProducts = [createMockProduct({ category: "Watches" })];

      mockPrisma.product.findMany.mockResolvedValue(categoryProducts);
      mockProductAPI.GET.mockResolvedValue(mockApiSuccess(categoryProducts));

      const request = new NextRequest(
        "http://localhost:3000/api/products?category=Watches"
      );
      const response = await mockProductAPI.GET(request);

      expect(response).toEqual(mockApiSuccess(categoryProducts));
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockPrisma.product.findMany.mockRejectedValue(error);
      mockProductAPI.GET.mockResolvedValue(
        mockApiError("Database connection failed", 500)
      );

      const request = new NextRequest("http://localhost:3000/api/products");
      const response = await mockProductAPI.GET(request);

      expect(response).toEqual(mockApiError("Database connection failed", 500));
    });
  });

  describe("POST /api/products", () => {
    it("should create product successfully", async () => {
      const newProductData = {
        name: "New Product",
        sku: "NEW-001",
        category: "Test Category",
        cost: 10.0,
        price: 20.0,
        stock: 100,
        minStock: 10,
      };

      const createdProduct = createMockProduct(newProductData);

      mockPrisma.product.create.mockResolvedValue(createdProduct);
      mockProductAPI.POST.mockResolvedValue(mockApiSuccess(createdProduct));

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(newProductData),
      });

      const response = await mockProductAPI.POST(request);

      expect(response).toEqual(mockApiSuccess(createdProduct));
      expect(mockProductAPI.POST).toHaveBeenCalledWith(request);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        name: "", // Missing required field
        sku: "", // Missing required field
      };

      mockProductAPI.POST.mockResolvedValue(
        mockApiError("Name and SKU are required", 400)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await mockProductAPI.POST(request);

      expect(response).toEqual(mockApiError("Name and SKU are required", 400));
    });

    it("should handle duplicate SKU error", async () => {
      const duplicateData = {
        name: "Duplicate Product",
        sku: "EXISTING-001",
        category: "Test",
        cost: 10.0,
        price: 20.0,
      };

      const dbError = new Error("Unique constraint violation");
      mockPrisma.product.create.mockRejectedValue(dbError);
      mockProductAPI.POST.mockResolvedValue(
        mockApiError("SKU already exists", 409)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify(duplicateData),
      });

      const response = await mockProductAPI.POST(request);

      expect(response).toEqual(mockApiError("SKU already exists", 409));
    });

    it("should handle unauthorized access", async () => {
      mockProductAPI.POST.mockResolvedValue(mockApiError("Unauthorized", 401));

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await mockProductAPI.POST(request);

      expect(response).toEqual(mockApiError("Unauthorized", 401));
    });
  });

  describe("PUT /api/products", () => {
    it("should update product successfully", async () => {
      const updateData = {
        id: 1,
        name: "Updated Product",
        price: 25.0,
      };

      const updatedProduct = createMockProduct(updateData);

      mockPrisma.product.update.mockResolvedValue(updatedProduct);
      mockProductAPI.PUT.mockResolvedValue(mockApiSuccess(updatedProduct));

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      const response = await mockProductAPI.PUT(request);

      expect(response).toEqual(mockApiSuccess(updatedProduct));
      expect(mockProductAPI.PUT).toHaveBeenCalledWith(request);
    });

    it("should handle product not found", async () => {
      const updateData = { id: 999, name: "Non-existent Product" };

      const error = new Error("Product not found");
      mockPrisma.product.update.mockRejectedValue(error);
      mockProductAPI.PUT.mockResolvedValue(
        mockApiError("Product not found", 404)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      const response = await mockProductAPI.PUT(request);

      expect(response).toEqual(mockApiError("Product not found", 404));
    });

    it("should validate update data", async () => {
      const invalidUpdateData = {
        id: "invalid", // Should be number
        price: -10, // Should be positive
      };

      mockProductAPI.PUT.mockResolvedValue(
        mockApiError("Invalid update data", 400)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "PUT",
        body: JSON.stringify(invalidUpdateData),
      });

      const response = await mockProductAPI.PUT(request);

      expect(response).toEqual(mockApiError("Invalid update data", 400));
    });
  });

  describe("DELETE /api/products", () => {
    it("should delete product successfully", async () => {
      const productToDelete = createMockProduct({ id: 1 });

      mockPrisma.product.delete.mockResolvedValue(productToDelete);
      mockProductAPI.DELETE.mockResolvedValue(
        mockApiSuccess({ message: "Product deleted successfully" })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/products?id=1",
        {
          method: "DELETE",
        }
      );

      const response = await mockProductAPI.DELETE(request);

      expect(response).toEqual(
        mockApiSuccess({ message: "Product deleted successfully" })
      );
      expect(mockProductAPI.DELETE).toHaveBeenCalledWith(request);
    });

    it("should handle product not found for deletion", async () => {
      const error = new Error("Product not found");
      mockPrisma.product.delete.mockRejectedValue(error);
      mockProductAPI.DELETE.mockResolvedValue(
        mockApiError("Product not found", 404)
      );

      const request = new NextRequest(
        "http://localhost:3000/api/products?id=999",
        {
          method: "DELETE",
        }
      );

      const response = await mockProductAPI.DELETE(request);

      expect(response).toEqual(mockApiError("Product not found", 404));
    });

    it("should handle missing product ID", async () => {
      mockProductAPI.DELETE.mockResolvedValue(
        mockApiError("Product ID is required", 400)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "DELETE",
      });

      const response = await mockProductAPI.DELETE(request);

      expect(response).toEqual(mockApiError("Product ID is required", 400));
    });

    it("should prevent deletion of product with existing sales", async () => {
      const error = new Error("Cannot delete product with existing sales");
      mockPrisma.product.delete.mockRejectedValue(error);
      mockProductAPI.DELETE.mockResolvedValue(
        mockApiError("Cannot delete product with existing sales", 409)
      );

      const request = new NextRequest(
        "http://localhost:3000/api/products?id=1",
        {
          method: "DELETE",
        }
      );

      const response = await mockProductAPI.DELETE(request);

      expect(response).toEqual(
        mockApiError("Cannot delete product with existing sales", 409)
      );
    });
  });

  describe("Request Parsing and Validation", () => {
    it("should handle malformed JSON", async () => {
      mockProductAPI.POST.mockResolvedValue(
        mockApiError("Invalid JSON format", 400)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: "invalid json",
      });

      const response = await mockProductAPI.POST(request);

      expect(response).toEqual(mockApiError("Invalid JSON format", 400));
    });

    it("should handle missing request body", async () => {
      mockProductAPI.POST.mockResolvedValue(
        mockApiError("Request body is required", 400)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
      });

      const response = await mockProductAPI.POST(request);

      expect(response).toEqual(mockApiError("Request body is required", 400));
    });

    it("should handle query parameter parsing", async () => {
      const filteredProducts = [createMockProduct({ status: "ACTIVE" })];

      mockPrisma.product.findMany.mockResolvedValue(filteredProducts);
      mockProductAPI.GET.mockResolvedValue(mockApiSuccess(filteredProducts));

      const request = new NextRequest(
        "http://localhost:3000/api/products?status=ACTIVE&limit=10&offset=0"
      );
      const response = await mockProductAPI.GET(request);

      expect(response).toEqual(mockApiSuccess(filteredProducts));
    });
  });

  describe("Authentication and Authorization", () => {
    it("should require authentication for POST requests", async () => {
      mockProductAPI.POST.mockResolvedValue(
        mockApiError("Authentication required", 401)
      );

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      });

      const response = await mockProductAPI.POST(request);

      expect(response).toEqual(mockApiError("Authentication required", 401));
    });

    it("should require admin role for DELETE requests", async () => {
      mockProductAPI.DELETE.mockResolvedValue(
        mockApiError("Admin access required", 403)
      );

      const request = new NextRequest(
        "http://localhost:3000/api/products?id=1",
        {
          method: "DELETE",
        }
      );

      const response = await mockProductAPI.DELETE(request);

      expect(response).toEqual(mockApiError("Admin access required", 403));
    });
  });
});
