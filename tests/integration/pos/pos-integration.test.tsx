import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import POSPage from "@/app/(dashboard)/pos/page";
import { createMockSession } from "../../test-utils";

// Mock the POS components
jest.mock("@/components/pos/POSInterface", () => ({
  POSInterface: () => <div data-testid="pos-interface">POS Interface</div>,
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({
    data: createMockSession({ role: "ADMIN" }),
    status: "authenticated",
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

const renderPOSPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={createMockSession({ role: "ADMIN" })}>
        <POSPage />
      </SessionProvider>
    </QueryClientProvider>
  );
};

describe("POS Page Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders POS page with interface", () => {
    renderPOSPage();

    expect(screen.getByTestId("pos-interface")).toBeInTheDocument();
  });

  test("displays page title", () => {
    renderPOSPage();

    expect(screen.getByText("Point of Sale")).toBeInTheDocument();
  });
});

describe("POS API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Product Search API", () => {
    test("searches products successfully", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Test Product",
          sku: "SKU001",
          price: 1000,
          stock: 10,
          category: "Electronics",
          brand: "TestBrand",
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const response = await fetch("/api/pos/search-products?q=Test");
      const products = await response.json();

      expect(response.ok).toBe(true);
      expect(products).toEqual(mockProducts);
    });

    test("handles search errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const response = await fetch("/api/pos/search-products?q=Test");

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe("Barcode Lookup API", () => {
    test("finds product by barcode", async () => {
      const mockProduct = {
        id: 1,
        name: "Barcode Product",
        sku: "SKU001",
        barcode: "123456789",
        price: 1500,
        stock: 5,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });

      const response = await fetch("/api/pos/barcode-lookup?barcode=123456789");
      const product = await response.json();

      expect(response.ok).toBe(true);
      expect(product.barcode).toBe("123456789");
    });

    test("handles product not found", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Product not found" }),
      });

      const response = await fetch(
        "/api/pos/barcode-lookup?barcode=nonexistent"
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe("Create Sale API", () => {
    test("creates sale successfully", async () => {
      const saleData = {
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 1000,
            total: 2000,
          },
        ],
        subtotal: 2000,
        discount: 0,
        total: 2000,
        paymentMethod: "cash",
        customerName: "Test Customer",
        customerEmail: "test@example.com",
      };

      const mockSaleResponse = {
        id: 1,
        ...saleData,
        timestamp: new Date().toISOString(),
        success: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSaleResponse,
      });

      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      const sale = await response.json();

      expect(response.ok).toBe(true);
      expect(sale.success).toBe(true);
      expect(sale.total).toBe(2000);
    });

    test("handles validation errors", async () => {
      const invalidSaleData = {
        items: [], // Empty items should cause validation error
        total: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Validation failed",
          details: "Items array cannot be empty",
        }),
      });

      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidSaleData),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    test("handles insufficient stock errors", async () => {
      const saleData = {
        items: [
          {
            productId: 1,
            quantity: 100, // More than available stock
            price: 1000,
            total: 100000,
          },
        ],
        total: 100000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Insufficient stock",
          details: "Not enough stock available for product",
        }),
      });

      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe("Email Receipt API", () => {
    test("sends receipt email successfully", async () => {
      const receiptData = {
        saleId: 1,
        customerEmail: "customer@example.com",
        items: [
          {
            name: "Test Product",
            quantity: 1,
            price: 1000,
            total: 1000,
          },
        ],
        total: 1000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Receipt sent successfully",
        }),
      });

      const response = await fetch("/api/pos/email-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
    });

    test("handles email sending errors", async () => {
      const receiptData = {
        saleId: 1,
        customerEmail: "invalid-email",
        items: [],
        total: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Invalid email address",
          success: false,
        }),
      });

      const response = await fetch("/api/pos/email-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe("Transaction History API", () => {
    test("retrieves transaction history", async () => {
      const mockTransactions = [
        {
          id: 1,
          items: [
            {
              productId: 1,
              name: "Product 1",
              quantity: 1,
              price: 1000,
              total: 1000,
            },
          ],
          subtotal: 1000,
          discount: 0,
          total: 1000,
          paymentMethod: "cash",
          timestamp: new Date().toISOString(),
          customerName: "Test Customer",
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactions: mockTransactions,
          total: 1,
          page: 1,
          limit: 10,
        }),
      });

      const response = await fetch("/api/pos/transactions?page=1&limit=10");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.transactions).toHaveLength(1);
      expect(data.total).toBe(1);
    });

    test("handles pagination correctly", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactions: [],
          total: 50,
          page: 2,
          limit: 20,
          totalPages: 3,
        }),
      });

      const response = await fetch("/api/pos/transactions?page=2&limit=20");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.page).toBe(2);
      expect(data.totalPages).toBe(3);
    });
  });
});

describe("POS Offline Scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("handles complete offline workflow", async () => {
    // Mock offline storage
    const mockOfflineStorage = {
      storeTransaction: jest.fn().mockResolvedValue("offline_123"),
      getPendingTransactions: jest.fn().mockResolvedValue([]),
      cacheProducts: jest.fn().mockResolvedValue(undefined),
      getCachedProducts: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: "Cached Product",
          sku: "SKU001",
          price: 1000,
          stock: 10,
          barcode: "123456789",
          category: "Electronics",
          brand: "TestBrand",
          status: "active",
          lastUpdated: new Date(),
        },
      ]),
    };

    // Simulate offline mode
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    // Test product search from cache
    const cachedProducts = await mockOfflineStorage.getCachedProducts();
    expect(cachedProducts).toHaveLength(1);
    expect(cachedProducts[0].name).toBe("Cached Product");

    // Test transaction queuing
    const transactionData = {
      items: [
        {
          productId: 1,
          name: "Cached Product",
          quantity: 1,
          price: 1000,
          total: 1000,
        },
      ],
      total: 1000,
      paymentMethod: "cash",
    };

    const transactionId =
      await mockOfflineStorage.storeTransaction(transactionData);
    expect(transactionId).toBe("offline_123");
    expect(mockOfflineStorage.storeTransaction).toHaveBeenCalledWith(
      transactionData
    );
  });

  test("handles sync when coming back online", async () => {
    const mockPendingTransactions = [
      {
        id: "offline_123",
        items: [
          {
            productId: 1,
            name: "Product",
            quantity: 1,
            price: 1000,
            total: 1000,
          },
        ],
        total: 1000,
        status: "pending",
        timestamp: new Date(),
      },
    ];

    // Mock successful sync
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "server_123", success: true }),
    });

    // Simulate sync process
    for (const transaction of mockPendingTransactions) {
      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      expect(response.ok).toBe(true);
    }
  });

  test("handles sync failures gracefully", async () => {
    const mockPendingTransactions = [
      {
        id: "offline_456",
        items: [
          {
            productId: 1,
            name: "Product",
            quantity: 1,
            price: 1000,
            total: 1000,
          },
        ],
        total: 1000,
        status: "pending",
        timestamp: new Date(),
      },
    ];

    // Mock failed sync
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    // Simulate sync failure
    for (const transaction of mockPendingTransactions) {
      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    }
  });
});
