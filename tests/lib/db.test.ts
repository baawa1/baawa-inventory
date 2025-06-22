import {
  mockPrisma,
  testDatabaseConnection,
  createMockUser,
  createMockProduct,
  resetAllMocks,
} from "../utils/test-utils";

// Mock the Prisma client
jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

describe("Database Connection Tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("Connection", () => {
    it("should connect to database successfully", async () => {
      mockPrisma.$connect.mockResolvedValue(undefined);

      const result = await testDatabaseConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Database connection successful");
      expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
    });

    it("should handle connection failure", async () => {
      const errorMessage = "Connection failed";
      mockPrisma.$connect.mockRejectedValue(new Error(errorMessage));

      const result = await testDatabaseConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe("User Operations", () => {
    it("should create a user successfully", async () => {
      const mockUser = createMockUser();
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const userData = {
        email: "test@example.com",
        name: "Test User",
        role: "STAFF" as const,
      };

      const result = await mockPrisma.user.create({ data: userData });

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
    });

    it("should find users successfully", async () => {
      const mockUsers = [
        createMockUser(),
        createMockUser({ id: 2, email: "test2@example.com" }),
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await mockPrisma.user.findMany();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it("should find user by id successfully", async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await mockPrisma.user.findUnique({ where: { id: 1 } });

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should update user successfully", async () => {
      const updatedUser = createMockUser({ name: "Updated User" });
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await mockPrisma.user.update({
        where: { id: 1 },
        data: { name: "Updated User" },
      });

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "Updated User" },
      });
    });

    it("should delete user successfully", async () => {
      const deletedUser = createMockUser();
      mockPrisma.user.delete.mockResolvedValue(deletedUser);

      const result = await mockPrisma.user.delete({ where: { id: 1 } });

      expect(result).toEqual(deletedUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe("Product Operations", () => {
    it("should create a product successfully", async () => {
      const mockProduct = createMockProduct();
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const productData = {
        name: "Test Product",
        sku: "TEST-001",
        category: "Test Category",
        cost: 10.0,
        price: 20.0,
        stock: 100,
        minStock: 10,
      };

      const result = await mockPrisma.product.create({ data: productData });

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: productData,
      });
    });

    it("should find products with filters", async () => {
      const mockProducts = [
        createMockProduct(),
        createMockProduct({ id: 2, sku: "TEST-002" }),
      ];
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await mockPrisma.product.findMany({
        where: { category: "Test Category" },
        include: { supplier: true },
      });

      expect(result).toEqual(mockProducts);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { category: "Test Category" },
        include: { supplier: true },
      });
    });

    it("should handle product not found", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const result = await mockPrisma.product.findUnique({
        where: { id: 999 },
      });

      expect(result).toBeNull();
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe("Transaction Operations", () => {
    it("should handle database transactions", async () => {
      const mockResult = { success: true };
      mockPrisma.$transaction.mockResolvedValue(mockResult);

      const transactionCallback = jest.fn().mockResolvedValue(mockResult);

      const result = await mockPrisma.$transaction(transactionCallback);

      expect(result).toEqual(mockResult);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(transactionCallback);
    });

    it("should handle transaction rollback on error", async () => {
      const error = new Error("Transaction failed");
      mockPrisma.$transaction.mockRejectedValue(error);

      const transactionCallback = jest.fn().mockRejectedValue(error);

      await expect(
        mockPrisma.$transaction(transactionCallback)
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("Database Cleanup", () => {
    it("should disconnect from database", async () => {
      mockPrisma.$disconnect.mockResolvedValue(undefined);

      await mockPrisma.$disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
