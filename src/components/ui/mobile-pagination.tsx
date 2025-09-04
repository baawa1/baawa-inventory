'use client';

import * as React from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PaginationState {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface MobilePaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
}

export function MobilePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
  showPageSizeSelector = true,
  showItemCount = true,
}: MobilePaginationProps) {
  const { page, totalPages, totalItems, limit } = pagination;
  
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className={cn(className)}>
      {/* Desktop Layout - Compact horizontal layout */}
      <div className="hidden md:flex items-center justify-between">
        {/* Item Count - Left side */}
        {showItemCount && totalItems > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium">
              {startItem}-{endItem}
            </span>
            {' '}of{' '}
            <span className="font-medium">{totalItems}</span>
          </div>
        )}

        {/* Center - Pagination Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className="h-8 w-8 p-0"
            aria-label="Go to first page"
          >
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            className="h-8 w-8 p-0"
            aria-label="Go to previous page"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-2">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            className="h-8 w-8 p-0"
            aria-label="Go to next page"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className="h-8 w-8 p-0"
            aria-label="Go to last page"
          >
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side - Page Size Selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Show:
            </span>
            <Select
              value={String(limit)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Mobile Layout - Vertical stacked layout */}
      <div className="md:hidden space-y-4">
        {/* Item Count - Mobile */}
        {showItemCount && totalItems > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">
                {startItem}-{endItem}
              </span>
              {' '}of{' '}
              <span className="font-medium">{totalItems}</span>
              {' '}items
            </p>
          </div>
        )}

        {/* Main Pagination Controls - Mobile */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={!canGoPrevious}
              className="h-10 w-10 p-0"
              aria-label="Go to first page"
            >
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={!canGoPrevious}
              className="h-10 w-10 p-0"
              aria-label="Go to previous page"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="whitespace-nowrap">
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!canGoNext}
              className="h-10 w-10 p-0"
              aria-label="Go to next page"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={!canGoNext}
              className="h-10 w-10 p-0"
              aria-label="Go to last page"
            >
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Page Size Selector - Mobile */}
        {showPageSizeSelector && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Show:
            </span>
            <Select
              value={String(limit)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-10 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              per page
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobilePagination;