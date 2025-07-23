import React from "react";
import {
  DashboardCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/dashboard/DashboardCard";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DashboardColumnCustomizer,
  DashboardTableColumn,
} from "@/components/layouts/DashboardColumnCustomizer";
import { IconPackages } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";

interface DashboardTableProps<T = Record<string, unknown>> {
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
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  isRefetching?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;
}

export function DashboardTable<T = Record<string, unknown>>({
  tableTitle = "Table",
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
  emptyStateMessage = "No items found",
  emptyStateAction,
}: DashboardTableProps<T>) {
  return (
    <DashboardCard>
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
                className="flex items-center space-x-4 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} className="mt-4">
                Try Again
              </Button>
            )}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            {emptyStateIcon || (
              <IconPackages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            )}
            <p className="text-gray-500">{emptyStateMessage}</p>
            {emptyStateAction && <div className="mt-4">{emptyStateAction}</div>}
          </div>
        ) : (
          <>
            <div className="relative">
              {isRefetching && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
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
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalItems
                    )}{" "}
                    of {pagination.totalItems} items
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-auto">
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
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
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
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
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
    </DashboardCard>
  );
}
