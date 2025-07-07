import { offlineModeManager } from "@/lib/utils/offline-mode";
import { offlineStorage } from "@/lib/utils/offline-storage";

// Mock the offline storage
jest.mock("@/lib/utils/offline-storage");
const mockOfflineStorage = offlineStorage as jest.Mocked<typeof offlineStorage>;

// Mock fetch
global.fetch = jest.fn();

// Mock navigator
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

// Mock connection info
Object.defineProperty(navigator, "connection", {
  writable: true,
  value: {
    type: "ethernet",
    effectiveType: "4g",
    downlink: 10,
    rtt: 50,
  },
});

describe("offlineModeManager", () => {
  let mockOnlineCallback: jest.Mock;
  let mockOfflineCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockOnlineCallback = jest.fn();
    mockOfflineCallback = jest.fn();

    // Reset navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Mock global event listeners
    global.addEventListener = jest.fn();
    global.removeEventListener = jest.fn();

    // Mock window event listeners
    Object.defineProperty(window, "addEventListener", {
      value: jest.fn(),
      writable: true,
    });
    Object.defineProperty(window, "removeEventListener", {
      value: jest.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("network status detection", () => {
    test("detects online status", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      const status = offlineModeManager.getStatus();
      expect(status.isOnline).toBe(true);
    });

    test("detects offline status", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const status = offlineModeManager.getStatus();
      expect(status.isOnline).toBe(false);
    });

    test("detects connection type", () => {
      const status = offlineModeManager.getStatus();
      expect(status.connectionType).toBe("ethernet");
    });

    test("handles missing connection info", () => {
      Object.defineProperty(navigator, "connection", {
        writable: true,
        value: undefined,
      });

      const status = offlineModeManager.getStatus();
      expect(status.connectionType).toBe("unknown");
    });
  });

  describe("network event handling", () => {
    test("registers online/offline event listeners", () => {
      offlineModeManager.addListener(mockOnlineCallback);

      expect(window.addEventListener).toHaveBeenCalledWith(
        "online",
        expect.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        "offline",
        expect.any(Function)
      );
    });

    test("notifies listeners on status change", () => {
      offlineModeManager.addListener(mockOnlineCallback);

      // Simulate going offline
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      // Trigger offline event manually
      const offlineHandler = (
        window.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "offline")?.[1];

      if (offlineHandler) {
        offlineHandler();
      }

      expect(mockOnlineCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: false,
        })
      );
    });

    test("removes listeners correctly", () => {
      offlineModeManager.addListener(mockOnlineCallback);
      offlineModeManager.removeListener(mockOnlineCallback);

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "online",
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "offline",
        expect.any(Function)
      );
    });
  });

  describe("connection quality monitoring", () => {
    test("detects slow connection", async () => {
      // Mock slow fetch response
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true }), 4000);
          })
      );

      // Start monitoring
      offlineModeManager.addListener(mockOnlineCallback);

      // Fast-forward time to trigger connection check
      jest.advanceTimersByTime(30000);

      // Allow the fetch promise to resolve
      await jest.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalledWith("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      });
    });

    test("handles connection check errors", async () => {
      // Mock failed fetch
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      offlineModeManager.addListener(mockOnlineCallback);

      // Fast-forward time to trigger connection check
      jest.advanceTimersByTime(30000);

      // Allow the fetch promise to reject
      await jest.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("transaction queuing", () => {
    test("queues transaction when offline", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const transactionData = {
        items: [{ id: 1, name: "Product", price: 1000, quantity: 1 }],
        total: 1000,
        paymentMethod: "cash",
      };

      mockOfflineStorage.storeTransaction.mockResolvedValue();

      const transactionId =
        await offlineModeManager.queueTransaction(transactionData);

      expect(transactionId).toMatch(/^offline_/);
      expect(mockOfflineStorage.storeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: transactionId,
          items: expect.any(Array),
          total: 1000,
          status: "pending",
        })
      );
    });

    test("throws error when trying to queue while online", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      const transactionData = { total: 1000 };

      await expect(
        offlineModeManager.queueTransaction(transactionData)
      ).rejects.toThrow("Cannot queue transaction while online");
    });
  });

  describe("transaction syncing", () => {
    test("syncs pending transactions when online", async () => {
      const pendingTransactions = [
        {
          id: "offline_123",
          items: [
            {
              productId: 1,
              name: "Product",
              price: 1000,
              quantity: 1,
              sku: "SKU001",
              total: 1000,
            },
          ],
          subtotal: 1000,
          discount: 0,
          total: 1000,
          paymentMethod: "cash" as const,
          staffName: "Test Staff",
          staffId: 1,
          timestamp: new Date(),
          status: "pending" as const,
          syncAttempts: 0,
        },
      ];

      mockOfflineStorage.getPendingTransactions.mockResolvedValue(
        pendingTransactions
      );
      mockOfflineStorage.updateTransactionStatus.mockResolvedValue();

      // Mock successful API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "server_123", success: true }),
      });

      const result = await offlineModeManager.syncPendingTransactions();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockOfflineStorage.updateTransactionStatus).toHaveBeenCalledWith(
        "offline_123",
        "synced"
      );
    });

    test("handles sync failures gracefully", async () => {
      const pendingTransactions = [
        {
          id: "offline_123",
          items: [
            {
              productId: 1,
              name: "Product",
              price: 1000,
              quantity: 1,
              sku: "SKU001",
              total: 1000,
            },
          ],
          subtotal: 1000,
          discount: 0,
          total: 1000,
          paymentMethod: "cash" as const,
          staffName: "Test Staff",
          staffId: 1,
          timestamp: new Date(),
          status: "pending" as const,
          syncAttempts: 0,
        },
      ];

      mockOfflineStorage.getPendingTransactions.mockResolvedValue(
        pendingTransactions
      );
      mockOfflineStorage.updateTransactionStatus.mockResolvedValue();

      // Mock failed API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      const result = await offlineModeManager.syncPendingTransactions();

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockOfflineStorage.updateTransactionStatus).toHaveBeenCalledWith(
        "offline_123",
        "failed",
        expect.stringContaining("HTTP 400")
      );
    });

    test("skips transactions with too many sync attempts", async () => {
      const pendingTransactions = [
        {
          id: "offline_123",
          items: [
            {
              productId: 1,
              name: "Product",
              price: 1000,
              quantity: 1,
              sku: "SKU001",
              total: 1000,
            },
          ],
          subtotal: 1000,
          discount: 0,
          total: 1000,
          paymentMethod: "cash" as const,
          staffName: "Test Staff",
          staffId: 1,
          timestamp: new Date(),
          status: "pending" as const,
          syncAttempts: 5, // Too many attempts
        },
      ];

      mockOfflineStorage.getPendingTransactions.mockResolvedValue(
        pendingTransactions
      );

      const result = await offlineModeManager.syncPendingTransactions();

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("periodic sync", () => {
    test("starts periodic sync when online", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      offlineModeManager.addListener(mockOnlineCallback);

      // Simulate coming online
      const onlineHandler = (
        window.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "online")?.[1];

      if (onlineHandler) {
        onlineHandler();
      }

      // Fast-forward time to trigger periodic sync
      jest.advanceTimersByTime(300000); // 5 minutes

      expect(mockOfflineStorage.getPendingTransactions).toHaveBeenCalled();
    });

    test("stops periodic sync when offline", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      // Simulate going offline
      const offlineHandler = (
        window.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === "offline")?.[1];

      if (offlineHandler) {
        offlineHandler();
      }

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe("queue statistics", () => {
    test("returns accurate queue statistics", async () => {
      const pendingTransactions = [
        { id: "1", status: "pending", syncAttempts: 0 },
        { id: "2", status: "pending", syncAttempts: 1 },
        { id: "3", status: "failed", syncAttempts: 3 },
      ];

      mockOfflineStorage.getPendingTransactions.mockResolvedValue(
        pendingTransactions as any
      );

      const stats = await offlineModeManager.getQueueStats();

      expect(stats.pendingTransactions).toBe(2); // Only count pending, not failed
      expect(stats.failedTransactions).toBe(1);
    });

    test("handles empty queue", async () => {
      mockOfflineStorage.getPendingTransactions.mockResolvedValue([]);

      const stats = await offlineModeManager.getQueueStats();

      expect(stats.pendingTransactions).toBe(0);
      expect(stats.failedTransactions).toBe(0);
    });
  });

  describe("product caching", () => {
    test("caches products successfully", async () => {
      const products = [
        { id: 1, name: "Product 1", price: 1000 },
        { id: 2, name: "Product 2", price: 2000 },
      ];

      // Mock successful API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => products,
      });

      mockOfflineStorage.cacheProducts.mockResolvedValue();

      await offlineModeManager.cacheProducts();

      expect(global.fetch).toHaveBeenCalledWith("/api/pos/products");
      expect(mockOfflineStorage.cacheProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "Product 1",
            status: "active",
          }),
        ])
      );
    });

    test("handles caching errors gracefully", async () => {
      // Mock failed API call
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(offlineModeManager.cacheProducts()).rejects.toThrow(
        "Network error"
      );
    });
  });
});
