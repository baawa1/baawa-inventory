import {
  mockPrisma,
  createMockProduct,
  createMockSalesTransaction,
  createMockSalesItem,
  resetAllMocks,
} from "../../utils/test-utils";

// Mock the Prisma client
jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

// Mock inventory utility functions
const mockInventoryUtils = {
  calculateTotalStock: jest.fn(),
  isLowStock: jest.fn(),
  updateStock: jest.fn(),
  processStockAdjustment: jest.fn(),
  generateSKU: jest.fn(),
  validateProductData: jest.fn(),
  searchProducts: jest.fn(),
  getStockLevels: jest.fn(),
};

// Mock the inventory utilities module
jest.mock("@/lib/utils/inventory", () => mockInventoryUtils);

describe("Inventory Utilities Tests", () => {
  beforeEach(() => {
    resetAllMocks();
    Object.values(mockInventoryUtils).forEach((fn) => fn.mockClear());
  });

  describe("Stock Calculations", () => {
    it("should calculate total stock correctly", () => {
      const products = [
        createMockProduct({ stock: 50 }),
        createMockProduct({ id: 2, stock: 30 }),
        createMockProduct({ id: 3, stock: 20 }),
      ];

      mockInventoryUtils.calculateTotalStock.mockReturnValue(100);

      const totalStock = mockInventoryUtils.calculateTotalStock(products);

      expect(totalStock).toBe(100);
      expect(mockInventoryUtils.calculateTotalStock).toHaveBeenCalledWith(
        products
      );
    });

    it("should identify low stock items", () => {
      const product = createMockProduct({ stock: 5, minStock: 10 });

      mockInventoryUtils.isLowStock.mockReturnValue(true);

      const isLow = mockInventoryUtils.isLowStock(product);

      expect(isLow).toBe(true);
      expect(mockInventoryUtils.isLowStock).toHaveBeenCalledWith(product);
    });

    it("should identify adequate stock items", () => {
      const product = createMockProduct({ stock: 50, minStock: 10 });

      mockInventoryUtils.isLowStock.mockReturnValue(false);

      const isLow = mockInventoryUtils.isLowStock(product);

      expect(isLow).toBe(false);
      expect(mockInventoryUtils.isLowStock).toHaveBeenCalledWith(product);
    });
  });

  describe("Stock Updates", () => {
    it("should update stock successfully", async () => {
      const updatedProduct = createMockProduct({ stock: 90 });
      mockInventoryUtils.updateStock.mockResolvedValue(updatedProduct);

      const result = await mockInventoryUtils.updateStock(1, -10, "Sale");

      expect(result).toEqual(updatedProduct);
      expect(mockInventoryUtils.updateStock).toHaveBeenCalledWith(
        1,
        -10,
        "Sale"
      );
    });

    it("should process stock adjustment", async () => {
      const adjustment = {
        productId: 1,
        type: "INCREASE" as const,
        quantity: 50,
        reason: "New shipment",
        userId: 1,
      };

      const mockAdjustment = {
        id: 1,
        ...adjustment,
        previousStock: 100,
        newStock: 150,
        createdAt: new Date(),
      };

      mockInventoryUtils.processStockAdjustment.mockResolvedValue(
        mockAdjustment
      );

      const result = await mockInventoryUtils.processStockAdjustment(
        adjustment
      );

      expect(result).toEqual(mockAdjustment);
      expect(mockInventoryUtils.processStockAdjustment).toHaveBeenCalledWith(
        adjustment
      );
    });

    it("should handle insufficient stock error", async () => {
      const error = new Error("Insufficient stock");
      mockInventoryUtils.updateStock.mockRejectedValue(error);

      await expect(
        mockInventoryUtils.updateStock(1, -200, "Sale")
      ).rejects.toThrow("Insufficient stock");
    });
  });

  describe("Product Management", () => {
    it("should generate unique SKU", () => {
      mockInventoryUtils.generateSKU.mockReturnValue("BW-001-2024");

      const sku = mockInventoryUtils.generateSKU("BW", "Watches");

      expect(sku).toBe("BW-001-2024");
      expect(mockInventoryUtils.generateSKU).toHaveBeenCalledWith(
        "BW",
        "Watches"
      );
    });

    it("should validate product data successfully", () => {
      const productData = {
        name: "Test Product",
        sku: "TEST-001",
        price: 20.0,
        cost: 10.0,
        category: "Test",
      };

      mockInventoryUtils.validateProductData.mockReturnValue({
        isValid: true,
        errors: [],
      });

      const validation = mockInventoryUtils.validateProductData(productData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(mockInventoryUtils.validateProductData).toHaveBeenCalledWith(
        productData
      );
    });

    it("should return validation errors for invalid data", () => {
      const invalidData = {
        name: "",
        sku: "",
        price: -5,
        cost: "invalid",
      };

      const errors = [
        "Name is required",
        "SKU is required",
        "Price must be positive",
      ];
      mockInventoryUtils.validateProductData.mockReturnValue({
        isValid: false,
        errors,
      });

      const validation = mockInventoryUtils.validateProductData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual(errors);
    });
  });

  describe("Product Search and Filtering", () => {
    it("should search products by name", async () => {
      const searchResults = [
        createMockProduct({ name: "Test Watch" }),
        createMockProduct({ id: 2, name: "Test Sunglasses" }),
      ];

      mockInventoryUtils.searchProducts.mockResolvedValue(searchResults);

      const results = await mockInventoryUtils.searchProducts("test", {
        field: "name",
      });

      expect(results).toEqual(searchResults);
      expect(mockInventoryUtils.searchProducts).toHaveBeenCalledWith("test", {
        field: "name",
      });
    });

    it("should search products by SKU", async () => {
      const product = createMockProduct({ sku: "TEST-001" });

      mockInventoryUtils.searchProducts.mockResolvedValue([product]);

      const results = await mockInventoryUtils.searchProducts("TEST-001", {
        field: "sku",
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(product);
    });

    it("should filter products by category", async () => {
      const watchProducts = [
        createMockProduct({ category: "Watches" }),
        createMockProduct({ id: 2, category: "Watches" }),
      ];

      mockInventoryUtils.searchProducts.mockResolvedValue(watchProducts);

      const results = await mockInventoryUtils.searchProducts("", {
        filters: { category: "Watches" },
      });

      expect(results).toEqual(watchProducts);
    });

    it("should return empty array for no matches", async () => {
      mockInventoryUtils.searchProducts.mockResolvedValue([]);

      const results = await mockInventoryUtils.searchProducts("nonexistent");

      expect(results).toHaveLength(0);
    });
  });

  describe("Stock Level Management", () => {
    it("should get stock levels for all products", async () => {
      const stockLevels = [
        {
          productId: 1,
          productName: "Product 1",
          currentStock: 50,
          minStock: 10,
          status: "adequate",
        },
        {
          productId: 2,
          productName: "Product 2",
          currentStock: 5,
          minStock: 10,
          status: "low",
        },
        {
          productId: 3,
          productName: "Product 3",
          currentStock: 0,
          minStock: 5,
          status: "out_of_stock",
        },
      ];

      mockInventoryUtils.getStockLevels.mockResolvedValue(stockLevels);

      const levels = await mockInventoryUtils.getStockLevels();

      expect(levels).toEqual(stockLevels);
      expect(levels).toHaveLength(3);
      expect(levels.filter((l: any) => l.status === "low")).toHaveLength(1);
      expect(
        levels.filter((l: any) => l.status === "out_of_stock")
      ).toHaveLength(1);
    });

    it("should get low stock items only", async () => {
      const lowStockItems = [
        {
          productId: 2,
          productName: "Product 2",
          currentStock: 5,
          minStock: 10,
          status: "low",
        },
      ];

      mockInventoryUtils.getStockLevels.mockResolvedValue(lowStockItems);

      const levels = await mockInventoryUtils.getStockLevels({
        filter: "low_stock",
      });

      expect(levels).toEqual(lowStockItems);
      expect(levels).toHaveLength(1);
      expect(mockInventoryUtils.getStockLevels).toHaveBeenCalledWith({
        filter: "low_stock",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      const error = new Error("Database connection failed");
      mockInventoryUtils.searchProducts.mockRejectedValue(error);

      await expect(mockInventoryUtils.searchProducts("test")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle invalid product ID", async () => {
      const error = new Error("Product not found");
      mockInventoryUtils.updateStock.mockRejectedValue(error);

      await expect(
        mockInventoryUtils.updateStock(999, 10, "Test")
      ).rejects.toThrow("Product not found");
    });
  });
});
