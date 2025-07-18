/**
 * Product search utility functions
 */

/**
 * Validate search term length
 */
export function validateSearchTerm(searchTerm: string): boolean {
  return searchTerm.length >= 1 && searchTerm.length <= 100;
}

/**
 * Format search parameters for API requests
 */
export function formatSearchParams(params: {
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  status?: string;
}): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.search && validateSearchTerm(params.search)) {
    searchParams.append("search", params.search);
  }

  if (params.page) {
    searchParams.append("page", params.page.toString());
  }

  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  if (params.category) {
    searchParams.append("category", params.category);
  }

  if (params.brand) {
    searchParams.append("brand", params.brand);
  }

  if (params.status) {
    searchParams.append("status", params.status);
  }

  return searchParams;
}

/**
 * Handle special characters in search terms
 */
export function sanitizeSearchTerm(searchTerm: string): string {
  // Remove special characters that could cause issues
  return searchTerm
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/[{}]/g, "") // Remove curly braces
    .replace(/[\[\]]/g, "") // Remove square brackets
    .trim();
}

/**
 * Validate search result structure
 */
export function isValidSearchResult(result: any): boolean {
  if (!result || typeof result !== "object") {
    return false;
  }

  // Check if it has the expected structure
  if (!result.data || !Array.isArray(result.data)) {
    return false;
  }

  if (!result.pagination || typeof result.pagination !== "object") {
    return false;
  }

  return true;
}

/**
 * Debounce function for search requests
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Cache search results
 */
export class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxAge = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }
}
