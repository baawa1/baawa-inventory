import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// ===== TYPE DEFINITIONS =====

export interface CacheData {
  [key: string]: unknown;
}

export interface CachedResponse {
  body: CacheData;
  status: number;
}

export interface CacheParams {
  [key: string]: string | number | boolean | null | undefined;
}

export interface CacheKeyData {
  endpoint: string;
  params: string;
  userId: number | null;
}

export interface CacheOptions {
  ttlMs?: number;
  keyParams?: string[];
  invalidateOn?: string[];
}

export interface CacheStats {
  size: number;
  keys: string[];
}

// Simple in-memory cache for API responses
interface CacheEntry<T = unknown> {
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
    params?: CacheParams,
    userId?: number
  ): string {
    const keyData: CacheKeyData = {
      endpoint,
      params: params ? JSON.stringify(params) : '',
      userId: userId || null,
    };
    const keyJson = JSON.stringify(keyData);
    return Buffer.from(keyJson, 'utf8').toString('base64');
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
  get<T = unknown>(
    endpoint: string,
    params?: CacheParams,
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

    return entry.data as T;
  }

  /**
   * Store response in cache
   */
  set<T = unknown>(
    endpoint: string,
    data: T,
    params?: CacheParams,
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
        const decoded = JSON.parse(
          Buffer.from(key, 'base64').toString('utf8')
        );
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
  getStats(): CacheStats {
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

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

// Cleanup expired entries every 10 minutes
if (typeof window === 'undefined') {
  // Only run on server
  cleanupInterval = setInterval(
    () => {
      apiCache.cleanup();
    },
    10 * 60 * 1000
  );
}

export function stopApiCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Higher-order function to add caching to API route handlers
 */
export function withApiCache<
  T extends (..._args: unknown[]) => Promise<NextResponse>,
>(handler: T, options: CacheOptions = {}): T {
  return (async (..._args: Parameters<T>) => {
    const request = _args[0] as Request;
    const context = _args[1] as { params?: Record<string, string> }; // Route context (params, etc.)

    // Extract endpoint from URL
    const url = new URL(request.url);
    const endpoint = url.pathname;

    // Extract parameters for cache key
    const searchParams = Object.fromEntries(url.searchParams);
    const routeParams = context?.params || {};
    const cacheParams = { ...searchParams, ...routeParams };

    // Only cache GET requests
    if (request.method !== 'GET') {
      const response = await handler(..._args);

      // Invalidate cache for related endpoints on mutations
      if (options.invalidateOn) {
        options.invalidateOn.forEach(pattern => {
          apiCache.invalidate(pattern);
        });
      }

      return response;
    }

    // Try to get from cache
    const cachedData = apiCache.get<CachedResponse>(endpoint, cacheParams);
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
    const response = await handler(..._args);

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
