import React from 'react';
import { DashboardPageLayout } from './DashboardPageLayout';
import { DashboardFiltersBar, FilterConfig } from './DashboardFiltersBar';
import { DashboardTable } from './DashboardTable';
import { DashboardTableColumn } from './DashboardColumnCustomizer';

interface DashboardTableLayoutProps<T = Record<string, unknown>> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (_value: string) => void;
  isSearching?: boolean;
  filters?: FilterConfig[];
  filterValues?: Record<string, unknown>;
  onFilterChange?: (_key: string, _value: unknown) => void;
  onResetFilters?: () => void;
  quickFilters?: React.ReactNode;
  beforeFiltersContent?: React.ReactNode;
  sortOptions?: Array<{ label: string; value: string }>;
  currentSort?: string;
  onSortChange?: (_value: string) => void;
  tableTitle?: string;
  totalCount?: number;
  currentCount?: number;
  showingText?: string;
  columns: DashboardTableColumn[];
  visibleColumns: string[];
  onColumnsChange?: (_columns: string[]) => void;
  columnCustomizerKey?: string;
  data: T[];
  renderCell: (_item: T, _columnKey: string) => React.ReactNode;
  renderActions?: (_item: T) => React.ReactNode;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (_page: number) => void;
  onPageSizeChange: (_size: number) => void;
  isLoading?: boolean;
  isRefetching?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;
  additionalContent?: React.ReactNode;
}

export function DashboardTableLayout<T = Record<string, unknown>>({
  title,
  description,
  actions,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange = () => {},
  isSearching = false,
  filters = [],
  filterValues = {},
  onFilterChange = () => {},
  onResetFilters = () => {},
  quickFilters,
  beforeFiltersContent,
  sortOptions = [],
  currentSort = '',
  onSortChange = () => {},
  tableTitle = title,
  totalCount = 0,
  currentCount = 0,
  showingText,
  columns,
  visibleColumns,
  onColumnsChange,
  columnCustomizerKey,
  data = [],
  renderCell,
  renderActions,
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  isRefetching = false,
  error,
  onRetry,
  emptyStateIcon,
  emptyStateMessage = 'No items found',
  emptyStateAction,
  additionalContent,
}: DashboardTableLayoutProps<T>) {
  return (
    <DashboardPageLayout
      title={title}
      description={description}
      actions={actions}
    >
      {beforeFiltersContent && (
        <div className="mb-4">{beforeFiltersContent}</div>
      )}
      <DashboardFiltersBar
        title="Filters & Search"
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        isSearching={isSearching}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        quickFilters={quickFilters}
        sortOptions={sortOptions}
        currentSort={currentSort}
        onSortChange={onSortChange}
      />
      <DashboardTable<T>
        tableTitle={tableTitle}
        totalCount={totalCount}
        currentCount={currentCount}
        showingText={showingText}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={onColumnsChange}
        columnCustomizerKey={columnCustomizerKey}
        data={data}
        renderCell={renderCell}
        renderActions={renderActions}
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRetry={onRetry}
        emptyStateIcon={emptyStateIcon}
        emptyStateMessage={emptyStateMessage}
        emptyStateAction={emptyStateAction}
      />
      {additionalContent}
    </DashboardPageLayout>
  );
}
