import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DashboardColumnCustomizer,
  DashboardTableColumn,
} from '@/components/layouts/DashboardColumnCustomizer';
import { IconPackages } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';

interface DashboardTableProps<T = Record<string, unknown>> {
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
}

export function DashboardTable<T = Record<string, unknown>>({
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
}: DashboardTableProps<T>) {
  return (
    <Card className="dark:bg-card bg-white px-4 lg:px-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {tableTitle} ({totalCount})
            </CardTitle>
            <CardDescription>
              {showingText || `Showing ${currentCount} of ${totalCount} items`}
            </CardDescription>
          </div>
          {onColumnsChange && columnCustomizerKey && (
            <DashboardColumnCustomizer
              columns={columns}
              onColumnsChange={onColumnsChange}
              localStorageKey={columnCustomizerKey}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center space-x-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-500">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} className="mt-4">
                Try Again
              </Button>
            )}
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center">
            {emptyStateIcon || (
              <IconPackages className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            )}
            <p className="text-gray-500">{emptyStateMessage}</p>
            {emptyStateAction && <div className="mt-4">{emptyStateAction}</div>}
          </div>
        ) : (
          <>
            <div className="relative">
              {isRefetching && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Loading...</span>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map((columnKey: string) => {
                      const column = columns.find(
                        (col: DashboardTableColumn) => col.key === columnKey
                      );
                      return (
                        <TableHead key={columnKey}>
                          {column?.label || columnKey}
                        </TableHead>
                      );
                    })}
                    {renderActions && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item: T, index: number) => (
                    <TableRow key={(item as any).id || index}>
                      {visibleColumns.map((columnKey: string) => (
                        <TableCell key={columnKey}>
                          {renderCell(item, columnKey)}
                        </TableCell>
                      ))}
                      {renderActions && (
                        <TableCell className="text-right">
                          {renderActions(item)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalItems
                    )}{' '}
                    of {pagination.totalItems} items
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show:</span>
                    <Select
                      value={pagination.limit.toString()}
                      onValueChange={(value: string) =>
                        onPageSizeChange(parseInt(value))
                      }
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            onPageChange(Math.max(1, pagination.page - 1))
                          }
                          className={
                            pagination.page === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      {pagination.page > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => onPageChange(1)}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {pagination.page > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      {pagination.page > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => onPageChange(pagination.page - 1)}
                            className="cursor-pointer"
                          >
                            {pagination.page - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink isActive className="cursor-pointer">
                          {pagination.page}
                        </PaginationLink>
                      </PaginationItem>
                      {pagination.page < pagination.totalPages && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => onPageChange(pagination.page + 1)}
                            className="cursor-pointer"
                          >
                            {pagination.page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      {pagination.page < pagination.totalPages - 1 && (
                        <>
                          {pagination.page < pagination.totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() =>
                                onPageChange(pagination.totalPages)
                              }
                              className="cursor-pointer"
                            >
                              {pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            onPageChange(
                              Math.min(
                                pagination.totalPages,
                                pagination.page + 1
                              )
                            )
                          }
                          className={
                            pagination.page === pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
