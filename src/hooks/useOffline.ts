/**
 * React Hook for Offline Mode Management
 * Provides offline state and functionality to React components
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  offlineModeManager,
  NetworkStatus,
  OfflineQueueStats,
} from "@/lib/utils/offline-mode";
import { offlineStorage } from "@/lib/utils/offline-storage";
import { INTERVALS } from "@/lib/constants";

export interface UseOfflineReturn {
  // Network status
  isOnline: boolean;
  isSlowConnection: boolean;
  networkStatus: NetworkStatus;

  // Queue management
  queueStats: OfflineQueueStats;

  // Actions
  queueTransaction: (transactionData: any) => Promise<string>;
  syncNow: () => Promise<{ success: number; failed: number }>;
  cacheProducts: () => Promise<void>;
  clearFailedTransactions: () => Promise<void>;

  // Loading states
  isSyncing: boolean;
  isCaching: boolean;

  // Error state
  error: string | null;
}

export function useOffline(): UseOfflineReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
  });

  const [queueStats, setQueueStats] = useState<OfflineQueueStats>({
    pendingTransactions: 0,
    failedTransactions: 0,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update queue stats
  const updateQueueStats = useCallback(async () => {
    try {
      const stats = await offlineModeManager.getQueueStats();
      setQueueStats(stats);
    } catch (err) {
      console.error("Error updating queue stats:", err);
    }
  }, []);

  // Initialize offline storage and listeners
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await offlineStorage.init();
        if (mounted) {
          await updateQueueStats();
        }
      } catch (err) {
        console.error("Error initializing offline storage:", err);
        if (mounted) {
          setError("Failed to initialize offline storage");
        }
      }
    };

    // Listen for network status changes
    const unsubscribe = offlineModeManager.addStatusListener((status) => {
      if (mounted) {
        setNetworkStatus(status);
        // Update queue stats when network status changes
        updateQueueStats();
      }
    });

    init();

    // Update stats periodically
    const statsInterval = setInterval(() => {
      if (mounted) {
        updateQueueStats();
      }
    }, INTERVALS.STATS_UPDATE); // Every 30 seconds

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, [updateQueueStats]);

  // Queue a transaction
  const queueTransaction = useCallback(
    async (transactionData: any): Promise<string> => {
      try {
        setError(null);
        const transactionId =
          await offlineModeManager.queueTransaction(transactionData);
        await updateQueueStats();
        return transactionId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to queue transaction";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [updateQueueStats]
  );

  // Sync now
  const syncNow = useCallback(async (): Promise<{
    success: number;
    failed: number;
  }> => {
    try {
      setIsSyncing(true);
      setError(null);

      const result = await offlineModeManager.forceSyncNow();
      await updateQueueStats();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sync failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  }, [updateQueueStats]);

  // Cache products
  const cacheProducts = useCallback(async (): Promise<void> => {
    try {
      setIsCaching(true);
      setError(null);

      await offlineModeManager.cacheProductsForOffline();
      await updateQueueStats();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to cache products";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCaching(false);
    }
  }, [updateQueueStats]);

  // Clear failed transactions
  const clearFailedTransactions = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await offlineModeManager.clearFailedTransactions();
      await updateQueueStats();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to clear failed transactions";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [updateQueueStats]);

  return {
    // Network status
    isOnline: networkStatus.isOnline,
    isSlowConnection: networkStatus.isSlowConnection,
    networkStatus,

    // Queue management
    queueStats,

    // Actions
    queueTransaction,
    syncNow,
    cacheProducts,
    clearFailedTransactions,

    // Loading states
    isSyncing,
    isCaching,

    // Error state
    error,
  };
}

// Hook for offline product search
export function useOfflineProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = useCallback(async (searchTerm: string = "") => {
    try {
      setIsLoading(true);
      setError(null);

      await offlineStorage.init();
      const results = await offlineStorage.searchCachedProducts(searchTerm);
      setProducts(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setError(errorMessage);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProductByBarcode = useCallback(async (barcode: string) => {
    try {
      setError(null);
      await offlineStorage.init();
      return await offlineStorage.getProductByBarcode(barcode);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Barcode lookup failed";
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    products,
    isLoading,
    error,
    searchProducts,
    getProductByBarcode,
  };
}

// Hook for offline storage stats
export function useOfflineStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      await offlineStorage.init();
      const dbStats = await offlineStorage.getStats();
      setStats(dbStats);
    } catch (err) {
      console.error("Error getting offline stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();

    // Refresh stats every minute
    const interval = setInterval(refreshStats, INTERVALS.STATS_REFRESH);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    refreshStats,
  };
}
