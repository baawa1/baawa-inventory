"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ColumnCustomizer } from "@/components/inventory/ColumnCustomizer";
import { IconSearch, IconFilter, IconPackages } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import {
  FilterConfig,
  FilterOption,
  InventoryPageLayoutProps,
} from "@/types/inventory";

export function InventoryPageLayout({
  // Header
  title,
  description,
  actions,

  // Filters
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  isSearching = false,
  filters = [],
  filterValues = {},
  onFilterChange,
  onResetFilters,
  quickFilters,
  beforeFiltersContent,

  // Sort
  sortOptions = [],
  currentSort,
  onSortChange,

  // Table
  tableTitle,
  totalCount,
  currentCount,
  showingText,
  columns,
  visibleColumns,
  onColumnsChange,
  columnCustomizerKey,
  columnCustomizerColumns,
  data,
  renderCell,
  renderActions,

  // Pagination
  pagination,
  onPageChange,
  onPageSizeChange,

  // Loading states
  isLoading = false,
  isRefetching = false,
  error,
  onRetry,

  // Empty state
  emptyStateIcon,
  emptyStateMessage = "No items found",
  emptyStateAction,

  // Additional content
  additionalContent,
}: InventoryPageLayoutProps) {
  const renderFilterControl = (filter: FilterConfig) => {
    const value = filterValues[filter.key] || "";

    switch (filter.type) {
      case "select":
        return (
          <Select
            key={filter.key}
            value={value || "all"}
            onValueChange={(val) =>
              onFilterChange(filter.key, val === "all" ? "" : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options?.map((option: FilterOption) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "boolean":
        return (
          <Button
            key={filter.key}
            variant={value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.key, !value)}
          >
            {filter.label}
          </Button>
        );
      case "text":
        return (
          <Input
            key={filter.key}
            placeholder={filter.placeholder || filter.label}
            value={value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header Section */}
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              </div>
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}
            </div>
          </div>

          {/* Before Filters Content */}
          {beforeFiltersContent && (
            <div className="px-4 lg:px-6">{beforeFiltersContent}</div>
          )}

          {/* Filters Section */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
                <CardDescription>
                  Filter and search through your {title.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-start gap-4">
                  {/* Search */}
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-9 pr-8"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Dynamic Filters */}
                  {filters.map(renderFilterControl)}

                  {/* Reset Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetFilters}
                    className="whitespace-nowrap"
                  >
                    Reset Filters
                  </Button>

                  {/* Sort Options */}
                  {sortOptions.length > 0 && onSortChange && (
                    <div className="flex items-center justify-center ml-auto">
                      <Select
                        value={currentSort || ""}
                        onValueChange={onSortChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Quick Filters */}
                {quickFilters && (
                  <div className="flex gap-2 mt-4">{quickFilters}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table Section */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {tableTitle} ({totalCount})
                    </CardTitle>
                    <CardDescription>
                      {showingText ||
                        `Showing ${currentCount} of ${totalCount} items`}
                    </CardDescription>
                  </div>
                  {onColumnsChange && columnCustomizerKey && (
                    <ColumnCustomizer
                      columns={columnCustomizerColumns}
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
                    {emptyStateAction && (
                      <div className="mt-4">{emptyStateAction}</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      {/* Loading overlay for refetching data */}
                      {isRefetching && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-600">
                              {isSearching ? "Searching..." : "Loading..."}
                            </span>
                          </div>
                        </div>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {visibleColumns.map((columnKey: string) => {
                              const column = columns.find(
                                (col: any) => col.key === columnKey
                              );
                              return (
                                <TableHead key={columnKey}>
                                  {column?.label || columnKey}
                                </TableHead>
                              );
                            })}
                            {renderActions && (
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.map((item: any, index: number) => (
                            <TableRow key={item.id || index}>
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

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500">
                            Showing{" "}
                            {(pagination.page - 1) * pagination.limit + 1} to{" "}
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
                              onValueChange={(value) =>
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
                                    !isRefetching &&
                                    onPageChange(
                                      Math.max(1, pagination.page - 1)
                                    )
                                  }
                                  className={
                                    pagination.page === 1 || isRefetching
                                      ? "pointer-events-none opacity-50"
                                      : "cursor-pointer"
                                  }
                                />
                              </PaginationItem>

                              {/* Show first page if current page is more than 2 */}
                              {pagination.page > 2 && (
                                <>
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        !isRefetching && onPageChange(1)
                                      }
                                      className={
                                        isRefetching
                                          ? "cursor-not-allowed opacity-50"
                                          : "cursor-pointer"
                                      }
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

                              {/* Show previous page if exists */}
                              {pagination.page > 1 && (
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() =>
                                      !isRefetching &&
                                      onPageChange(pagination.page - 1)
                                    }
                                    className={
                                      isRefetching
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer"
                                    }
                                  >
                                    {pagination.page - 1}
                                  </PaginationLink>
                                </PaginationItem>
                              )}

                              {/* Current page */}
                              <PaginationItem>
                                <PaginationLink
                                  isActive
                                  className="cursor-pointer"
                                >
                                  {pagination.page}
                                </PaginationLink>
                              </PaginationItem>

                              {/* Show next page if exists */}
                              {pagination.page < pagination.totalPages && (
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() =>
                                      !isRefetching &&
                                      onPageChange(pagination.page + 1)
                                    }
                                    className={
                                      isRefetching
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer"
                                    }
                                  >
                                    {pagination.page + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              )}

                              {/* Show last page if current page is less than totalPages - 1 */}
                              {pagination.page < pagination.totalPages - 1 && (
                                <>
                                  {pagination.page <
                                    pagination.totalPages - 2 && (
                                    <PaginationItem>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  )}
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        !isRefetching &&
                                        onPageChange(pagination.totalPages)
                                      }
                                      className={
                                        isRefetching
                                          ? "cursor-not-allowed opacity-50"
                                          : "cursor-pointer"
                                      }
                                    >
                                      {pagination.totalPages}
                                    </PaginationLink>
                                  </PaginationItem>
                                </>
                              )}

                              <PaginationItem>
                                <PaginationNext
                                  onClick={() =>
                                    !isRefetching &&
                                    onPageChange(
                                      Math.min(
                                        pagination.totalPages,
                                        pagination.page + 1
                                      )
                                    )
                                  }
                                  className={
                                    pagination.page === pagination.totalPages ||
                                    isRefetching
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
            </Card>
          </div>
        </div>
      </div>

      {/* Additional content like dialogs, modals, etc. */}
      {additionalContent}
    </div>
  );
}
