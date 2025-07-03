import { QueryClient } from "@tanstack/react-query";

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
            errorMessage.includes("401") ||
            errorMessage.includes("unauthorized")
          ) {
            return false;
          }
          // Don't retry on client errors (4xx)
          if (
            errorMessage.includes("400") ||
            errorMessage.includes("403") ||
            errorMessage.includes("404")
          ) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error("Mutation error:", error);
        // TODO: Add global error handling/notifications here
      },
    },
  },
});

// Query key factory for consistent query keys
export const queryKeys = {
  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
  },

  // Suppliers
  suppliers: {
    all: ["suppliers"] as const,
    lists: () => [...queryKeys.suppliers.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.suppliers.lists(), filters] as const,
    details: () => [...queryKeys.suppliers.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.suppliers.details(), id] as const,
  },

  // Brands
  brands: {
    all: ["brands"] as const,
    lists: () => [...queryKeys.brands.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.brands.lists(), filters] as const,
    details: () => [...queryKeys.brands.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.brands.details(), id] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
  },

  // Inventory & Analytics
  inventory: {
    all: ["inventory"] as const,
    metrics: () => [...queryKeys.inventory.all, "metrics"] as const,
    charts: () => [...queryKeys.inventory.all, "charts"] as const,
    activity: () => [...queryKeys.inventory.all, "activity"] as const,
    stockAdjustments: {
      all: () => [...queryKeys.inventory.all, "stock-adjustments"] as const,
      list: (filters: Record<string, any>) =>
        [
          ...queryKeys.inventory.stockAdjustments.all(),
          "list",
          filters,
        ] as const,
    },
    stockReconciliation: {
      all: () => [...queryKeys.inventory.all, "stock-reconciliation"] as const,
      list: (filters: Record<string, any>) =>
        [
          ...queryKeys.inventory.stockReconciliation.all(),
          "list",
          filters,
        ] as const,
    },
  },

  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    pending: (status?: string) =>
      [...queryKeys.users.all, "pending", status || "all"] as const,
    deactivated: () => [...queryKeys.users.all, "deactivated"] as const,
  },

  // Session
  session: {
    all: ["session"] as const,
    current: () => [...queryKeys.session.all, "current"] as const,
    validity: () => [...queryKeys.session.all, "validity"] as const,
  },
} as const;
