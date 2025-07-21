import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

// Common table column configurations
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  fixed?: boolean;
}

// Pagination configuration
export interface PaginationConfig {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

// Sort configuration
export interface SortConfig<T = Record<string, unknown>> {
  field: keyof T | null;
  direction: "asc" | "desc";
}

// Filter configuration
export interface FilterConfig {
  [key: string]: string | number | boolean | null | undefined;
}

// Table utilities
export const tableUtils = {
  // Create standardized column configuration
  createColumn: <T>(
    key: keyof T,
    label: string,
    options?: {
      sortable?: boolean;
      render?: (value: unknown, row: T) => React.ReactNode;
      width?: string;
      align?: "left" | "center" | "right";
    }
  ): TableColumn<T> => ({
    key,
    label,
    sortable: options?.sortable ?? true,
    render: options?.render,
    width: options?.width,
    align: options?.align ?? "left",
  }),

  // Format common data types for display
  formatters: {
    currency: (value: number | string): string => {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
      }).format(numValue || 0);
    },

    date: (value: string | Date): string => {
      const date = typeof value === "string" ? new Date(value) : value;
      return new Intl.DateTimeFormat("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    },

    dateTime: (value: string | Date): string => {
      const date = typeof value === "string" ? new Date(value) : value;
      return new Intl.DateTimeFormat("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },

    percentage: (value: number): string => {
      return `${value.toFixed(1)}%`;
    },

    number: (value: number): string => {
      return new Intl.NumberFormat("en-NG").format(value);
    },

    truncate: (value: string, maxLength: number = 50): string => {
      if (value.length <= maxLength) return value;
      return `${value.substring(0, maxLength)}...`;
    },

    capitalize: (value: string): string => {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    },

    badge: (
      value: string,
      variant?: "default" | "success" | "warning" | "error"
    ) => {
      return {
        text: value,
        variant: variant || "default",
      };
    },
  },

  // Common status formatters
  statusFormatters: {
    userStatus: (status: string) => {
      const statusMap = {
        PENDING: { text: "Pending", variant: "warning" as const },
        VERIFIED: { text: "Verified", variant: "default" as const },
        APPROVED: { text: "Approved", variant: "success" as const },
        REJECTED: { text: "Rejected", variant: "error" as const },
        SUSPENDED: { text: "Suspended", variant: "error" as const },
      };
      return (
        statusMap[status as keyof typeof statusMap] || {
          text: status,
          variant: "default" as const,
        }
      );
    },

    productStatus: (status: string) => {
      const statusMap = {
        active: { text: "Active", variant: "success" as const },
        inactive: { text: "Inactive", variant: "warning" as const },
        discontinued: { text: "Discontinued", variant: "error" as const },
      };
      return (
        statusMap[status as keyof typeof statusMap] || {
          text: status,
          variant: "default" as const,
        }
      );
    },

    paymentStatus: (status: string) => {
      const statusMap = {
        PENDING: { text: "Pending", variant: "warning" as const },
        PAID: { text: "Paid", variant: "success" as const },
        REFUNDED: { text: "Refunded", variant: "default" as const },
        CANCELLED: { text: "Cancelled", variant: "error" as const },
      };
      return (
        statusMap[status as keyof typeof statusMap] || {
          text: status,
          variant: "default" as const,
        }
      );
    },

    stockLevel: (current: number, minimum: number) => {
      if (current <= 0) {
        return { text: "Out of Stock", variant: "error" as const };
      } else if (current <= minimum) {
        return { text: "Low Stock", variant: "warning" as const };
      } else {
        return { text: "In Stock", variant: "success" as const };
      }
    },
  },
};

// Hook for managing table state
export const useTableState = <T extends Record<string, unknown>>(
  initialConfig: {
    pagination?: Partial<PaginationConfig>;
    sorting?: Partial<SortConfig<T>>;
    filters?: FilterConfig;
  } = {}
) => {
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
    ...initialConfig.pagination,
  });

  const [sorting, setSorting] = useState<SortConfig<T>>({
    field: null,
    direction: "asc",
    ...initialConfig.sorting,
  });

  const [filters, setFilters] = useState<FilterConfig>(
    initialConfig.filters || {}
  );

  // Update pagination when data changes
  const updatePagination = (updates: Partial<PaginationConfig>) => {
    setPagination((prev) => ({ ...prev, ...updates }));
  };

  // Handle sorting
  const handleSort = (field: keyof T) => {
    setSorting((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle filter changes
  const updateFilter = (
    key: string,
    value: string | number | boolean | null
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Reset table state
  const resetTable = () => {
    setPagination({
      page: 1,
      limit: 20,
      totalPages: 1,
      totalItems: 0,
    });
    setSorting({ field: null, direction: "asc" });
    setFilters({});
  };

  return {
    pagination,
    sorting,
    filters,
    updatePagination,
    handleSort,
    updateFilter,
    clearFilters,
    resetTable,
  };
};

// Hook for managing column visibility
export const useColumnVisibility = (
  storageKey: string,
  defaultColumns: string[]
) => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === "undefined") return defaultColumns;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out any invalid columns
        return parsed.filter((col: string) => defaultColumns.includes(col));
      }
    } catch (error) {
      logger.warn("Failed to parse stored column visibility", {
        storageKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return defaultColumns;
    }

    return defaultColumns;
  });

  // Update column visibility
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => {
      const updated = prev.includes(columnKey)
        ? prev.filter((col) => col !== columnKey)
        : [...prev, columnKey];

      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        logger.warn("Failed to save column visibility to localStorage", {
          storageKey,
          columns: visibleColumns,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return updated;
    });
  };

  // Reset to default columns
  const resetColumns = () => {
    setVisibleColumns(defaultColumns);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultColumns));
    } catch (error) {
      logger.warn("Failed to save column visibility to sessionStorage", {
        storageKey,
        columns: visibleColumns,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Clean up localStorage on mount (remove invalid entries)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const cleaned = parsed.filter((col: string) =>
          defaultColumns.includes(col)
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(storageKey, JSON.stringify(cleaned));
          setVisibleColumns(cleaned);
        }
      }
    } catch (_error) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, defaultColumns]);

  return {
    visibleColumns,
    toggleColumn,
    resetColumns,
    isVisible: (columnKey: string) => visibleColumns.includes(columnKey),
  };
};

// Common table configurations
export const tableConfigs = {
  // Standard pagination options
  paginationOptions: [10, 20, 50, 100],

  // Common sort directions
  sortDirections: ["asc", "desc"] as const,

  // Default table classes for consistent styling
  tableClasses: {
    container: "border rounded-lg",
    table: "w-full",
    header: "border-b",
    headerCell: "px-4 py-3 text-left font-medium",
    row: "border-b hover:bg-muted/50",
    cell: "px-4 py-3",
    sortableHeader: "cursor-pointer hover:bg-muted/50",
    loading: "animate-pulse bg-muted/50",
  },

  // Loading skeleton configuration
  loadingSkeleton: {
    rows: 5,
    height: "h-4",
    className: "animate-pulse bg-muted rounded",
  },
};
