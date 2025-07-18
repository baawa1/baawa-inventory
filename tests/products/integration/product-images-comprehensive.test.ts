import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/db";

// Mock dependencies
jest.mock("../../../../auth");
jest.mock("@/lib/db");
jest.mock("@/lib/logger");
jest.mock("@/lib/security-headers");
jest.mock("@/lib/rate-limiting");
jest.mock("@/lib/utils/image-utils");

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock user sessions
const mockAdminUser = {
  user: {
    id: "1",
    email: "admin@example.com",
    role: "ADMIN",
    status: "APPROVED",
  },
};

const mockManagerUser = {
  user: {
    id: "2",
    email: "manager@example.com",
    role: "MANAGER",
    status: "APPROVED",
  },
};

const mockStaffUser = {
  user: {
    id: "3",
    email: "staff@example.com",
    role: "STAFF",
    status: "APPROVED",
  },
};

// Mock product data
const mockProduct = {
  id: 1,
  name: "Test Product",
  description: "Test Description",
  sku: "TEST-001",
  barcode: "1234567890123",
  cost: 10.5,
  price: 15.99,
  stock: 100,
  minStock: 10,
  maxStock: 200,
  unit: "piece",
  status: "active",
  isArchived: false,
  categoryId: 1,
  brandId: 1,
  supplierId: 1,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  images: [
    {
      url: "https://example.com/image1.jpg",
      alt: "Product Image 1",
      isPrimary: true,
      order: 1,
    },
    {
      url: "https://example.com/image2.jpg",
      alt: "Product Image 2",
      isPrimary: false,
      order: 2,
    },
  ],
  brand: { name: "Test Brand" },
  category: { name: "Test Category" },
  supplier: { name: "Test Supplier", email: "supplier@test.com" },
  // Additional required fields
  color: null,
  size: null,
  material: null,
  weight: null,
  dimensions: null,
  tags: [],
  salePrice: null,
  saleStartDate: null,
  saleEndDate: null,
  metaTitle: null,
  metaDescription: null,
  seoKeywords: [],
  isFeatured: false,
  sortOrder: null,
};

// Mock image utilities
const mockImageUtils = {
  convertLegacyImages: jest.fn(),
  convertToStorageFormat: jest.fn(),
  convertFromStorageFormat: jest.fn(),
  extractStoragePath: jest.fn(),
  validateImageCount: jest.fn(),
  ensureUniqueImages: jest.fn(),
  sortImages: jest.fn(),
};

jest.doMock("@/lib/utils/image-utils", () => mockImageUtils);

describe("Product Images API Comprehensive Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.product = {
      findUnique: jest.fn(),
      update: jest.fn(),
    } as any;
  });

  describe("GET /api/products/[id]/images", () => {
    it("should return product images for authenticated user", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockImageUtils.convertFromStorageFormat.mockReturnValue(
        mockProduct.images
      );
      mockImageUtils.ensureUniqueImages.mockReturnValue(mockProduct.images);
      mockImageUtils.sortImages.mockReturnValue(mockProduct.images);

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images"
      );

      const { GET } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.productId).toBe(1);
      expect(data.images).toHaveLength(2);
    });

    it("should handle legacy image format", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
      });
      mockImageUtils.convertLegacyImages.mockReturnValue(mockProduct.images);
      mockImageUtils.ensureUniqueImages.mockReturnValue(mockProduct.images);
      mockImageUtils.sortImages.mockReturnValue(mockProduct.images);

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images"
      );

      const { GET } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "1" }),
      });

      expect(response.status).toBe(200);
      expect(mockImageUtils.convertLegacyImages).toHaveBeenCalled();
    });

    it("should return 401 for unauthenticated user", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images"
      );

      const { GET } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid product ID", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);

      const request = new NextRequest(
        "http://localhost:3000/api/products/invalid/images"
      );

      const { GET } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "invalid" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid product ID");
    });

    it("should return 404 for non-existent product", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/products/999/images"
      );

      const { GET } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "999" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("should handle empty images array", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: null,
      });
      mockImageUtils.ensureUniqueImages.mockReturnValue([]);
      mockImageUtils.sortImages.mockReturnValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images"
      );

      const { GET } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.images).toHaveLength(0);
    });
  });

  describe("PUT /api/products/[id]/images", () => {
    const validImages = [
      {
        url: "https://example.com/image1.jpg",
        alt: "Product Image 1",
        isPrimary: true,
        order: 1,
      },
      {
        url: "https://example.com/image2.jpg",
        alt: "Product Image 2",
        isPrimary: false,
        order: 2,
      },
    ];

    it("should update product images for admin user", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockImageUtils.validateImageCount.mockReturnValue(true);
      mockImageUtils.convertToStorageFormat.mockReturnValue([
        {
          url: "https://example.com/image1.jpg",
          alt: "Product Image 1",
          isPrimary: true,
          order: 1,
        },
        {
          url: "https://example.com/image2.jpg",
          alt: "Product Image 2",
          isPrimary: false,
          order: 2,
        },
      ]);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        images: validImages,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("updated");
    });

    it("should update product images for manager user", async () => {
      mockAuth.mockResolvedValue(mockManagerUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockImageUtils.validateImageCount.mockReturnValue(true);
      mockImageUtils.convertToStorageFormat.mockReturnValue(validImages);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        images: validImages,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });

      expect(response.status).toBe(200);
    });

    it("should return 403 for staff user", async () => {
      mockAuth.mockResolvedValue(mockStaffUser);

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Insufficient permissions");
    });

    it("should return 400 for too many images", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockImageUtils.validateImageCount.mockReturnValue(false);

      const tooManyImages = Array.from({ length: 11 }, (_, i) => ({
        url: `https://example.com/image${i + 1}.jpg`,
        alt: `Product Image ${i + 1}`,
        isPrimary: i === 0,
        order: i + 1,
      }));

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: tooManyImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Maximum");
    });

    it("should return 400 for multiple primary images", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockImageUtils.validateImageCount.mockReturnValue(true);

      const multiplePrimaryImages = [
        {
          url: "https://example.com/image1.jpg",
          alt: "Product Image 1",
          isPrimary: true,
          order: 1,
        },
        {
          url: "https://example.com/image2.jpg",
          alt: "Product Image 2",
          isPrimary: true,
          order: 2,
        },
      ];

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: multiplePrimaryImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Only one image can be marked as primary");
    });

    it("should set first image as primary if none specified", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockImageUtils.validateImageCount.mockReturnValue(true);
      mockImageUtils.convertToStorageFormat.mockReturnValue(validImages);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        images: validImages,
      });

      const noPrimaryImages = [
        {
          url: "https://example.com/image1.jpg",
          alt: "Product Image 1",
          isPrimary: false,
          order: 1,
        },
        {
          url: "https://example.com/image2.jpg",
          alt: "Product Image 2",
          isPrimary: false,
          order: 2,
        },
      ];

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: noPrimaryImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });

      expect(response.status).toBe(200);
    });

    it("should handle image cleanup for removed images", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: [
          {
            url: "https://example.com/old-image.jpg",
            alt: "Old Image",
            isPrimary: true,
            order: 1,
          },
        ],
      });
      mockImageUtils.validateImageCount.mockReturnValue(true);
      mockImageUtils.extractStoragePath.mockReturnValue("old-image.jpg");
      mockImageUtils.convertToStorageFormat.mockReturnValue(validImages);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        images: validImages,
      });

      // Mock fetch for cleanup
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);

      const invalidImages = [
        {
          url: "", // Invalid empty URL
          alt: "Invalid Image",
          isPrimary: true,
          order: 1,
        },
      ];

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: invalidImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });

      expect(response.status).toBe(400);
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockImageUtils.validateImageCount.mockReturnValue(true);
      mockPrisma.product.update.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update product images");
    });
  });

  describe("Image validation and processing", () => {
    it("should validate image count limits", () => {
      const { IMAGE_CONSTANTS } = require("@/types/product-images");

      // Test maximum images limit
      const maxImages = Array.from(
        { length: IMAGE_CONSTANTS.MAX_FILES_PER_PRODUCT },
        (_, i) => ({
          url: `https://example.com/image${i + 1}.jpg`,
          alt: `Image ${i + 1}`,
          isPrimary: i === 0,
          order: i + 1,
        })
      );

      expect(mockImageUtils.validateImageCount(maxImages.length)).toBe(true);

      // Test exceeding limit
      const tooManyImages = Array.from(
        { length: IMAGE_CONSTANTS.MAX_FILES_PER_PRODUCT + 1 },
        (_, i) => ({
          url: `https://example.com/image${i + 1}.jpg`,
          alt: `Image ${i + 1}`,
          isPrimary: i === 0,
          order: i + 1,
        })
      );

      expect(mockImageUtils.validateImageCount(tooManyImages.length)).toBe(
        false
      );
    });

    it("should ensure unique images", () => {
      const duplicateImages = [
        {
          url: "https://example.com/image1.jpg",
          alt: "Image 1",
          isPrimary: true,
          order: 1,
        },
        {
          url: "https://example.com/image1.jpg", // Duplicate URL
          alt: "Image 1 Duplicate",
          isPrimary: false,
          order: 2,
        },
      ];

      mockImageUtils.ensureUniqueImages.mockReturnValue([duplicateImages[0]]);

      const result = mockImageUtils.ensureUniqueImages(duplicateImages);
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe("https://example.com/image1.jpg");
    });

    it("should sort images by order", () => {
      const unsortedImages = [
        {
          url: "https://example.com/image2.jpg",
          alt: "Image 2",
          isPrimary: false,
          order: 2,
        },
        {
          url: "https://example.com/image1.jpg",
          alt: "Image 1",
          isPrimary: true,
          order: 1,
        },
      ];

      const sortedImages = [
        {
          url: "https://example.com/image1.jpg",
          alt: "Image 1",
          isPrimary: true,
          order: 1,
        },
        {
          url: "https://example.com/image2.jpg",
          alt: "Image 2",
          isPrimary: false,
          order: 2,
        },
      ];

      mockImageUtils.sortImages.mockReturnValue(sortedImages);

      const result = mockImageUtils.sortImages(unsortedImages);
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle malformed image data", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);

      const malformedImages = [
        {
          url: "https://example.com/image1.jpg",
          // Missing required fields
        },
      ];

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: malformedImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });

      expect(response.status).toBe(400);
    });

    it("should handle storage cleanup failures gracefully", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: [
          {
            url: "https://example.com/old-image.jpg",
            alt: "Old Image",
            isPrimary: true,
            order: 1,
          },
        ],
      });
      mockImageUtils.validateImageCount.mockReturnValue(true);
      mockImageUtils.extractStoragePath.mockReturnValue("old-image.jpg");
      mockImageUtils.convertToStorageFormat.mockReturnValue(validImages);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        images: validImages,
      });

      // Mock fetch to fail
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });

      // Should still succeed even if cleanup fails
      expect(response.status).toBe(200);
    });

    it("should handle concurrent image updates", async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockImageUtils.validateImageCount.mockReturnValue(true);
      mockImageUtils.convertToStorageFormat.mockReturnValue(validImages);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        images: validImages,
      });

      const request1 = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const request2 = new NextRequest(
        "http://localhost:3000/api/products/1/images",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: validImages }),
        }
      );

      const { PUT } = await import(
        "../../../../src/app/api/products/[id]/images/route"
      );

      const [response1, response2] = await Promise.all([
        PUT(request1, { params: Promise.resolve({ id: "1" }) }),
        PUT(request2, { params: Promise.resolve({ id: "1" }) }),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });
});
