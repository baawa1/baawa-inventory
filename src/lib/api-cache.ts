import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Simple in-memory cache for API responses
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a cache key from request details
   */
  private generateKey(
    endpoint: string,
    params?: Record<string, any>,
    userId?: number
  ): string {
    const keyData = {
      endpoint,
      params: params ? JSON.stringify(params) : '',
      userId: userId || null,
    };
    return btoa(JSON.stringify(keyData));
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() < entry.expiry;
  }

  /**
   * Get cached response if valid
   */
  get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    userId?: number
  ): T | null {
    const key = this.generateKey(endpoint, params, userId);
    const entry = this.cache.get(key);

    if (!entry || !this.isValid(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    return entry.data;
  }

  /**
   * Store response in cache
   */
  set<T = any>(
    endpoint: string,
    data: T,
    params?: Record<string, any>,
    userId?: number,
    ttlMs?: number
  ): void {
    const key = this.generateKey(endpoint, params, userId);
    const ttl = ttlMs || this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of this.cache) {
      try {
        const decoded = JSON.parse(atob(key));
        if (decoded.endpoint.includes(pattern)) {
          keysToDelete.push(key);
        }
      } catch {
        // Invalid key format, skip
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now >= entry.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cleanup expired entries every 10 minutes
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(
    () => {
      apiCache.cleanup();
    },
    10 * 60 * 1000
  );
}

/**
 * Higher-order function to add caching to API route handlers
 */
export function withApiCache<
  T extends (...args: any[]) => Promise<NextResponse>,
>(
  handler: T,
  options: {
    ttlMs?: number;
    keyParams?: string[];
    invalidateOn?: string[];
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    const context = args[1] as any; // Route context (params, etc.)

    // Extract endpoint from URL
    const url = new URL(request.url);
    const endpoint = url.pathname;

    // Extract parameters for cache key
    const searchParams = Object.fromEntries(url.searchParams);
    const routeParams = context?.params || {};
    const cacheParams = { ...searchParams, ...routeParams };

    // Only cache GET requests
    if (request.method !== 'GET') {
      const response = await handler(...args);

      // Invalidate cache for related endpoints on mutations
      if (options.invalidateOn) {
        options.invalidateOn.forEach(pattern => {
          apiCache.invalidate(pattern);
        });
      }

      return response;
    }

    // Try to get from cache
    const cachedData = apiCache.get(endpoint, cacheParams);
    if (cachedData) {
      return NextResponse.json(cachedData.body, {
        status: cachedData.status,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Call original handler
    const response = await handler(...args);

    // Cache successful responses
    if (response.status >= 200 && response.status < 300) {
      try {
        const clonedResponse = response.clone();
        const body = await clonedResponse.json();

        apiCache.set(
          endpoint,
          { body, status: response.status },
          cacheParams,
          undefined, // userId - can be extracted from request if needed
          options.ttlMs
        );
      } catch (error) {
        logger.warn('Failed to cache API response', {
          url,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Add cache miss header
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'MISS');
    headers.set('Cache-Control', 'public, max-age=300');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }) as T;
}

/**
 * Cache configuration presets for different endpoint types
 */
export const cachePresets = {
  // Products - cache for 10 minutes, invalidate on product mutations
  products: {
    ttlMs: 10 * 60 * 1000,
    invalidateOn: ['/api/products'],
  },

  // Users - cache for 5 minutes, invalidate on user mutations
  users: {
    ttlMs: 5 * 60 * 1000,
    invalidateOn: ['/api/users'],
  },

  // Categories - cache for 30 minutes, rarely change
  categories: {
    ttlMs: 30 * 60 * 1000,
    invalidateOn: ['/api/categories'],
  },

  // Suppliers - cache for 15 minutes
  suppliers: {
    ttlMs: 15 * 60 * 1000,
    invalidateOn: ['/api/suppliers'],
  },

  // Sales - cache for 2 minutes, frequently updated
  sales: {
    ttlMs: 2 * 60 * 1000,
    invalidateOn: ['/api/sales', '/api/products'],
  },

  // Stock - cache for 1 minute, frequently updated
  stock: {
    ttlMs: 1 * 60 * 1000,
    invalidateOn: ['/api/stock-additions', '/api/products', '/api/sales'],
  },
};
