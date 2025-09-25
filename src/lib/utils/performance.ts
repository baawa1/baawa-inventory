// Performance optimization utilities for mobile tables

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Scroll helper that only runs on mobile-sized viewports
export function useMobileScrollAnchor(breakpoint: number = 1024) {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const scrollToAnchor = useCallback(() => {
    if (typeof window === 'undefined') return;

    const isSmallScreen = typeof window.matchMedia === 'function'
      ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
      : window.innerWidth < breakpoint;

    if (!isSmallScreen || !anchorRef.current) return;

    const scroll = () => {
      anchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(scroll);
    } else {
      scroll();
    }
  }, [breakpoint]);

  return {
    anchorRef,
    scrollToAnchor,
  };
}

// Throttle hook for scroll and resize events
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Memoized table row component to prevent unnecessary re-renders
export function useMemoizedTableRow<T extends Record<string, unknown>>(
  renderRow: (_item: T, _index: number) => React.ReactNode
) {
  return useMemo(() => {
    const MemoizedRow = React.memo<{ item: T; index: number }>(({ item, index }) =>
      renderRow(item, index) as React.ReactElement
    );
    MemoizedRow.displayName = 'MemoizedTableRow';

    return MemoizedRow;
  }, [renderRow]);
}

export const createMemoizedTableRow = useMemoizedTableRow;

// Virtual scrolling hook for large datasets
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const { itemHeight, containerHeight, overscan = 5 } = options;

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleItemCount + overscan * 2
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useThrottle(
    useCallback((event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    }, []),
    16 // ~60fps
  );

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  callback: (_entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const observer = useRef<IntersectionObserver | null>(null);
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    if (element && 'IntersectionObserver' in window) {
      observer.current = new IntersectionObserver(callback, {
        threshold: 0.1,
        ...options,
      });
      observer.current.observe(element);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [element, callback, options]);

  return setElement;
}

// Lazy loading component for mobile cards
export function useLazyLoading<T>(
  items: T[],
  batchSize: number = 20
) {
  const [loadedCount, setLoadedCount] = useState(batchSize);
  const [isLoading, setIsLoading] = useState(false);

  const loadedItems = items.slice(0, loadedCount);
  const hasMore = loadedCount < items.length;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate network delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setLoadedCount(prev => Math.min(prev + batchSize, items.length));
    setIsLoading(false);
  }, [isLoading, hasMore, batchSize, items.length]);

  const intersectionRef = useIntersectionObserver(
    useCallback((_entries) => {
      if (_entries[0]?.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    }, [loadMore, hasMore, isLoading])
  );

  return {
    loadedItems,
    loadMore,
    isLoading,
    hasMore,
    intersectionRef,
  };
}

// Memory-efficient image loading hook
export function useImagePreload(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    const image = new Image();
    
    image.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setError(null);
    };

    image.onerror = () => {
      setError('Failed to load image');
      setIsLoaded(false);
    };

    image.src = src;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);

  return { imageSrc, isLoaded, error };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    
    if (renderTime > 16) { // Slower than 60fps
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
      );
    }
  });

  return {
    renderCount: renderCount.current,
    componentName,
  };
}

// Optimized search/filter hook
export function useOptimizedFilter<T>(
  items: T[],
  searchTerm: string,
  filterFn: (_item: T, _term: string) => boolean,
  debounceMs: number = 300
) {
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    return items.filter(item => filterFn(item, debouncedSearchTerm));
  }, [items, debouncedSearchTerm, filterFn]);

  const isSearching = searchTerm !== debouncedSearchTerm;

  return {
    filteredItems,
    isSearching,
    searchTerm: debouncedSearchTerm,
  };
}

// Cache hook for expensive computations
export function useComputationCache<T, R>(
  _data: T,
  computation: (_input: T) => R,
  dependencies: React.DependencyList = []
): R {
  const cache = useRef<Map<string, R>>(new Map());

  return useMemo(() => {
    const key = JSON.stringify({ data: _data, dependencies });

    if (cache.current.has(key)) {
      return cache.current.get(key)!;
    }

    const result = computation(_data);
    cache.current.set(key, result);

    // Clean cache if it gets too large
    if (cache.current.size > 50) {
      const oldestKey = cache.current.keys().next().value;
      if (oldestKey !== undefined) {
        cache.current.delete(oldestKey);
      }
    }

    return result;
  }, [_data, computation, dependencies]);
}
