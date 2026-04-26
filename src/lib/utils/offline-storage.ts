/**
 * Offline Storage Utilities for POS System
 * Handles IndexedDB operations for offline transaction storage
 */

import { PRODUCT_STATUS } from '@/lib/constants';
import type {
  OfflineTransactionStatus,
  PosSalePayload,
} from '@/types/pos';

export interface OfflineTransaction {
  id: string;
  saleData: PosSalePayload;
  staffName: string;
  staffId: number;
  timestamp: Date;
  status: OfflineTransactionStatus;
  syncAttempts: number;
  lastSyncAttempt?: Date;
  errorMessage?: string;
  syncedSaleId?: string;
  syncedAt?: Date;
}

export interface OfflineProduct {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  lastUpdated: Date;
}

class OfflineStorageManager {
  private dbName = 'baawa_pos_offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', {
            keyPath: 'id',
          });
          transactionStore.createIndex('status', 'status', { unique: false });
          transactionStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          });
          transactionStore.createIndex('staffId', 'staffId', { unique: false });
        }

        // Create products cache store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', {
            keyPath: 'id',
          });
          productStore.createIndex('sku', 'sku', { unique: false });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('brand', 'brand', { unique: false });
          productStore.createIndex('status', 'status', { unique: false });
        }

        // Create sync status store
        if (!db.objectStoreNames.contains('syncStatus')) {
          db.createObjectStore('syncStatus', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store a transaction offline
   */
  async storeTransaction(transaction: OfflineTransaction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');

      const request = store.add(transaction);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store transaction'));
    });
  }

  /**
   * Get all pending transactions
   */
  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    return this.getTransactionsByStatuses(['pending']);
  }

  /**
   * Get queued transactions by status
   */
  async getTransactionsByStatuses(
    statuses: OfflineTransactionStatus[]
  ): Promise<OfflineTransaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');
      const request = store.getAll();

      request.onsuccess = () =>
        resolve(
          (request.result as OfflineTransaction[]).filter(transaction =>
            statuses.includes(transaction.status)
          )
        );
      request.onerror = () =>
        reject(new Error('Failed to get pending transactions'));
    });
  }

  /**
   * Delete queued transactions by status
   */
  async deleteTransactionsByStatuses(
    statuses: OfflineTransactionStatus[]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transactions = await this.getTransactionsByStatuses(statuses);
    if (transactions.length === 0) {
      return;
    }

    await Promise.all(
      transactions.map(
        transaction =>
          new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.delete(transaction.id);

            request.onsuccess = () => resolve();
            request.onerror = () =>
              reject(new Error('Failed to delete transaction'));
          })
      )
    );
  }

  /**
   * Get all transactions (including pending, synced, and failed)
   */
  async getAllTransactions(): Promise<OfflineTransaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error('Failed to get all transactions'));
    });
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    id: string,
    status: OfflineTransactionStatus,
    errorMessage?: string,
    updates?: Partial<Pick<OfflineTransaction, 'syncedSaleId' | 'syncedAt'>>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const transaction = getRequest.result;
        if (transaction) {
          transaction.status = status;
          transaction.syncAttempts = (transaction.syncAttempts || 0) + 1;
          transaction.lastSyncAttempt = new Date();
          if (errorMessage) {
            transaction.errorMessage = errorMessage;
          } else {
            delete transaction.errorMessage;
          }
          if (updates?.syncedSaleId) {
            transaction.syncedSaleId = updates.syncedSaleId;
          }
          if (updates?.syncedAt) {
            transaction.syncedAt = updates.syncedAt;
          }

          const updateRequest = store.put(transaction);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () =>
            reject(new Error('Failed to update transaction'));
        } else {
          reject(new Error('Transaction not found'));
        }
      };

      getRequest.onerror = () => reject(new Error('Failed to get transaction'));
    });
  }

  /**
   * Cache products for offline use
   */
  async cacheProducts(products: OfflineProduct[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['products'], 'readwrite');
      const store = tx.objectStore('products');

      // Clear existing products
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add new products
        let remaining = products.length;
        if (remaining === 0) {
          resolve();
          return;
        }

        products.forEach(product => {
          const addRequest = store.add(product);
          addRequest.onsuccess = () => {
            remaining--;
            if (remaining === 0) resolve();
          };
          addRequest.onerror = () =>
            reject(new Error('Failed to cache product'));
        });
      };

      clearRequest.onerror = () =>
        reject(new Error('Failed to clear products'));
    });
  }

  /**
   * Get cached products
   */
  async getCachedProducts(): Promise<OfflineProduct[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['products'], 'readonly');
      const store = tx.objectStore('products');

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error('Failed to get cached products'));
    });
  }

  /**
   * Search cached products
   */
  async searchCachedProducts(searchTerm: string): Promise<OfflineProduct[]> {
    const products = await this.getCachedProducts();

    if (!searchTerm)
      return products.filter(p => p.status === PRODUCT_STATUS.ACTIVE);

    const term = searchTerm.toLowerCase();
    return products.filter(
      product =>
        product.status === PRODUCT_STATUS.ACTIVE &&
        (product.name.toLowerCase().includes(term) ||
          product.sku.toLowerCase().includes(term) ||
          product.barcode?.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.brand.toLowerCase().includes(term))
    );
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<OfflineProduct | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['products'], 'readonly');
      const store = tx.objectStore('products');
      const index = store.index('barcode');

      const request = index.get(barcode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(new Error('Failed to get product by barcode'));
    });
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['syncStatus'], 'readwrite');
      const store = tx.objectStore('syncStatus');

      const request = store.put({ key, value, timestamp: new Date() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update sync status'));
    });
  }

  /**
   * Get sync status
   */
  async getSyncStatus(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['syncStatus'], 'readonly');
      const store = tx.objectStore('syncStatus');

      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(new Error('Failed to get sync status'));
    });
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = ['transactions', 'products', 'syncStatus'];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(stores, 'readwrite');
      let remaining = stores.length;

      stores.forEach(storeName => {
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          remaining--;
          if (remaining === 0) resolve();
        };

        request.onerror = () =>
          reject(new Error(`Failed to clear ${storeName}`));
      });
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    pendingTransactions: number;
    cachedProducts: number;
    totalTransactions: number;
    lastSync?: Date;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const pendingTransactions = await this.getPendingTransactions();
    const allProducts = await this.getCachedProducts();
    const lastSync = await this.getSyncStatus('lastProductSync');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');

      const request = store.count();

      request.onsuccess = () => {
        resolve({
          pendingTransactions: pendingTransactions.length,
          cachedProducts: allProducts.length,
          totalTransactions: request.result,
          lastSync: lastSync ? new Date(lastSync) : undefined,
        });
      };

      request.onerror = () => reject(new Error('Failed to get stats'));
    });
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageManager();

// Utility functions
export const generateTransactionId = (): string => {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isOfflineTransaction = (id: string): boolean => {
  return id.startsWith('offline_');
};
