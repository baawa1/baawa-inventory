import { useState, useCallback } from 'react';

export interface ListFiltersState {
  search: string;
  [key: string]: string | boolean;
}

export interface UseListFiltersOptions<T extends ListFiltersState> {
  initialFilters: T;
  onFilterChange?: (_filters: T) => void;
}

export function useListFilters<T extends ListFiltersState>({
  initialFilters,
  onFilterChange,
}: UseListFiltersOptions<T>) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(
    (key: keyof T, value: string | boolean) => {
      setFilters(prev => {
        // Prevent unnecessary updates
        if (prev[key] === value) return prev;

        const newFilters = { ...prev, [key]: value };
        onFilterChange?.(newFilters);
        return newFilters;
      });
    },
    [onFilterChange]
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    onFilterChange?.(initialFilters);
  }, [initialFilters, onFilterChange]);

  const updateMultipleFilters = useCallback(
    (updates: Partial<T>) => {
      setFilters(prev => {
        const newFilters = { ...prev, ...updates };
        onFilterChange?.(newFilters);
        return newFilters;
      });
    },
    [onFilterChange]
  );

  return {
    filters,
    updateFilter,
    resetFilters,
    updateMultipleFilters,
  };
}

// Common filter configurations
export const createFilterConfig = (
  key: string,
  label: string,
  options: Array<{ value: string; label: string }>,
  placeholder?: string
) => ({
  key,
  label,
  type: 'select' as const,
  options,
  placeholder: placeholder || `All ${label}`,
});

export const createStatusFilterConfig = (
  key: string = 'status',
  label: string = 'Status',
  statusOptions: Array<{ value: string; label: string }> = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ]
) => createFilterConfig(key, label, statusOptions);
