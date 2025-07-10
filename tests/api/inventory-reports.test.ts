import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { createMocks } from "node-mocks-http";
import { GET as getInventoryReport } from "@/app/api/reports/inventory/route";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

// Mock the auth helper
// Temporarily using next-auth directly until Auth.js v5 migration is complete
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock the database
jest.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    brand: {
      findMany: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
    },
  },
}));

const mockGetServerSession = require("next-auth").getServerSession;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Inventory Report API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/reports/inventory", () => {
    it("should return unauthorized when user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return forbidden when user has insufficient permissions", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "UNAUTHORIZED" },
      });

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should generate current stock report", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProducts = [
        {
          id: 1,
          name: "Product 1",
          sku: "P001",
          stock: 100,
          minStock: 10,
          maxStock: 200,
          cost: 50,
          price: 100,
          isArchived: false,
          updatedAt: new Date(),
          category: { name: "Electronics" },
          brand: { name: "Samsung" },
          supplier: { name: "Tech Supplier" },
        },
        {
          id: 2,
          name: "Product 2",
          sku: "P002",
          stock: 5,
          minStock: 10,
          maxStock: 100,
          cost: 30,
          price: 60,
          isArchived: false,
          updatedAt: new Date(),
          category: { name: "Accessories" },
          brand: { name: "Apple" },
          supplier: { name: "Another Supplier" },
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=current_stock",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Current Stock Report");
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Product 1");
      expect(data.data[0].stockValue).toBe(5000); // 100 * 50
      expect(data.data[0].isLowStock).toBe(false);
      expect(data.data[1].isLowStock).toBe(true); // 5 <= 10
    });

    it("should generate stock value report", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "MANAGER" },
      });

      const mockProducts = [
        {
          id: 1,
          name: "Product 1",
          sku: "P001",
          stock: 100,
          cost: 50,
          price: 100,
          isArchived: false,
          category: { name: "Electronics" },
          brand: { name: "Samsung" },
          supplier: { name: "Tech Supplier" },
        },
        {
          id: 2,
          name: "Product 2",
          sku: "P002",
          stock: 50,
          cost: 30,
          price: 60,
          isArchived: false,
          category: { name: "Accessories" },
          brand: { name: "Apple" },
          supplier: { name: "Another Supplier" },
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=stock_value",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Stock Value Report");
      expect(data.data.summary.totalProducts).toBe(2);
      expect(data.data.summary.totalStockValue).toBe(6500); // (100*50) + (50*30)
      expect(data.data.summary.totalSellingValue).toBe(13000); // (100*100) + (50*60)
      expect(data.data.summary.potentialProfit).toBe(6500); // 13000 - 6500
    });

    it("should generate low stock report", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "EMPLOYEE" },
      });

      const mockProducts = [
        {
          id: 1,
          name: "Low Stock Product",
          sku: "LSP001",
          stock: 5,
          minStock: 10,
          maxStock: 100,
          cost: 25,
          price: 50,
          isArchived: false,
          updatedAt: new Date(),
          category: { name: "Electronics" },
          brand: { name: "Samsung" },
          supplier: { name: "Tech Supplier" },
        },
        {
          id: 2,
          name: "Out of Stock Product",
          sku: "OSP001",
          stock: 0,
          minStock: 5,
          maxStock: 50,
          cost: 15,
          price: 30,
          isArchived: false,
          updatedAt: new Date(),
          category: { name: "Accessories" },
          brand: { name: "Apple" },
          supplier: { name: "Another Supplier" },
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=low_stock",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Low Stock Report");
      expect(data.data).toHaveLength(2);
      expect(data.data[0].currentStock).toBe(5);
      expect(data.data[0].stockShortage).toBe(5); // 10 - 5
      expect(data.data[1].currentStock).toBe(0);
      expect(data.data[1].daysOutOfStock).toBe("Out of Stock");
    });

    it("should generate product summary report", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProductCount = 25;
      const mockCategoryStats = [
        { categoryId: 1, _count: { id: 10 }, _sum: { stock: 500 } },
        { categoryId: 2, _count: { id: 15 }, _sum: { stock: 300 } },
      ];
      const mockBrandStats = [
        { brandId: 1, _count: { id: 12 }, _sum: { stock: 400 } },
        { brandId: 2, _count: { id: 13 }, _sum: { stock: 400 } },
      ];
      const mockSupplierStats = [
        { supplierId: 1, _count: { id: 15 }, _sum: { stock: 600 } },
        { supplierId: 2, _count: { id: 10 }, _sum: { stock: 200 } },
      ];

      const mockCategories = [
        { id: 1, name: "Electronics" },
        { id: 2, name: "Accessories" },
      ];
      const mockBrands = [
        { id: 1, name: "Samsung" },
        { id: 2, name: "Apple" },
      ];
      const mockSuppliers = [
        { id: 1, name: "Tech Supplier" },
        { id: 2, name: "Another Supplier" },
      ];

      mockPrisma.product.count.mockResolvedValue(mockProductCount);
      mockPrisma.product.groupBy.mockResolvedValueOnce(mockCategoryStats);
      mockPrisma.product.groupBy.mockResolvedValueOnce(mockBrandStats);
      mockPrisma.product.groupBy.mockResolvedValueOnce(mockSupplierStats);
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);
      mockPrisma.brand.findMany.mockResolvedValue(mockBrands);
      mockPrisma.supplier.findMany.mockResolvedValue(mockSuppliers);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=product_summary",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Product Summary Report");
      expect(data.data.totalProducts).toBe(25);
      expect(data.data.byCategory).toHaveLength(2);
      expect(data.data.byCategory[0].category).toBe("Electronics");
      expect(data.data.byCategory[0].productCount).toBe(10);
      expect(data.data.byBrand).toHaveLength(2);
      expect(data.data.bySupplier).toHaveLength(2);
    });

    it("should return CSV format when requested", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const mockProducts = [
        {
          id: 1,
          name: "Test Product",
          sku: "TEST001",
          stock: 100,
          minStock: 10,
          maxStock: 200,
          cost: 50,
          price: 100,
          isArchived: false,
          updatedAt: new Date("2023-01-01"),
          category: { name: "Electronics" },
          brand: { name: "Samsung" },
          supplier: { name: "Tech Supplier" },
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=current_stock&format=csv",
      });

      const response = await getInventoryReport(req as NextRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv");
      expect(response.headers.get("Content-Disposition")).toContain(
        "attachment"
      );
      expect(response.headers.get("Content-Disposition")).toContain(
        "current-stock-"
      );
    });

    it("should apply filters correctly", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      mockPrisma.product.findMany.mockResolvedValue([]);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=current_stock&category=1&brand=2&supplier=3&lowStockOnly=true&includeArchived=true",
      });

      const response = await getInventoryReport(req as NextRequest);

      expect(response.status).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: 1,
          brandId: 2,
          supplierId: 3,
        },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      });
    });

    it("should return 400 for invalid report type", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=invalid_type",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid report type");
    });

    it("should return 400 for invalid format type", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      mockPrisma.product.findMany.mockResolvedValue([]);

      const { req } = createMocks({
        method: "GET",
        url: "/api/reports/inventory?type=current_stock&format=invalid",
      });

      const response = await getInventoryReport(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid format type");
    });
  });
});
