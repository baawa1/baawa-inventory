'use client';

import * as React from 'react';
import { CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SwipeableCard } from '@/components/ui/touch-enhanced';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/skeletons';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  mobileLabel?: string; // Custom label for mobile cards
  mobileRender?: (item: T) => React.ReactNode; // Custom render for mobile cards
  hideOnMobile?: boolean;
  mobileOrder?: number; // Order in mobile card view
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  mobileCardTitle?: (item: T) => React.ReactNode;
  mobileCardSubtitle?: (item: T) => React.ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  renderActions,
  keyExtractor,
  mobileCardTitle,
  mobileCardSubtitle,
}: ResponsiveTableProps<T>) {
  // Filter columns for mobile view
  const mobileColumns = columns.filter(col => !col.hideOnMobile);
  const visibleDesktopColumns = columns;

  // Track expanded state for mobile cards
  const [expandedItems, setExpandedItems] = React.useState<
    Set<string | number>
  >(new Set());

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <TableSkeleton
            columns={visibleDesktopColumns.length}
            rows={5}
            withActions={!!renderActions}
          />
        </div>

        {/* Mobile skeleton */}
        <div className="space-y-3 md:hidden">
          <TableSkeleton variant="cards" rows={3} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleDesktopColumns.map(column => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.label}
                </TableHead>
              ))}
              {renderActions && <TableHead className="w-10">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(item => (
              <TableRow
                key={keyExtractor(item)}
                className={onRowClick ? 'hover:bg-muted/50 cursor-pointer' : ''}
                onClick={() => onRowClick?.(item)}
              >
                {visibleDesktopColumns.map(column => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] || '-')}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell>
                    <div onClick={e => e.stopPropagation()}>
                      {renderActions(item)}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {data.map(item => {
          const itemKey = keyExtractor(item);
          const isExpanded = expandedItems.has(itemKey);

          const toggleExpanded = () => {
            setExpandedItems(prev => {
              const newSet = new Set(prev);
              if (newSet.has(itemKey)) {
                newSet.delete(itemKey);
              } else {
                newSet.add(itemKey);
              }
              return newSet;
            });
          };

          return (
            <SwipeableCard
              key={itemKey}
              onTap={toggleExpanded}
              className="rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <CardContent className="px-4 py-3">
                {/* Card Header - Always Visible */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    {mobileCardTitle && (
                      <div className="mb-1 line-clamp-2 text-base break-words whitespace-normal">
                        {mobileCardTitle(item)}
                      </div>
                    )}
                    {mobileCardSubtitle && (
                      <div className="text-muted-foreground mb-2 line-clamp-2 text-sm break-words whitespace-normal">
                        {mobileCardSubtitle(item)}
                      </div>
                    )}
                    {/* Enhanced tap indicator */}
                    <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                      <span className="font-medium">
                        {isExpanded
                          ? 'Tap to collapse'
                          : 'Tap to expand details'}
                      </span>
                      <span
                        className={cn(
                          'text-blue-500 transition-all duration-300',
                          isExpanded ? 'scale-110 rotate-180' : 'rotate-0'
                        )}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                  {renderActions && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        {renderActions(item)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Card Content */}
                {isExpanded && (
                  <>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-1 gap-3">
                      {mobileColumns
                        .sort(
                          (a, b) =>
                            (a.mobileOrder || 999) - (b.mobileOrder || 999)
                        )
                        .map(column => {
                          const value = column.mobileRender
                            ? column.mobileRender(item)
                            : column.render
                              ? column.render(item)
                              : String((item as any)[column.key] || '-');

                          return (
                            <div
                              key={column.key}
                              className="flex items-center justify-between"
                            >
                              <span className="text-muted-foreground text-sm font-medium">
                                {column.mobileLabel || column.label}:
                              </span>
                              <div className="max-w-[60%] truncate text-right text-sm font-medium">
                                {value}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </CardContent>
            </SwipeableCard>
          );
        })}
      </div>
    </div>
  );
}

export default ResponsiveTable;
