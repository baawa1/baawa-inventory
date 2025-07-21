/**
 * Offline Mode Detection and Management
 * Handles network connectivity monitoring and offline state management
 */

import {
  offlineStorage,
  generateTransactionId,
  OfflineTransaction,
  OfflineProduct,
} from "./offline-storage";
import { logger } from "@/lib/logger";

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  lastOnlineTime?: Date;
  lastOfflineTime?: Date;
}

export interface OfflineQueueStats {
  pendingTransactions: number;
  failedTransactions: number;
  lastSyncAttempt?: Date;
  nextSyncAttempt?: Date;
}

class OfflineModeManager {
  private isOnline: boolean =
    typeof navigator !== "undefined" ? navigator.onLine : true;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private lastOnlineTime?: Date;
  private lastOfflineTime?: Date;
  private isSlowConnection: boolean = false;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init() {
    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));

    // Monitor connection quality
    this.monitorConnectionQuality();

    // Start sync process if online
    if (this.isOnline) {
      this.startPeriodicSync();
    }
  }

  private handleOnline() {
    // Debug logging removed for production
    this.isOnline = true;
    this.lastOnlineTime = new Date();
    this.notifyListeners();
    this.startPeriodicSync();

    // Trigger immediate sync when coming back online
    setTimeout(() => {
      this.syncPendingTransactions();
    }, 1000);
  }

  private handleOffline() {
    // Debug logging removed for production
    this.isOnline = false;
    this.lastOfflineTime = new Date();
    this.notifyListeners();
    this.stopPeriodicSync();
  }

  private monitorConnectionQuality() {
    // Check connection speed using a small request
    const checkConnection = async () => {
      if (!this.isOnline) return;

      try {
        const start = Date.now();
        const response = await fetch("/api/health", {
          method: "HEAD",
          cache: "no-cache",
        });
        const duration = Date.now() - start;

        // Consider slow if takes more than 3 seconds or fails
        this.isSlowConnection = duration > 3000 || !response.ok;
      } catch (_error) {
        this.isSlowConnection = true;
      }
    };

    // Check connection quality every 30 seconds
    setInterval(checkConnection, 30000);
    checkConnection(); // Initial check
  }

  private notifyListeners() {
    const status: NetworkStatus = {
      isOnline: this.isOnline,
      isSlowConnection: this.isSlowConnection,
      connectionType: this.getConnectionType(),
      lastOnlineTime: this.lastOnlineTime,
      lastOfflineTime: this.lastOfflineTime,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        logger.error("Offline status listener error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  private getConnectionType(): string | undefined {
    // navigator.connection is experimental
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    return connection?.effectiveType || connection?.type || undefined;
  }

  private startPeriodicSync() {
    if (this.syncInterval) return;

    // Sync every 5 minutes when online
    this.syncInterval = setInterval(
      () => {
        this.syncPendingTransactions();
      },
      5 * 60 * 1000
    );
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add listener for network status changes
   */
  addStatusListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);

    // Call immediately with current status
    listener({
      isOnline: this.isOnline,
      isSlowConnection: this.isSlowConnection,
      connectionType: this.getConnectionType(),
      lastOnlineTime: this.lastOnlineTime,
      lastOfflineTime: this.lastOfflineTime,
    });

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return {
      isOnline: this.isOnline,
      isSlowConnection: this.isSlowConnection,
      connectionType: this.getConnectionType(),
      lastOnlineTime: this.lastOnlineTime,
      lastOfflineTime: this.lastOfflineTime,
    };
  }

  /**
   * Queue a transaction for offline processing
   */
  async queueTransaction(transactionData: {
    items: Array<{
      productId: number;
      name: string;
      sku: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: "cash" | "pos" | "bank_transfer" | "mobile_money";
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    staffName: string;
    staffId: number;
  }): Promise<string> {
    const transaction: OfflineTransaction = {
      id: generateTransactionId(),
      ...transactionData,
      timestamp: new Date(),
      status: "pending",
      syncAttempts: 0,
    };

    await offlineStorage.storeTransaction(transaction);

    // Debug logging removed for production

    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => {
        this.syncSingleTransaction(transaction.id);
      }, 100);
    }

    return transaction.id;
  }

  /**
   * Sync all pending transactions
   */
  async syncPendingTransactions(): Promise<{
    success: number;
    failed: number;
  }> {
    if (!this.isOnline) {
      // Debug logging removed for production
      return { success: 0, failed: 0 };
    }

    try {
      await offlineStorage.init();
      const pendingTransactions = await offlineStorage.getPendingTransactions();

      // Debug logging removed for production

      let success = 0;
      let failed = 0;

      for (const transaction of pendingTransactions) {
        try {
          await this.syncSingleTransaction(transaction.id);
          success++;
        } catch (error) {
          logger.error("Failed to sync transaction", {
            transactionId: transaction.id,
            error: error instanceof Error ? error.message : String(error),
          });
          failed++;
        }
      }

      // Debug logging removed for production
      await offlineStorage.updateSyncStatus("lastSyncAttempt", new Date());

      return { success, failed };
    } catch (error) {
      logger.error("Error during sync", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Sync a single transaction
   */
  private async syncSingleTransaction(transactionId: string): Promise<void> {
    try {
      const pendingTransactions = await offlineStorage.getPendingTransactions();
      const transaction = pendingTransactions.find(
        (t) => t.id === transactionId
      );

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Convert offline transaction to API format
      const saleData = {
        items: transaction.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        customerName: transaction.customerName,
        customerPhone: transaction.customerPhone,
        customerEmail: transaction.customerEmail,
        amountPaid: transaction.total, // Assume full payment for offline transactions
        notes: `Offline transaction synced. Original ID: ${transaction.id}`,
      };

      // Send to server
      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Sync failed");
      }

      // Mark as synced
      await offlineStorage.updateTransactionStatus(transactionId, "synced");
      // Debug logging removed for production
    } catch (error) {
      logger.error("Failed to sync transaction", {
        transactionId,
        error: error instanceof Error ? error.message : String(error),
      });
      await offlineStorage.updateTransactionStatus(
        transactionId,
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  /**
   * Cache products for offline use
   */
  async cacheProductsForOffline(): Promise<void> {
    if (!this.isOnline) {
      // Debug logging removed for production
      return;
    }

    try {
      // Debug logging removed for production

      const response = await fetch("/api/pos/products?limit=0");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      const products: OfflineProduct[] = data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.price,
        stock: p.stock,
        category: p.category,
        brand: p.brand,
        description: p.description,
        status: p.status,
        lastUpdated: new Date(),
      }));

      await offlineStorage.cacheProducts(products);
      await offlineStorage.updateSyncStatus("lastProductSync", new Date());

      // Debug logging removed for production
    } catch (error) {
      logger.error("Failed to cache products", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get offline queue statistics
   */
  async getQueueStats(): Promise<OfflineQueueStats> {
    try {
      await offlineStorage.init();
      const pendingTransactions = await offlineStorage.getPendingTransactions();
      const failedTransactions = pendingTransactions.filter(
        (t) => t.status === "failed"
      );
      const lastSyncAttempt =
        await offlineStorage.getSyncStatus("lastSyncAttempt");

      return {
        pendingTransactions: pendingTransactions.length,
        failedTransactions: failedTransactions.length,
        lastSyncAttempt: lastSyncAttempt
          ? new Date(lastSyncAttempt)
          : undefined,
        nextSyncAttempt: this.syncInterval
          ? new Date(Date.now() + 5 * 60 * 1000)
          : undefined,
      };
    } catch (error) {
      logger.error("Failed to get queue stats", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        pendingTransactions: 0,
        failedTransactions: 0,
      };
    }
  }

  /**
   * Force sync now (manual trigger)
   */
  async forceSyncNow(): Promise<{ success: number; failed: number }> {
    // Debug logging removed for production
    return this.syncPendingTransactions();
  }

  /**
   * Clear failed transactions
   */
  async clearFailedTransactions(): Promise<void> {
    try {
      const pendingTransactions = await offlineStorage.getPendingTransactions();
      const failedTransactions = pendingTransactions.filter(
        (t) => t.status === "failed"
      );

      for (const transaction of failedTransactions) {
        await offlineStorage.updateTransactionStatus(transaction.id, "synced");
      }

      // Debug logging removed for production
    } catch (error) {
      logger.error("Failed to clear failed transactions", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Create singleton instance
export const offlineModeManager = new OfflineModeManager();

// Utility functions
export const isOnline = (): boolean =>
  typeof navigator !== "undefined" ? navigator.onLine : true;

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const handler = () => {
      window.removeEventListener("online", handler);
      resolve();
    };

    window.addEventListener("online", handler);
  });
};
