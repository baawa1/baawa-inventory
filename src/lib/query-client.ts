import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (
            errorMessage.includes('401') ||
            errorMessage.includes('unauthorized')
          ) {
            return false;
          }
          // Don't retry on client errors (4xx)
          if (
            errorMessage.includes('400') ||
            errorMessage.includes('403') ||
            errorMessage.includes('404')
          ) {
            return false;
          }
          // Don't retry on rate limiting errors
          if (
            errorMessage.includes('429') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests')
          ) {
            return false;
          }
          // Don't retry on network errors after first attempt
          if (
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network error')
          ) {
            return failureCount < 1;
          }
        }
        return failureCount < 2; // Reduced from 3 to 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 0, // Disable retries for mutations by default
      onError: error => {
        logger.error('TanStack Query mutation failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        // TODO: Add global error handling/notifications here
      },
    },
  },
});

// Prefetch function for better performance
export const prefetchQuery = async ({
  queryKey,
  queryFn,
}: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
}) => {
  try {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  } catch (error) {
    // Silently fail prefetch to avoid blocking the UI
    console.warn('Prefetch failed:', error);
  }
};

// Query key factory for consistent query keys
export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
    archived: (filters?: Record<string, any>) =>
      [...queryKeys.products.all, 'archived', filters || {}] as const,
  },

  // Suppliers
  suppliers: {
    all: ['suppliers'] as const,
    lists: () => [...queryKeys.suppliers.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.suppliers.lists(), filters] as const,
    details: () => [...queryKeys.suppliers.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.suppliers.details(), id] as const,
  },

  // Brands
  brands: {
    all: ['brands'] as const,
    lists: () => [...queryKeys.brands.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.brands.lists(), filters] as const,
    details: () => [...queryKeys.brands.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.brands.details(), id] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: (dateRange?: string) =>
      [...queryKeys.analytics.all, 'dashboard', dateRange || 'month'] as const,
  },

  // Inventory & Analytics
  inventory: {
    all: ['inventory'] as const,
    metrics: () => [...queryKeys.inventory.all, 'metrics'] as const,
    charts: () => [...queryKeys.inventory.all, 'charts'] as const,
    activity: () => [...queryKeys.inventory.all, 'activity'] as const,
    stockReconciliations: {
      all: () => [...queryKeys.inventory.all, 'stock-reconciliations'] as const,
      list: (filters: Record<string, any>) =>
        [
          ...queryKeys.inventory.stockReconciliations.all(),
          'list',
          filters,
        ] as const,
      detail: (id: string) =>
        [
          ...queryKeys.inventory.stockReconciliations.all(),
          'detail',
          id,
        ] as const,
    },
    stockSnapshot: (filters: Record<string, any>) =>
      [...queryKeys.inventory.all, 'snapshot', filters] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    pending: (status?: string) =>
      [...queryKeys.users.all, 'pending', status || 'all'] as const,
    deactivated: () => [...queryKeys.users.all, 'deactivated'] as const,
  },

  // Transactions
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.transactions.details(), id] as const,
    stats: (dateRange?: string) =>
      [...queryKeys.transactions.all, 'stats', dateRange || 'month'] as const,
  },

  // Finance
  finance: {
    all: ['finance'] as const,
    summary: () => [...queryKeys.finance.all, 'summary'] as const,
    transactions: {
      all: () => [...queryKeys.finance.all, 'transactions'] as const,
      list: (filters: Record<string, any>) =>
        [...queryKeys.finance.transactions.all(), 'list', filters] as const,
      detail: (id: number) =>
        [...queryKeys.finance.transactions.all(), 'detail', id] as const,
    },
    reports: {
      all: () => [...queryKeys.finance.all, 'reports'] as const,
      list: (filters: Record<string, any>) =>
        [...queryKeys.finance.reports.all(), 'list', filters] as const,
      detail: (id: number) =>
        [...queryKeys.finance.reports.all(), 'detail', id] as const,
    },
  },

  // Session
  session: {
    all: ['session'] as const,
    current: () => [...queryKeys.session.all, 'current'] as const,
    validity: () => [...queryKeys.session.all, 'validity'] as const,
  },
} as const;
