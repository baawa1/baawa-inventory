import {
  Product,
  Supplier,
  Category,
  Brand,
  StockAdjustment,
  StockAddition,
} from '@prisma/client';

// Product with related entities
export type ProductWithRelations = Product & {
  supplier?: Supplier | null;
  category?: Category | null;
  brand?: Brand | null;
};

// Stock adjustment with related entities
export type StockAdjustmentWithRelations = StockAdjustment & {
  product?: Product | null;
};

// Stock addition with related entities
export type StockAdditionWithRelations = StockAddition & {
  product: Product;
  supplier?: Supplier | null;
};

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'boolean' | 'text' | 'date';
  options?: FilterOption[];
  placeholder?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface InventoryPageLayoutProps {
  // Header
  title: string;
  description: string;
  actions?: React.ReactNode;

  // Filters
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (_value: string) => void;
  isSearching?: boolean;
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  onFilterChange: (_key: string, _value: any) => void;
  onResetFilters: () => void;
  quickFilters?: React.ReactNode;
  beforeFiltersContent?: React.ReactNode;

  // Sort
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: (_value: string) => void;

  // Table
  tableTitle: string;
  totalCount: number;
  currentCount: number;
  showingText?: string;
  columns: ColumnConfig[];
  visibleColumns: string[];
  onColumnsChange?: (_columns: string[]) => void;
  columnCustomizerKey?: string;
  columnCustomizerColumns?: import('@/components/inventory/ColumnCustomizer').TableColumn[];
  data: any[];
  renderCell: (_item: any, _columnKey: string) => React.ReactNode;
  renderActions?: (_item: any) => React.ReactNode;

  // Pagination
  pagination: PaginationState;
  onPageChange: (_page: number) => void;
  onPageSizeChange: (_size: number) => void;

  // Loading states
  isLoading?: boolean;
  isRefetching?: boolean;
  error?: string;
  onRetry?: () => void;

  // Empty state
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;

  // Additional content
  additionalContent?: React.ReactNode;
}
