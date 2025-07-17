import { useState, useEffect, useCallback } from "react";

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible?: boolean;
  required?: boolean;
  sortable?: boolean;
}

export interface UseColumnPersistenceOptions {
  storageKey: string;
  columns: ColumnConfig[];
  excludeColumns?: string[];
}

export function useColumnPersistence({
  storageKey,
  columns,
  excludeColumns = ["actions"],
}: UseColumnPersistenceOptions) {
  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return columns
      .filter((col) => col.defaultVisible && !excludeColumns.includes(col.key))
      .map((col) => col.key);
  }, [columns, excludeColumns]);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(getDefaultVisibleColumns());

  // Load persisted columns from localStorage on mount
  useEffect(() => {
    const loadPersistedColumns = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Filter out excluded columns and ensure all columns exist
            const validColumns = parsed.filter(
              (col: string) => 
                !excludeColumns.includes(col) && 
                columns.some((column) => column.key === col)
            );
            
            if (validColumns.length > 0) {
              setVisibleColumns(validColumns);
              return;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to load persisted columns for ${storageKey}:`, error);
        // Remove corrupted data
        localStorage.removeItem(storageKey);
      }
      
      // Fallback to default columns
      setVisibleColumns(getDefaultVisibleColumns());
    };

    loadPersistedColumns();
  }, [storageKey, excludeColumns, columns, getDefaultVisibleColumns]);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    if (visibleColumns.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
      } catch (error) {
        console.warn(`Failed to save columns for ${storageKey}:`, error);
      }
    }
  }, [visibleColumns, storageKey]);

  // Update visible columns with validation
  const updateVisibleColumns = useCallback((newColumns: string[]) => {
    const validColumns = newColumns.filter(
      (col) => 
        !excludeColumns.includes(col) && 
        columns.some((column) => column.key === col)
    );
    
    setVisibleColumns(validColumns);
  }, [excludeColumns, columns]);

  // Reset to default columns
  const resetToDefaults = useCallback(() => {
    const defaultColumns = getDefaultVisibleColumns();
    setVisibleColumns(defaultColumns);
    localStorage.removeItem(storageKey);
  }, [getDefaultVisibleColumns, storageKey]);

  // Clean up invalid columns (utility function)
  const cleanupInvalidColumns = useCallback(() => {
    const validColumns = visibleColumns.filter(
      (col) => 
        !excludeColumns.includes(col) && 
        columns.some((column) => column.key === col)
    );
    
    if (validColumns.length !== visibleColumns.length) {
      setVisibleColumns(validColumns);
    }
  }, [visibleColumns, excludeColumns, columns]);

  // Get effective visible columns (with fallback)
  const effectiveVisibleColumns = visibleColumns.length > 0 
    ? visibleColumns 
    : getDefaultVisibleColumns();

  return {
    visibleColumns: effectiveVisibleColumns,
    updateVisibleColumns,
    resetToDefaults,
    cleanupInvalidColumns,
  };
}

// Utility function to clean up localStorage for a specific key
export const cleanupColumnStorage = (storageKey: string, excludeColumns: string[] = ["actions"]) => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const hasExcludedColumns = parsed.some((col: string) => excludeColumns.includes(col));
        if (hasExcludedColumns) {
          const cleaned = parsed.filter((col: string) => !excludeColumns.includes(col));
          if (cleaned.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(cleaned));
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to cleanup column storage for ${storageKey}:`, error);
    localStorage.removeItem(storageKey);
  }
};