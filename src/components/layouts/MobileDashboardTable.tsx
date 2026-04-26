import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveTable, Column } from '@/components/ui/responsive-table';
import {
  MobilePagination,
  PaginationState,
} from '@/components/ui/mobile-pagination';
import {
  DashboardColumnCustomizer,
  DashboardTableColumn,
} from '@/components/layouts/DashboardColumnCustomizer';
import { IconPackages, IconRefresh } from '@tabler/icons-react';
import { TableSkeleton } from '@/components/ui/skeletons';
import { InlineLoading } from '@/components/ui/loading';

interface MobileDashboardTableProps<T = Record<string, unknown>> {
  tableTitle?: string;
  totalCount?: number;
  currentCount?: number;
  showingText?: string;
  columns: DashboardTableColumn[];
  visibleColumns: string[];
  onColumnsChange?: (columns: string[]) => void;
  columnCustomizerKey?: string;
  data: T[];
  renderCell: (item: T, columnKey: string) => React.ReactNode;
  renderActions?: (item: T) => React.ReactNode;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  isRefetching?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;
  mobileCardTitle?: (item: T) => React.ReactNode;
  mobileCardSubtitle?: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

export function MobileDashboardTable<T = Record<string, unknown>>({
  tableTitle = 'Table',
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
  mobileCardTitle,
  mobileCardSubtitle,
  keyExtractor,
}: MobileDashboardTableProps<T>) {
  const resolvedVisibleColumns = React.useMemo(() => {
    const fallbackColumns = columns
      .filter(col => col.defaultVisible || col.required)
      .map(col => col.key);
    const availableColumnKeys = new Set(columns.map(col => col.key));
    const filteredColumns = visibleColumns.filter(columnKey =>
      availableColumnKeys.has(columnKey)
    );

    return filteredColumns.length > 0 ? filteredColumns : fallbackColumns;
  }, [columns, visibleColumns]);

  // Convert DashboardTableColumn to ResponsiveTable Column format
  const responsiveColumns: Column<T>[] = React.useMemo(() => {
    return columns
      .filter(col => resolvedVisibleColumns.includes(col.key))
      .map(col => ({
        key: col.key,
        label: col.label,
        render: (item: T) => renderCell(item, col.key),
        className: col.className,
        headerClassName: col.headerClassName,
        mobileLabel: col.mobileLabel || col.label,
        mobileRender: col.mobileRender
          ? (item: T) => col.mobileRender!(item, col.key)
          : undefined,
        hideOnMobile: col.hideOnMobile,
        mobileOrder: col.mobileOrder,
      }));
  }, [columns, renderCell, resolvedVisibleColumns]);

  const displayText =
    showingText || `Showing ${currentCount} of ${totalCount} items`;

  if (error) {
    return (
      <Card className="dark:bg-card bg-white px-4 lg:px-6">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="space-y-4 text-center">
            <div className="text-sm font-medium text-red-500">
              Error loading data
            </div>
            <p className="text-muted-foreground text-sm">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <IconRefresh className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-card bg-white">
      <CardHeader className="px-2 md:px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-lg font-semibold">
              {tableTitle} ({totalCount})
            </CardTitle>
            {isRefetching && (
              <div className="mt-2 flex items-center gap-2">
                <InlineLoading label="Updating..." />
              </div>
            )}
          </div>
          <div className="ml-4 flex items-center gap-2">
            {/* Column Customizer - Hidden on mobile */}
            {onColumnsChange && columnCustomizerKey && (
              <div className="hidden md:block">
                <DashboardColumnCustomizer
                  columns={columns}
                  onColumnsChange={onColumnsChange}
                  localStorageKey={columnCustomizerKey}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile showing text */}
        <div className="text-muted-foreground mt-2 text-sm">{displayText}</div>
      </CardHeader>

      <CardContent className="px-2 pb-3 md:px-4 md:pb-6 lg:px-6">
        <div className="space-y-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {/* Desktop skeleton */}
              <div className="hidden md:block">
                <TableSkeleton
                  columns={resolvedVisibleColumns.length}
                  rows={5}
                  withActions={!!renderActions}
                />
              </div>

              {/* Mobile card skeletons */}
              <div className="space-y-3 md:hidden">
                <TableSkeleton variant="cards" rows={3} />
              </div>
            </div>
          ) : (
            <>
              {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {emptyStateIcon || (
                    <IconPackages className="text-muted-foreground mb-4 h-12 w-12" />
                  )}
                  <p className="text-muted-foreground mb-4">
                    {emptyStateMessage}
                  </p>
                  {emptyStateAction}
                </div>
              ) : (
                <div className="relative">
                  {isRefetching && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80 backdrop-blur-sm">
                      <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-sm">
                        <InlineLoading label="Loading..." />
                      </div>
                    </div>
                  )}
                  <ResponsiveTable
                    data={data}
                    columns={responsiveColumns}
                    loading={false}
                    emptyMessage={emptyStateMessage}
                    renderActions={renderActions}
                    keyExtractor={keyExtractor}
                    mobileCardTitle={mobileCardTitle}
                    mobileCardSubtitle={mobileCardSubtitle}
                  />
                </div>
              )}
            </>
          )}

          {/* Mobile Pagination */}
          {!isLoading && data.length > 0 && (
            <MobilePagination
              pagination={pagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              className="border-t pt-4"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileDashboardTable;
