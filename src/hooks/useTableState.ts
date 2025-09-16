import { useState, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { usePerformanceMonitor } from '@/lib/utils/performance';

export interface TableFilters {
  search: string;
  [key: string]: any;
}

export interface PaginationState {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TableState<T extends TableFilters = TableFilters> {
  filters: T;
  pagination: PaginationState;
  sorting: SortState;
  visibleColumns: string[];
}

export interface UseTableStateOptions<T extends TableFilters = TableFilters> {
  initialFilters: T;
  initialPagination?: Partial<PaginationState>;
  initialSorting?: Partial<SortState>;
  initialVisibleColumns?: string[];
  debounceMs?: number;
}

export const useTableState = <T extends TableFilters = TableFilters>({
  initialFilters,
  initialPagination = {},
  initialSorting = { sortBy: 'createdAt', sortOrder: 'desc' },
  initialVisibleColumns = [],
  debounceMs = 300,
}: UseTableStateOptions<T>) => {
  // Performance monitoring
  usePerformanceMonitor('useTableState');
  const [filters, setFilters] = useState<T>(initialFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    ...initialPagination,
  });
  const [sorting, setSorting] = useState<SortState>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialSorting,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(initialVisibleColumns);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, debounceMs);
  const isSearching = filters.search !== debouncedSearchTerm;

  // Memoized filter values for API calls
  const apiFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearchTerm,
  }), [filters, debouncedSearchTerm]);

  const handleFilterChange = useCallback((key: keyof T, value: any) => {
    setFilters(prev => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [initialFilters]);

  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setSorting({ 
      sortBy, 
      sortOrder: sortOrder as 'asc' | 'desc' 
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  }, []);

  const updatePaginationFromAPI = useCallback((apiPagination: any) => {
    setPagination(prev => ({
      ...prev,
      totalPages: apiPagination.totalPages || Math.ceil((apiPagination.total || apiPagination.totalItems || 0) / prev.limit),
      totalItems: apiPagination.total || apiPagination.totalItems || 0,
    }));
  }, []);

  // Memoized sort value for sort selectors
  const currentSort = useMemo(() => 
    `${sorting.sortBy}-${sorting.sortOrder}`, 
    [sorting.sortBy, sorting.sortOrder]
  );

  return {
    // State
    filters,
    apiFilters,
    pagination,
    sorting,
    visibleColumns,
    isSearching,
    currentSort,
    
    // Handlers
    handleFilterChange,
    handleResetFilters,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    updatePaginationFromAPI,
    setVisibleColumns,
    
    // Direct setters for advanced use cases
    setFilters,
    setPagination,
    setSorting,
  };
};

// Type helpers for common filter patterns
export interface ProductFilters extends TableFilters {
  search: string;
  categoryId: string;
  brandId: string;
  status: string;
  supplier: string;
  lowStock: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CategoryFilters extends TableFilters {
  search: string;
  isActive: string;
  parentId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface BrandFilters extends TableFilters {
  search: string;
  isActive: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface SupplierFilters extends TableFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CouponFilters extends TableFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}