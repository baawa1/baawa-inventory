'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SwipeableCard, TouchButton } from '@/components/ui/touch-enhanced';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  const [expandedItems, setExpandedItems] = React.useState<Set<string | number>>(new Set());

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleDesktopColumns.map(column => (
                    <TableHead key={column.key} className={column.headerClassName}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableHead>
                  ))}
                  {renderActions && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {visibleDesktopColumns.map(column => (
                      <TableCell key={column.key} className={column.className}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell>
                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 space-y-2">
                <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-muted animate-pulse rounded w-full" />
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
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
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={() => onRowClick?.(item)}
              >
                {visibleDesktopColumns.map(column => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render ? column.render(item) : String((item as any)[column.key] || '-')}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
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
      <div className="md:hidden space-y-3">
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
              onLongPress={() => {
                // Optional: Add long press actions here
              }}
              leftAction={{
                label: 'Edit',
                color: 'bg-blue-500',
                icon: <span>✏️</span>,
              }}
              rightAction={{
                label: 'Delete', 
                color: 'bg-red-500',
                icon: <span>🗑️</span>,
              }}
              className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardContent className="px-4 py-3">
                {/* Card Header - Always Visible */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {mobileCardTitle && (
                      <div className="font-semibold text-base mb-1 truncate">
                        {mobileCardTitle(item)}
                      </div>
                    )}
                    {mobileCardSubtitle && (
                      <div className="text-sm text-muted-foreground truncate mb-2">
                        {mobileCardSubtitle(item)}
                      </div>
                    )}
                    {/* Enhanced tap indicator */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {isExpanded ? 'Tap to collapse' : 'Tap to expand details'}
                      </span>
                      <span className={cn(
                        'transition-all duration-300 text-blue-500',
                        isExpanded ? 'rotate-180 scale-110' : 'rotate-0'
                      )}>
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
                        .sort((a, b) => (a.mobileOrder || 999) - (b.mobileOrder || 999))
                        .map(column => {
                          const value = column.mobileRender 
                            ? column.mobileRender(item)
                            : column.render 
                            ? column.render(item) 
                            : String((item as any)[column.key] || '-');

                          return (
                            <div key={column.key} className="flex justify-between items-center">
                              <span className="text-sm font-medium text-muted-foreground">
                                {column.mobileLabel || column.label}:
                              </span>
                              <div className="text-sm font-medium text-right max-w-[60%] truncate">
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