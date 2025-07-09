"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { IconColumns, IconEye, IconEyeOff } from "@tabler/icons-react";

export interface DashboardTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  defaultVisible?: boolean;
  required?: boolean; // Can't be hidden
}

interface DashboardColumnCustomizerProps {
  columns: DashboardTableColumn[];
  onColumnsChange: (visibleColumns: string[]) => void;
  localStorageKey: string;
}

export function DashboardColumnCustomizer({
  columns,
  onColumnsChange,
  localStorageKey,
}: DashboardColumnCustomizerProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Initialize visible columns from localStorage or defaults
  useEffect(() => {
    const savedColumns = localStorage.getItem(localStorageKey);
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Ensure required columns are always included
        const requiredColumns = columns
          .filter((col) => col.required)
          .map((col) => col.key);
        const mergedColumns = [...new Set([...requiredColumns, ...parsed])];
        setVisibleColumns(mergedColumns);
        onColumnsChange(mergedColumns);
      } catch {
        // Fallback to defaults if parsing fails
        const defaultColumns = columns
          .filter((col) => col.defaultVisible)
          .map((col) => col.key);
        setVisibleColumns(defaultColumns);
        onColumnsChange(defaultColumns);
      }
    } else {
      // Use default visible columns
      const defaultColumns = columns
        .filter((col) => col.defaultVisible)
        .map((col) => col.key);
      setVisibleColumns(defaultColumns);
      onColumnsChange(defaultColumns);
    }
  }, [localStorageKey, onColumnsChange, columns]);

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    // Don't allow disabling required columns
    const column = columns.find((col) => col.key === columnKey);
    if (!checked && column?.required) {
      return;
    }

    const newVisibleColumns = checked
      ? [...visibleColumns, columnKey]
      : visibleColumns.filter((key) => key !== columnKey);

    setVisibleColumns(newVisibleColumns);
    onColumnsChange(newVisibleColumns);

    // Save to localStorage
    localStorage.setItem(localStorageKey, JSON.stringify(newVisibleColumns));
  };

  const resetToDefaults = () => {
    const defaultColumns = columns
      .filter((col) => col.defaultVisible)
      .map((col) => col.key);

    setVisibleColumns(defaultColumns);
    onColumnsChange(defaultColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(defaultColumns));
  };

  const showAllColumns = () => {
    const allColumns = columns.map((col) => col.key);
    setVisibleColumns(allColumns);
    onColumnsChange(allColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(allColumns));
  };

  const hideOptionalColumns = () => {
    const requiredColumns = columns
      .filter((col) => col.required)
      .map((col) => col.key);

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
          <span className="ml-1 text-xs text-muted-foreground">
            ({visibleCount}/{totalCount})
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
          <div className="flex gap-1 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={showAllColumns}
              className="h-6 px-2 text-xs flex-1"
            >
              <IconEye className="h-3 w-3 mr-1" />
              Show All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={hideOptionalColumns}
              className="h-6 px-2 text-xs flex-1"
            >
              <IconEyeOff className="h-3 w-3 mr-1" />
              Hide Optional
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-64 overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={visibleColumns.includes(column.key)}
              onCheckedChange={(checked) =>
                handleColumnToggle(column.key, checked)
              }
              disabled={column.required}
              className="text-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span>{column.label}</span>
                {column.required && (
                  <span className="text-xs text-muted-foreground ml-2">
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
