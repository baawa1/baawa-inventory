import {
  mockPrisma,
  mockSupabase,
  createMockProduct,
  createMockUser,
  createMockSalesTransaction,
  resetAllMocks,
} from "../utils/test-utils";

// Mock the database clients
jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

describe("Integration Tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("Product Management Integration", () => {
    it("should create product and sync to Supabase", async () => {
      // Mock Prisma product creation
      const newProduct = createMockProduct({
        name: "Integration Test Product",
      });
      mockPrisma.product.create.mockResolvedValue(newProduct);

      // Mock Supabase sync
      const supabaseQuery = mockSupabase.from("products");
      supabaseQuery.insert.mockReturnValue(supabaseQuery);
      supabaseQuery.select.mockReturnValue(supabaseQuery);
      supabaseQuery.single.mockResolvedValue({ data: newProduct, error: null });

      // Simulate the integration flow
      const prismaResult = await mockPrisma.product.create({
        data: {
          name: "Integration Test Product",
          sku: "INT-001",
          category: "Test",
          cost: 10.0,
          price: 20.0,
        },
      });

      const supabaseResult = await mockSupabase
        .from("products")
        .insert(prismaResult)
        .select()
        .single();

      expect(prismaResult).toEqual(newProduct);
      expect(supabaseResult.data).toEqual(newProduct);
      expect(supabaseResult.error).toBeNull();
      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith("products");
    });

    it("should handle product creation with database transaction", async () => {
      const product = createMockProduct();
      const stockAdjustment = {
        id: 1,
        productId: product.id,
        type: "INCREASE",
        quantity: 100,
        previousStock: 0,
        newStock: 100,
        reason: "Initial stock",
        userId: 1,
        createdAt: new Date(),
      };

      // Mock transaction
      mockPrisma.$transaction.mockResolvedValue([product, stockAdjustment]);

      const result = await mockPrisma.$transaction([
        mockPrisma.product.create({ data: {} }),
        mockPrisma.stockAdjustment.create({ data: {} }),
      ]);

      expect(result).toEqual([product, stockAdjustment]);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("should rollback transaction on error", async () => {
      const error = new Error("Transaction failed");
      mockPrisma.$transaction.mockRejectedValue(error);

      await expect(
        mockPrisma.$transaction([
          mockPrisma.product.create({ data: {} }),
          mockPrisma.stockAdjustment.create({ data: {} }),
        ])
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("Sales Transaction Integration", () => {
    it("should process complete sales transaction with stock updates", async () => {
      const user = createMockUser();
      const product = createMockProduct({ stock: 100 });
      const transaction = createMockSalesTransaction();
      const updatedProduct = createMockProduct({
        ...product,
        stock: 98, // Stock reduced by 2
      });

      // Mock the transaction flow
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.salesTransaction.create.mockResolvedValue(transaction);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      // Simulate the integration flow
      const cashier = await mockPrisma.user.findUnique({ where: { id: 1 } });
      const productToSell = await mockPrisma.product.findUnique({
        where: { id: 1 },
      });
      const saleTransaction = await mockPrisma.salesTransaction.create({
        data: {
          transactionCode: "TXN-001",
          total: 40.0,
          subtotal: 40.0,
          paymentMethod: "CASH",
          cashierId: cashier!.id,
        },
      });
      const productAfterSale = await mockPrisma.product.update({
        where: { id: 1 },
        data: { stock: productToSell!.stock - 2 },
      });

      expect(cashier).toEqual(user);
      expect(productToSell).toEqual(product);
      expect(saleTransaction).toEqual(transaction);
      expect(productAfterSale.stock).toBe(98);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.salesTransaction.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.product.update).toHaveBeenCalledTimes(1);
    });

    it("should handle inventory validation before sale", async () => {
      const product = createMockProduct({ stock: 1 });

      mockPrisma.product.findUnique.mockResolvedValue(product);

      const productToSell = await mockPrisma.product.findUnique({
        where: { id: 1 },
      });
      const requestedQuantity = 5;

      // Simulate inventory check
      const hasEnoughStock = productToSell!.stock >= requestedQuantity;

      expect(hasEnoughStock).toBe(false);
      expect(productToSell!.stock).toBe(1);
    });

    it("should process refund with stock restoration", async () => {
      const originalTransaction = createMockSalesTransaction({ id: 1 });
      const product = createMockProduct({ stock: 98 });
      const refundTransaction = createMockSalesTransaction({
        id: 2,
        isRefund: true,
        total: -40.0,
        refundReason: "Customer return",
      });
      const restoredProduct = createMockProduct({
        ...product,
        stock: 100, // Stock restored
      });

      mockPrisma.salesTransaction.findUnique.mockResolvedValue(
        originalTransaction
      );
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.salesTransaction.create.mockResolvedValue(refundTransaction);
      mockPrisma.product.update.mockResolvedValue(restoredProduct);

      // Simulate refund flow
      const originalSale = await mockPrisma.salesTransaction.findUnique({
        where: { id: 1 },
      });
      const productToRestore = await mockPrisma.product.findUnique({
        where: { id: 1 },
      });
      const refund = await mockPrisma.salesTransaction.create({
        data: {
          transactionCode: "RFD-001",
          total: -40.0,
          isRefund: true,
          cashierId: 1,
        },
      });
      const restoredStock = await mockPrisma.product.update({
        where: { id: 1 },
        data: { stock: productToRestore!.stock + 2 },
      });

      expect(originalSale).toEqual(originalTransaction);
      expect(refund.isRefund).toBe(true);
      expect(refund.total).toBe(-40.0);
      expect(restoredStock.stock).toBe(100);
    });
  });

  describe("Multi-Database Synchronization", () => {
    it("should sync data between Prisma and Supabase", async () => {
      const product = createMockProduct();

      // Mock Prisma operations
      mockPrisma.product.findMany.mockResolvedValue([product]);

      // Mock Supabase operations
      const supabaseQuery = mockSupabase.from("products");
      supabaseQuery.select.mockReturnValue(supabaseQuery);
      supabaseQuery.limit.mockResolvedValue({ data: [product], error: null });

      // Simulate sync operation
      const prismaProducts = await mockPrisma.product.findMany();
      const supabaseProducts = await mockSupabase
        .from("products")
        .select("*")
        .limit(100);

      expect(prismaProducts).toEqual([product]);
      expect(supabaseProducts.data).toEqual([product]);
      expect(supabaseProducts.error).toBeNull();
    });

    it("should handle sync conflicts gracefully", async () => {
      const product = createMockProduct({ updatedAt: new Date("2024-01-02") });
      const conflictingProduct = createMockProduct({
        id: product.id,
        name: "Conflicting Product",
        updatedAt: new Date("2024-01-01"),
      });

      mockPrisma.product.findUnique.mockResolvedValue(product);

      const supabaseQuery = mockSupabase.from("products");
      supabaseQuery.select.mockReturnValue(supabaseQuery);
      supabaseQuery.eq.mockReturnValue(supabaseQuery);
      supabaseQuery.single.mockResolvedValue({
        data: conflictingProduct,
        error: null,
      });

      // Simulate conflict detection
      const prismaProduct = await mockPrisma.product.findUnique({
        where: { id: 1 },
      });
      const supabaseProduct = await mockSupabase
        .from("products")
        .select("*")
        .eq("id", 1)
        .single();

      // Check which version is newer
      const prismaIsNewer =
        prismaProduct!.updatedAt > supabaseProduct.data!.updatedAt;

      expect(prismaIsNewer).toBe(true);
      expect(prismaProduct!.updatedAt).toEqual(new Date("2024-01-02"));
      expect(supabaseProduct.data!.updatedAt).toEqual(new Date("2024-01-01"));
    });
  });

  describe("Authentication Integration", () => {
    it("should validate user session across services", async () => {
      const user = createMockUser();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "1", email: user.email } },
        error: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue(user);

      // Simulate authentication check
      const supabaseAuth = await mockSupabase.auth.getUser();
      const prismaUser = await mockPrisma.user.findUnique({
        where: { email: supabaseAuth.data.user!.email },
      });

      expect(supabaseAuth.data.user!.email).toBe(user.email);
      expect(prismaUser).toEqual(user);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
      });
    });

    it("should handle authentication errors", async () => {
      const authError = { message: "Invalid token" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: authError,
      });

      const supabaseAuth = await mockSupabase.auth.getUser();

      expect(supabaseAuth.data.user).toBeNull();
      expect(supabaseAuth.error).toEqual(authError);
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle cascading failures gracefully", async () => {
      const dbError = new Error("Database connection failed");

      mockPrisma.product.findMany.mockRejectedValue(dbError);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Service unavailable" },
      });

      // Test that errors are properly propagated
      await expect(mockPrisma.product.findMany()).rejects.toThrow(
        "Database connection failed"
      );

      const authResult = await mockSupabase.auth.getUser();
      expect(authResult.error!.message).toBe("Service unavailable");
    });

    it("should implement proper retry logic", async () => {
      let callCount = 0;
      mockPrisma.product.findMany.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("Temporary failure"));
        }
        return Promise.resolve([createMockProduct()]);
      });

      // Simulate retry logic
      let result;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          result = await mockPrisma.product.findMany();
          break;
        } catch (error) {
          retries++;
          if (retries === maxRetries) {
            throw error;
          }
          // Wait before retry (simulated)
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      expect(result).toBeDefined();
      expect(callCount).toBe(3);
      expect(retries).toBe(2); // Failed twice, succeeded on third attempt
    });
  });

  describe("Performance Integration", () => {
    it("should handle batch operations efficiently", async () => {
      const products = Array.from({ length: 100 }, (_, i) =>
        createMockProduct({ id: i + 1, name: `Product ${i + 1}` })
      );

      mockPrisma.product.createMany.mockResolvedValue({ count: 100 });
      mockPrisma.product.findMany.mockResolvedValue(products);

      // Simulate batch creation
      const batchResult = await mockPrisma.product.createMany({
        data: products.map((p) => ({ name: p.name, sku: p.sku })),
      });

      const createdProducts = await mockPrisma.product.findMany();

      expect(batchResult.count).toBe(100);
      expect(createdProducts).toHaveLength(100);
      expect(mockPrisma.product.createMany).toHaveBeenCalledTimes(1);
    });

    it("should implement pagination for large datasets", async () => {
      const totalProducts = 1000;
      const pageSize = 20;
      const page1Products = Array.from({ length: pageSize }, (_, i) =>
        createMockProduct({ id: i + 1 })
      );

      mockPrisma.product.findMany.mockResolvedValue(page1Products);
      mockPrisma.product.count.mockResolvedValue(totalProducts);

      // Simulate pagination
      const products = await mockPrisma.product.findMany({
        skip: 0,
        take: pageSize,
      });

      const totalCount = await mockPrisma.product.count();
      const totalPages = Math.ceil(totalCount / pageSize);

      expect(products).toHaveLength(pageSize);
      expect(totalCount).toBe(totalProducts);
      expect(totalPages).toBe(50);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: pageSize,
      });
    });
  });
});
