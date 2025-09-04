import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveTable, Column } from '@/components/ui/responsive-table';
import { MobilePagination, PaginationState } from '@/components/ui/mobile-pagination';
import {
  DashboardColumnCustomizer,
  DashboardTableColumn,
} from '@/components/layouts/DashboardColumnCustomizer';
import { IconPackages, IconRefresh } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';

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
  // Convert DashboardTableColumn to ResponsiveTable Column format
  const responsiveColumns: Column<T>[] = React.useMemo(() => {
    return columns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => ({
        key: col.key,
        label: col.label,
        render: (item: T) => renderCell(item, col.key),
        className: col.className,
        headerClassName: col.headerClassName,
        mobileLabel: col.mobileLabel || col.label,
        mobileRender: col.mobileRender ? (item: T) => col.mobileRender!(item, col.key) : undefined,
        hideOnMobile: col.hideOnMobile,
        mobileOrder: col.mobileOrder,
      }));
  }, [columns, visibleColumns, renderCell]);

  const displayText = showingText || `Showing ${currentCount} of ${totalCount} items`;

  if (error) {
    return (
      <Card className="dark:bg-card bg-white px-4 lg:px-6">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-sm font-medium">Error loading data</div>
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
      <CardHeader className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold truncate">
              {tableTitle} ({totalCount})
            </CardTitle>
            {isRefetching && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Updating...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
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
        <div className="text-sm text-muted-foreground mt-2">
          {displayText}
        </div>
      </CardHeader>

      <CardContent className="px-4 lg:px-6 pb-6">
        <div className="space-y-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {/* Desktop skeleton */}
              <div className="hidden md:block">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                      <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mobile card skeletons */}
              <div className="md:hidden space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        {/* Card header with image placeholder */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-md flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        
                        {/* Card content lines */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Responsive Table with Refetch Overlay */}
              <div className="relative">
                {isRefetching && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">Loading...</span>
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
            </>
          )}

          {/* Empty State */}
          {!isLoading && data.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {emptyStateIcon || (
                <IconPackages className="h-12 w-12 text-muted-foreground mb-4" />
              )}
              <p className="text-muted-foreground mb-4">{emptyStateMessage}</p>
              {emptyStateAction}
            </div>
          )}

          {/* Mobile Pagination */}
          {!isLoading && data.length > 0 && (
            <MobilePagination
              pagination={pagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              className="pt-4 border-t"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileDashboardTable;