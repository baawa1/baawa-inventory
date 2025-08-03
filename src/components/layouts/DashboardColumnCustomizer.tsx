'use client';

import { useState, useEffect } from 'react';
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
}

interface DashboardColumnCustomizerProps {
  columns: DashboardTableColumn[];
  onColumnsChange: (_visibleColumns: string[]) => void;
  localStorageKey: string;
}

export function DashboardColumnCustomizer({
  columns,
  onColumnsChange,
  localStorageKey,
}: DashboardColumnCustomizerProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Initialize visible columns from localStorage or defaults
  useEffect(() => {
    setIsClient(true);
    const savedColumns = localStorage.getItem(localStorageKey);
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Ensure required columns are always included and first
        const requiredColumns = columns
          .filter(col => col.required)
          .map(col => col.key);
        const otherColumns = parsed.filter(
          (col: string) => !requiredColumns.includes(col)
        );
        const mergedColumns = [...requiredColumns, ...otherColumns];
        setVisibleColumns(mergedColumns);
        onColumnsChange(mergedColumns);
      } catch {
        // Fallback to defaults if parsing fails
        const requiredColumns = columns
          .filter(col => col.required)
          .map(col => col.key);
        const defaultColumns = columns
          .filter(col => col.defaultVisible && !col.required)
          .map(col => col.key);
        const mergedColumns = [...requiredColumns, ...defaultColumns];
        setVisibleColumns(mergedColumns);
        onColumnsChange(mergedColumns);
      }
    } else {
      // Use default visible columns
      const requiredColumns = columns
        .filter(col => col.required)
        .map(col => col.key);
      const defaultColumns = columns
        .filter(col => col.defaultVisible && !col.required)
        .map(col => col.key);
      const mergedColumns = [...requiredColumns, ...defaultColumns];
      setVisibleColumns(mergedColumns);
      onColumnsChange(mergedColumns);
    }
  }, [localStorageKey, onColumnsChange, columns]);

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    // Don't allow disabling required columns
    const column = columns.find(col => col.key === columnKey);
    if (!checked && column?.required) {
      return;
    }

    const newVisibleColumns = checked
      ? [...visibleColumns, columnKey]
      : visibleColumns.filter(key => key !== columnKey);

    setVisibleColumns(newVisibleColumns);
    onColumnsChange(newVisibleColumns);

    // Save to localStorage
    localStorage.setItem(localStorageKey, JSON.stringify(newVisibleColumns));
  };

  const resetToDefaults = () => {
    const requiredColumns = columns
      .filter(col => col.required)
      .map(col => col.key);
    const defaultColumns = columns
      .filter(col => col.defaultVisible && !col.required)
      .map(col => col.key);
    const mergedColumns = [...requiredColumns, ...defaultColumns];

    setVisibleColumns(mergedColumns);
    onColumnsChange(mergedColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(mergedColumns));
  };

  const showAllColumns = () => {
    const allColumns = columns.map(col => col.key);
    setVisibleColumns(allColumns);
    onColumnsChange(allColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(allColumns));
  };

  const hideOptionalColumns = () => {
    const requiredColumns = columns
      .filter(col => col.required)
      .map(col => col.key);

    setVisibleColumns(requiredColumns);
    onColumnsChange(requiredColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(requiredColumns));
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
