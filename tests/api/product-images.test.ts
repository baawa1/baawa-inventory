import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/products/[id]/images/route";
import httpMocks from "node-mocks-http";

// Mock Next.js Request and Response
global.Request = jest.fn().mockImplementation((url, options) => {
  const req = httpMocks.createRequest({
    url,
    method: options?.method || "GET",
    headers: options?.headers || {},
    body: options?.body,
  });
  return req;
});

global.Response = jest.fn().mockImplementation((body, init) => {
  return {
    status: init?.status || 200,
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => (typeof body === "string" ? JSON.parse(body) : body),
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  };
});

// Mock the auth helper
jest.mock("@/lib/auth-helpers", () => ({
  getServerSession: jest.fn(),
}));

// Mock the database
jest.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockGetServerSession = require("@/lib/auth-helpers").getServerSession;

describe("Product Images API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication and Authorization", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = new Request("http://localhost/api/products/1/images");
      const response = await GET(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when user has insufficient permissions for write operations", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "EMPLOYEE" },
      });

      const mockRequest = new Request(
        "http://localhost/api/products/1/images",
        {
          method: "PUT",
          body: JSON.stringify({ images: [] }),
        }
      );

      const response = await PUT(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Insufficient permissions");
    });
  });

  describe("GET /api/products/[id]/images", () => {
    it("should return product images successfully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProduct = {
        id: 1,
        name: "Test Product",
        images: [
          {
            id: "img1",
            url: "https://example.com/image1.jpg",
            filename: "image1.jpg",
            size: 1024,
            mimeType: "image/jpeg",
            alt: "Test image",
            isPrimary: true,
            uploadedAt: "2023-01-01T00:00:00Z",
          },
        ],
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const mockRequest = new Request("http://localhost/api/products/1/images");
      const response = await GET(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.productId).toBe(1);
      expect(data.productName).toBe("Test Product");
      expect(data.images).toHaveLength(1);
      expect(data.images[0].isPrimary).toBe(true);
    });

    it("should return 404 when product is not found", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const mockRequest = new Request(
        "http://localhost/api/products/999/images"
      );
      const response = await GET(mockRequest, { params: { id: "999" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("should return empty array when product has no images", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProduct = {
        id: 1,
        name: "Test Product",
        images: null,
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const mockRequest = new Request("http://localhost/api/products/1/images");
      const response = await GET(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.images).toEqual([]);
    });
  });

  describe("PUT /api/products/[id]/images", () => {
    it("should update product images successfully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const newImages = [
        {
          id: "img1",
          url: "https://example.com/image1.jpg",
          filename: "image1.jpg",
          size: 1024,
          mimeType: "image/jpeg",
          alt: "Test image",
          isPrimary: true,
          uploadedAt: "2023-01-01T00:00:00Z",
        },
        {
          id: "img2",
          url: "https://example.com/image2.jpg",
          filename: "image2.jpg",
          size: 2048,
          mimeType: "image/jpeg",
          alt: "Another test image",
          isPrimary: false,
          uploadedAt: "2023-01-01T00:00:00Z",
        },
      ];

      const updatedProduct = {
        id: 1,
        name: "Test Product",
        images: newImages,
      };

      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      const mockRequest = new Request(
        "http://localhost/api/products/1/images",
        {
          method: "PUT",
          body: JSON.stringify({ images: newImages }),
        }
      );

      const response = await PUT(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Product images updated successfully");
      expect(data.product.images).toHaveLength(2);
    });

    it("should automatically set first image as primary when none is specified", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const imagesWithoutPrimary = [
        {
          id: "img1",
          url: "https://example.com/image1.jpg",
          filename: "image1.jpg",
          size: 1024,
          mimeType: "image/jpeg",
          alt: "Test image",
          isPrimary: false,
          uploadedAt: "2023-01-01T00:00:00Z",
        },
      ];

      (prisma.product.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: "Test Product",
        images: [{ ...imagesWithoutPrimary[0], isPrimary: true }],
      });

      const mockRequest = new Request(
        "http://localhost/api/products/1/images",
        {
          method: "PUT",
          body: JSON.stringify({ images: imagesWithoutPrimary }),
        }
      );

      await PUT(mockRequest, { params: { id: "1" } });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          images: [{ ...imagesWithoutPrimary[0], isPrimary: true }],
        },
        select: { id: true, name: true, images: true },
      });
    });

    it("should return 400 when multiple images are marked as primary", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const imagesWithMultiplePrimary = [
        {
          id: "img1",
          url: "https://example.com/image1.jpg",
          filename: "image1.jpg",
          size: 1024,
          mimeType: "image/jpeg",
          alt: "Test image",
          isPrimary: true,
          uploadedAt: "2023-01-01T00:00:00Z",
        },
        {
          id: "img2",
          url: "https://example.com/image2.jpg",
          filename: "image2.jpg",
          size: 2048,
          mimeType: "image/jpeg",
          alt: "Another test image",
          isPrimary: true,
          uploadedAt: "2023-01-01T00:00:00Z",
        },
      ];

      const mockRequest = new Request(
        "http://localhost/api/products/1/images",
        {
          method: "PUT",
          body: JSON.stringify({ images: imagesWithMultiplePrimary }),
        }
      );

      const response = await PUT(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Only one image can be marked as primary");
    });

    it("should handle invalid image data", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const invalidImages = [
        {
          id: "img1",
          url: "invalid-url",
          filename: "image1.jpg",
          size: "invalid-size",
          mimeType: "image/jpeg",
        },
      ];

      const mockRequest = new Request(
        "http://localhost/api/products/1/images",
        {
          method: "PUT",
          body: JSON.stringify({ images: invalidImages }),
        }
      );

      const response = await PUT(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid image data");
      expect(data.details).toBeDefined();
    });
  });

  describe("DELETE /api/products/[id]/images", () => {
    it("should delete a specific image successfully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const existingProduct = {
        images: [
          {
            id: "img1",
            url: "https://example.com/image1.jpg",
            filename: "image1.jpg",
            size: 1024,
            mimeType: "image/jpeg",
            isPrimary: true,
          },
          {
            id: "img2",
            url: "https://example.com/image2.jpg",
            filename: "image2.jpg",
            size: 2048,
            mimeType: "image/jpeg",
            isPrimary: false,
          },
        ],
      };

      const updatedProduct = {
        id: 1,
        name: "Test Product",
        images: [existingProduct.images[0]], // Only first image remains
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        existingProduct
      );
      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      const mockRequest = new Request(
        "http://localhost/api/products/1/images?imageId=img2",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Image deleted successfully");
      expect(data.product.images).toHaveLength(1);
    });

    it("should set new primary image when primary image is deleted", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const existingProduct = {
        images: [
          {
            id: "img1",
            url: "https://example.com/image1.jpg",
            filename: "image1.jpg",
            size: 1024,
            mimeType: "image/jpeg",
            isPrimary: true,
          },
          {
            id: "img2",
            url: "https://example.com/image2.jpg",
            filename: "image2.jpg",
            size: 2048,
            mimeType: "image/jpeg",
            isPrimary: false,
          },
        ],
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        existingProduct
      );
      (prisma.product.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: "Test Product",
        images: [{ ...existingProduct.images[1], isPrimary: true }],
      });

      const mockRequest = new Request(
        "http://localhost/api/products/1/images?imageId=img1",
        {
          method: "DELETE",
        }
      );

      await DELETE(mockRequest, { params: { id: "1" } });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          images: [{ ...existingProduct.images[1], isPrimary: true }],
        },
        select: { id: true, name: true, images: true },
      });
    });

    it("should return 400 when imageId is not provided", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockRequest = new Request(
        "http://localhost/api/products/1/images",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(mockRequest, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Image ID is required");
    });

    it("should return 404 when product is not found", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const mockRequest = new Request(
        "http://localhost/api/products/999/images?imageId=img1",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(mockRequest, { params: { id: "999" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });
  });

  describe("Input Validation", () => {
    it("should return 400 for invalid product ID", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockRequest = new Request(
        "http://localhost/api/products/invalid/images"
      );
      const response = await GET(mockRequest, { params: { id: "invalid" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid product ID");
    });
  });
});
