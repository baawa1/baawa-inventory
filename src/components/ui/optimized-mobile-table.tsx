import React, { memo, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useLazyLoading, 
  usePerformanceMonitor,
  useOptimizedFilter,
  useComputationCache
} from '@/lib/utils/performance';
import { SwipeableCard } from '@/components/ui/touch-enhanced';
import { cn } from '@/lib/utils';

interface OptimizedMobileTableProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  searchTerm?: string;
  filterFunction?: (item: T, term: string) => boolean;
  batchSize?: number;
  className?: string;
  emptyStateMessage?: string;
  loadingStateCount?: number;
  enableVirtualization?: boolean;
  swipeActions?: {
    left?: (item: T) => void;
    right?: (item: T) => void;
  };
}

// Memoized card component to prevent unnecessary re-renders
const MemoizedCard = memo(function MemoizedCard({
  item,
  index,
  renderCard,
  swipeActions,
  keyExtractor
}: {
  item: unknown;
  index: number;
  renderCard: (item: unknown, index: number) => React.ReactNode;
  swipeActions?: OptimizedMobileTableProps<unknown>['swipeActions'];
  keyExtractor: (item: unknown) => string | number;
}) {
  const cardContent = renderCard(item, index);
  
  if (swipeActions?.left || swipeActions?.right) {
    return (
      <SwipeableCard
        key={keyExtractor(item)}
        onSwipeLeft={() => swipeActions?.left?.(item)}
        onSwipeRight={() => swipeActions?.right?.(item)}
        leftAction={swipeActions?.left ? {
          label: 'Edit',
          color: 'bg-blue-500',
          icon: <span>✏️</span>
        } : undefined}
        rightAction={swipeActions?.right ? {
          label: 'Delete', 
          color: 'bg-red-500',
          icon: <span>🗑️</span>
        } : undefined}
        className="mb-3"
      >
        {cardContent}
      </SwipeableCard>
    );
  }

  return (
    <Card key={keyExtractor(item)} className="mb-3">
      <CardContent className="p-0">
        {cardContent}
      </CardContent>
    </Card>
  );
});

// Loading skeleton component
const LoadingSkeleton = memo(function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="mb-3">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
});

// Load more button component
const LoadMoreButton = memo(function LoadMoreButton({ 
  onLoadMore, 
  isLoading, 
  hasMore 
}: {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}) {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center py-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading}
        className="min-h-[44px] px-6"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
            Loading...
          </>
        ) : (
          'Load More'
        )}
      </Button>
    </div>
  );
});

// Main optimized table component
export function OptimizedMobileTable<T>({
  data,
  renderCard,
  keyExtractor,
  searchTerm = '',
  filterFunction,
  batchSize = 20,
  className,
  emptyStateMessage = 'No items found',
  loadingStateCount = 3,
  swipeActions,
}: OptimizedMobileTableProps<T>) {
  // Performance monitoring
  usePerformanceMonitor('OptimizedMobileTable');

  // Optimized filtering with debouncing
  const { filteredItems, isSearching } = useOptimizedFilter(
    data,
    searchTerm,
    filterFunction || (() => true),
    300
  );

  // Cache expensive computations
  const processedData = useComputationCache(
    filteredItems,
    (items) => items.map((item, index) => ({ item, originalIndex: index })),
    [filteredItems.length]
  );

  // Lazy loading for large datasets
  const {
    loadedItems,
    loadMore,
    isLoading,
    hasMore,
    intersectionRef,
  } = useLazyLoading(processedData, batchSize);

  // Memoized render functions
  const renderMemoizedCard = useCallback(
    (itemData: { item: T; originalIndex: number }, index: number) => (
      <MemoizedCard
        key={keyExtractor(itemData.item)}
        item={itemData.item}
        index={itemData.originalIndex}
        renderCard={renderCard as (item: unknown, index: number) => React.ReactNode}
        swipeActions={swipeActions as OptimizedMobileTableProps<unknown>['swipeActions']}
        keyExtractor={keyExtractor as (item: unknown) => string | number}
      />
    ),
    [renderCard, keyExtractor, swipeActions]
  );

  // Empty state
  if (!isSearching && processedData.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          {emptyStateMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {/* Show search loading state */}
      {isSearching && (
        <div className="mb-4 flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
          <span className="text-sm text-muted-foreground">Searching...</span>
        </div>
      )}

      {/* Render loaded items */}
      <div className="space-y-0">
        {loadedItems.map((itemData, index) => 
          renderMemoizedCard(itemData, index)
        )}
      </div>

      {/* Loading skeleton for initial load */}
      {isLoading && loadedItems.length === 0 && (
        <LoadingSkeleton count={loadingStateCount} />
      )}

      {/* Load more button */}
      {hasMore && (
        <LoadMoreButton
          onLoadMore={loadMore}
          isLoading={isLoading}
          hasMore={hasMore}
        />
      )}

      {/* Intersection observer target for infinite scroll */}
      {hasMore && (
        <div
          ref={intersectionRef}
          className="h-4 w-full"
          aria-hidden="true"
        />
      )}

      {/* No results state for search */}
      {!isSearching && processedData.length > 0 && loadedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <h3 className="text-sm font-medium text-gray-900">No results found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}