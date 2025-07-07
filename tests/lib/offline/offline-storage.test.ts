import {
  offlineStorage,
  generateTransactionId,
  OfflineTransaction,
  OfflineProduct,
} from "@/lib/utils/offline-storage";

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  close: jest.fn(),
};

const mockObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  count: jest.fn(),
  index: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
  addEventListener: jest.fn(),
};

const mockRequest = {
  result: mockDB,
  addEventListener: jest.fn(),
  onsuccess: null,
  onerror: null,
};

// Mock IndexedDB
Object.defineProperty(window, "indexedDB", {
  value: {
    open: jest.fn(() => mockRequest),
  },
  writable: true,
});

// Mock IDBKeyRange
Object.defineProperty(window, "IDBKeyRange", {
  value: {
    only: jest.fn((key) => ({ only: key })),
    bound: jest.fn((lower, upper) => ({ lower, upper })),
  },
  writable: true,
});

describe("offlineStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDB.transaction.mockReturnValue(mockTransaction);
  });

  describe("generateTransactionId", () => {
    test("generates unique transaction IDs", () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();

      expect(id1).toMatch(/^offline_\d+_[a-f0-9]{9}$/);
      expect(id2).toMatch(/^offline_\d+_[a-f0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });

    test("generates IDs with correct format", () => {
      const id = generateTransactionId();
      const parts = id.split("_");

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("offline");
      expect(parseInt(parts[1])).toBeGreaterThan(0);
      expect(parts[2]).toHaveLength(9);
    });
  });

  describe("transaction management", () => {
    const mockTransaction: OfflineTransaction = {
      id: "test-id",
      items: [
        {
          productId: 1,
          name: "Product 1",
          sku: "SKU001",
          price: 1000,
          quantity: 2,
          total: 2000,
        },
      ],
      subtotal: 2000,
      discount: 0,
      total: 2000,
      paymentMethod: "cash",
      customerEmail: "test@example.com",
      staffName: "Test Staff",
      staffId: 1,
      timestamp: new Date(),
      status: "pending",
      syncAttempts: 0,
    };

    test("stores transaction offline", async () => {
      const successRequest = { onsuccess: null, onerror: null };
      mockObjectStore.add.mockReturnValue(successRequest);

      const promise = offlineStorage.storeTransaction(mockTransaction);

      // Simulate success
      setTimeout(() => {
        if (successRequest.onsuccess) successRequest.onsuccess();
      }, 0);

      await promise;

      expect(mockDB.transaction).toHaveBeenCalledWith(
        ["transactions"],
        "readwrite"
      );
      expect(mockObjectStore.add).toHaveBeenCalledWith(mockTransaction);
    });

    test("retrieves all transactions", async () => {
      const mockTransactions = [
        mockTransaction,
        { ...mockTransaction, id: "test-id-2" },
      ];
      const getAllRequest = {
        result: mockTransactions,
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.getAll.mockReturnValue(getAllRequest);

      const promise = offlineStorage.getAllTransactions();

      // Simulate success
      setTimeout(() => {
        if (getAllRequest.onsuccess) getAllRequest.onsuccess();
      }, 0);

      const transactions = await promise;

      expect(mockDB.transaction).toHaveBeenCalledWith(
        ["transactions"],
        "readonly"
      );
      expect(mockObjectStore.getAll).toHaveBeenCalled();
      expect(transactions).toEqual(mockTransactions);
    });

    test("retrieves pending transactions", async () => {
      const pendingTransactions = [mockTransaction];
      const mockIndex = {
        getAll: jest.fn().mockReturnValue({
          result: pendingTransactions,
          onsuccess: null,
          onerror: null,
        }),
      };
      mockObjectStore.index.mockReturnValue(mockIndex);

      const getAllRequest = mockIndex.getAll();
      const promise = offlineStorage.getPendingTransactions();

      // Simulate success
      setTimeout(() => {
        if (getAllRequest.onsuccess) getAllRequest.onsuccess();
      }, 0);

      const pending = await promise;

      expect(mockObjectStore.index).toHaveBeenCalledWith("status");
      expect(mockIndex.getAll).toHaveBeenCalledWith("pending");
      expect(pending).toEqual(pendingTransactions);
    });

    test("updates transaction status", async () => {
      const getRequest = {
        result: mockTransaction,
        onsuccess: null,
        onerror: null,
      };
      const putRequest = { onsuccess: null, onerror: null };

      mockObjectStore.get.mockReturnValue(getRequest);
      mockObjectStore.put.mockReturnValue(putRequest);

      const promise = offlineStorage.updateTransactionStatus(
        "test-id",
        "synced"
      );

      // Simulate get success
      setTimeout(() => {
        if (getRequest.onsuccess) getRequest.onsuccess();
        // Then put success
        setTimeout(() => {
          if (putRequest.onsuccess) putRequest.onsuccess();
        }, 0);
      }, 0);

      await promise;

      expect(mockDB.transaction).toHaveBeenCalledWith(
        ["transactions"],
        "readwrite"
      );
      expect(mockObjectStore.get).toHaveBeenCalledWith("test-id");
      expect(mockObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "test-id",
          status: "synced",
        })
      );
    });
  });

  describe("product caching", () => {
    const mockProduct: OfflineProduct = {
      id: 1,
      name: "Test Product",
      sku: "SKU001",
      price: 1000,
      stock: 10,
      barcode: "123456789",
      description: "Test product description",
      category: "Electronics",
      brand: "TestBrand",
      status: "active",
      lastUpdated: new Date(),
    };

    test("caches products", async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 2, name: "Product 2" },
      ];
      const clearRequest = { onsuccess: null, onerror: null };
      const addRequest = { onsuccess: null, onerror: null };

      mockObjectStore.clear.mockReturnValue(clearRequest);
      mockObjectStore.add.mockReturnValue(addRequest);

      const promise = offlineStorage.cacheProducts(products);

      // Simulate clear success
      setTimeout(() => {
        if (clearRequest.onsuccess) clearRequest.onsuccess();
        // Then add success for each product
        setTimeout(() => {
          if (addRequest.onsuccess) addRequest.onsuccess();
          if (addRequest.onsuccess) addRequest.onsuccess();
        }, 0);
      }, 0);

      await promise;

      expect(mockDB.transaction).toHaveBeenCalledWith(
        ["products"],
        "readwrite"
      );
      expect(mockObjectStore.clear).toHaveBeenCalled();
      expect(mockObjectStore.add).toHaveBeenCalledTimes(2);
    });

    test("retrieves cached products", async () => {
      const products = [mockProduct];
      const getAllRequest = {
        result: products,
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.getAll.mockReturnValue(getAllRequest);

      const promise = offlineStorage.getCachedProducts();

      // Simulate success
      setTimeout(() => {
        if (getAllRequest.onsuccess) getAllRequest.onsuccess();
      }, 0);

      const cachedProducts = await promise;

      expect(mockDB.transaction).toHaveBeenCalledWith(["products"], "readonly");
      expect(cachedProducts).toEqual(products);
    });

    test("searches products by name", async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 2, name: "Another Product" },
      ];

      // Mock getCachedProducts to return our test products
      jest
        .spyOn(offlineStorage, "getCachedProducts")
        .mockResolvedValue(products);

      const results = await offlineStorage.searchCachedProducts("Test");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test Product");
    });

    test("finds product by barcode", async () => {
      const mockIndex = {
        get: jest.fn().mockReturnValue({
          result: mockProduct,
          onsuccess: null,
          onerror: null,
        }),
      };
      mockObjectStore.index.mockReturnValue(mockIndex);

      const getRequest = mockIndex.get();
      const promise = offlineStorage.getProductByBarcode("123456789");

      // Simulate success
      setTimeout(() => {
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const product = await promise;

      expect(mockObjectStore.index).toHaveBeenCalledWith("barcode");
      expect(mockIndex.get).toHaveBeenCalledWith("123456789");
      expect(product).toEqual(mockProduct);
    });
  });

  describe("error handling", () => {
    test("handles database connection errors", async () => {
      mockRequest.addEventListener.mockImplementation((event, callback) => {
        if (event === "error") {
          setTimeout(() => callback(new Error("Database error")), 0);
        }
      });

      const errorRequest = { onsuccess: null, onerror: null };
      mockObjectStore.add.mockReturnValue(errorRequest);

      const promise = offlineStorage.storeTransaction({} as OfflineTransaction);

      // Simulate error
      setTimeout(() => {
        if (errorRequest.onerror) errorRequest.onerror();
      }, 0);

      await expect(promise).rejects.toThrow();
    });

    test("handles missing data gracefully", async () => {
      const mockIndex = {
        get: jest.fn().mockReturnValue({
          result: undefined,
          onsuccess: null,
          onerror: null,
        }),
      };
      mockObjectStore.index.mockReturnValue(mockIndex);

      const getRequest = mockIndex.get();
      const promise = offlineStorage.getProductByBarcode("nonexistent");

      // Simulate success with no result
      setTimeout(() => {
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const product = await promise;
      expect(product).toBeNull();
    });
  });

  describe("database initialization", () => {
    test("initializes database with correct version", () => {
      // Access the private property for testing
      expect(window.indexedDB.open).toHaveBeenCalledWith(
        "baawa_pos_offline",
        1
      );
    });
  });
});
