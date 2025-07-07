import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { createMocks } from "node-mocks-http";
import { GET as getArchived } from "@/app/api/products/archived/route";
import { PATCH as archiveProduct } from "@/app/api/products/[id]/archive/route";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

// Mock the auth helper
jest.mock("@/lib/auth-helpers", () => ({
  getServerSession: jest.fn(),
}));

// Mock the database
jest.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockGetServerSession = require("@/lib/auth-helpers").getServerSession;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Product Archive API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/products/archived", () => {
    it("should return unauthorized when user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: "GET",
        url: "/api/products/archived",
      });

      const response = await getArchived(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return archived products for authenticated user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProducts = [
        {
          id: 1,
          name: "Archived Product 1",
          sku: "APR001",
          isArchived: true,
          price: 100,
          cost: 50,
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: { name: "Electronics" },
          brand: { name: "Samsung" },
          supplier: { name: "Tech Supplier" },
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const { req } = createMocks({
        method: "GET",
        url: "/api/products/archived",
      });

      const response = await getArchived(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toBe("Archived Product 1");
      expect(data.products[0].isArchived).toBe(true);
    });

    it("should filter archived products by search term", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProducts = [
        {
          id: 1,
          name: "iPhone 13",
          sku: "IP13001",
          isArchived: true,
          price: 100,
          cost: 50,
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: { name: "Electronics" },
          brand: { name: "Apple" },
          supplier: { name: "Tech Supplier" },
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const { req } = createMocks({
        method: "GET",
        url: "/api/products/archived?search=iPhone",
      });

      const response = await getArchived(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          isArchived: true,
          OR: [
            { name: { contains: "iPhone", mode: "insensitive" } },
            { sku: { contains: "iPhone", mode: "insensitive" } },
          ],
        },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: 0,
        take: 10,
      });
    });
  });

  describe("PATCH /api/products/[id]/archive", () => {
    it("should return unauthorized when user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: "PATCH",
        url: "/api/products/1/archive",
      });

      const response = await archiveProduct(req as NextRequest, {
        params: { id: "1" },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return forbidden when user has insufficient permissions", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "EMPLOYEE" },
      });

      const { req } = createMocks({
        method: "PATCH",
        url: "/api/products/1/archive",
      });

      const response = await archiveProduct(req as NextRequest, {
        params: { id: "1" },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Insufficient permissions");
    });

    it("should archive a product successfully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProduct = {
        id: 1,
        name: "Test Product",
        sku: "TEST001",
        isArchived: false,
      };

      const updatedProduct = {
        ...mockProduct,
        isArchived: true,
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const { req } = createMocks({
        method: "PATCH",
        url: "/api/products/1/archive",
        body: { archive: true },
      });

      const response = await archiveProduct(req as NextRequest, {
        params: { id: "1" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Product archived successfully");
      expect(data.product.isArchived).toBe(true);
    });

    it("should unarchive a product successfully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProduct = {
        id: 1,
        name: "Test Product",
        sku: "TEST001",
        isArchived: true,
      };

      const updatedProduct = {
        ...mockProduct,
        isArchived: false,
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const { req } = createMocks({
        method: "PATCH",
        url: "/api/products/1/archive",
        body: { archive: false },
      });

      const response = await archiveProduct(req as NextRequest, {
        params: { id: "1" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Product unarchived successfully");
      expect(data.product.isArchived).toBe(false);
    });

    it("should return 404 when product is not found", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      mockPrisma.product.findUnique.mockResolvedValue(null);

      const { req } = createMocks({
        method: "PATCH",
        url: "/api/products/999/archive",
        body: { archive: true },
      });

      const response = await archiveProduct(req as NextRequest, {
        params: { id: "999" },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("should return 400 for invalid product ID", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const { req } = createMocks({
        method: "PATCH",
        url: "/api/products/invalid/archive",
        body: { archive: true },
      });

      const response = await archiveProduct(req as NextRequest, {
        params: { id: "invalid" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid product ID");
    });
  });
});
