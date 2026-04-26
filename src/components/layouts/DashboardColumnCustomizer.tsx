'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { IconColumns, IconEye, IconEyeOff } from '@tabler/icons-react';

export interface DashboardTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  defaultVisible?: boolean;
  required?: boolean; // Can't be hidden
  className?: string;
  headerClassName?: string;
  // Mobile-specific properties
  mobileLabel?: string; // Custom label for mobile cards
  mobileRender?: (item: any, columnKey: string) => React.ReactNode; // Custom render for mobile cards
  hideOnMobile?: boolean;
  mobileOrder?: number; // Order in mobile card view
}

interface DashboardColumnCustomizerProps {
  columns: DashboardTableColumn[];
  onColumnsChange: (_visibleColumns: string[]) => void;
  localStorageKey: string;
}

function areColumnsEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((columnKey, index) => columnKey === right[index])
  );
}

export function DashboardColumnCustomizer({
  columns,
  onColumnsChange,
  localStorageKey,
}: DashboardColumnCustomizerProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const lastSyncedColumnsRef = useRef<string[]>([]);
  const columnKeys = columns.map(col => col.key);
  const requiredColumns = columns
    .filter(col => col.required)
    .map(col => col.key);
  const defaultColumns = columns
    .filter(col => col.defaultVisible || col.required)
    .map(col => col.key);
  const fallbackColumns =
    defaultColumns.length > 0 ? defaultColumns : requiredColumns;
  const columnsSignature = columns
    .map(
      col =>
        `${col.key}:${col.required ? 'required' : 'optional'}:${
          col.defaultVisible ? 'default' : 'hidden'
        }`
    )
    .join('|');

  const normalizeColumns = (input: unknown) => {
    const validColumnKeys = new Set(columnKeys);
    const requestedColumns = Array.isArray(input)
      ? input.filter(
          (col): col is string =>
            typeof col === 'string' && validColumnKeys.has(col)
        )
      : fallbackColumns;
    const mergedColumns = Array.from(
      new Set(
        requestedColumns.length > 0
          ? [...requiredColumns, ...requestedColumns]
          : fallbackColumns
      )
    );

    return columnKeys.filter(columnKey => mergedColumns.includes(columnKey));
  };

  const applyVisibleColumns = (nextVisibleColumns: string[]) => {
    lastSyncedColumnsRef.current = nextVisibleColumns;
    setVisibleColumns(nextVisibleColumns);
    onColumnsChange(nextVisibleColumns);
  };

  // Initialize visible columns from localStorage or defaults
  useEffect(() => {
    setIsClient(true);
    let normalizedColumns: string[];
    const savedColumns = localStorage.getItem(localStorageKey);

    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        normalizedColumns = normalizeColumns(parsed);
      } catch {
        // Fallback to defaults if parsing fails
        normalizedColumns = normalizeColumns(undefined);
      }
    } else {
      // Use default visible columns
      normalizedColumns = normalizeColumns(undefined);
    }

    setVisibleColumns(currentColumns =>
      areColumnsEqual(currentColumns, normalizedColumns)
        ? currentColumns
        : normalizedColumns
    );

    if (!areColumnsEqual(lastSyncedColumnsRef.current, normalizedColumns)) {
      lastSyncedColumnsRef.current = normalizedColumns;
      onColumnsChange(normalizedColumns);
    }
  }, [columnsSignature, localStorageKey, onColumnsChange]);

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    // Don't allow disabling required columns
    const column = columns.find(col => col.key === columnKey);
    if (!checked && column?.required) {
      return;
    }

    const nextSelection = checked
      ? [...visibleColumns, columnKey]
      : visibleColumns.filter(key => key !== columnKey);
    const newVisibleColumns = normalizeColumns(nextSelection);

    applyVisibleColumns(newVisibleColumns);

    // Save to localStorage
    localStorage.setItem(localStorageKey, JSON.stringify(newVisibleColumns));
  };

  const resetToDefaults = () => {
    const mergedColumns = normalizeColumns(undefined);

    applyVisibleColumns(mergedColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(mergedColumns));
  };

  const showAllColumns = () => {
    const allColumns = normalizeColumns(columns.map(col => col.key));
    applyVisibleColumns(allColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(allColumns));
  };

  const hideOptionalColumns = () => {
    const requiredOnlyColumns = normalizeColumns(requiredColumns);
    applyVisibleColumns(requiredOnlyColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(requiredOnlyColumns));
  };

  const visibleCount = visibleColumns.length;
  const totalCount = columns.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <IconColumns className="h-4 w-4" />
          Customize Columns
          <span className="text-muted-foreground ml-1 text-xs">
            {isClient ? `(${visibleCount}/${totalCount})` : '(0/0)'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Table Columns</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-6 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-1">
          <div className="mb-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={showAllColumns}
              className="h-6 flex-1 px-2 text-xs"
            >
              <IconEye className="mr-1 h-3 w-3" />
              Show All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={hideOptionalColumns}
              className="h-6 flex-1 px-2 text-xs"
            >
              <IconEyeOff className="mr-1 h-3 w-3" />
              Hide Optional
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-64 overflow-y-auto">
          {columns.map(column => (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={visibleColumns.includes(column.key)}
              onCheckedChange={checked =>
                handleColumnToggle(column.key, checked)
              }
              disabled={column.required}
              className="text-sm"
            >
              <div className="flex w-full items-center justify-between">
                <span>{column.label}</span>
                {column.required && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    Required
                  </span>
                )}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
