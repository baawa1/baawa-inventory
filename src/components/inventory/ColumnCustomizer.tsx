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

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  defaultVisible?: boolean;
  required?: boolean; // Can't be hidden
  className?: string;
  headerClassName?: string;
  // Mobile-specific properties
  mobileLabel?: string;
  hideOnMobile?: boolean;
  mobileOrder?: number;
}

export const PRODUCT_COLUMNS: TableColumn[] = [
  {
    key: 'image',
    label: 'Image',
    sortable: false,
    defaultVisible: true,
    required: true,
    hideOnMobile: false,
    mobileOrder: 0,
  },
  {
    key: 'name',
    label: 'Product Name',
    sortable: true,
    defaultVisible: true,
    required: true,
    mobileLabel: 'Product',
    mobileOrder: 1,
  },
  {
    key: 'sku',
    label: 'SKU',
    sortable: true,
    defaultVisible: true,
    required: true,
    mobileOrder: 2,
  },
  { 
    key: 'category', 
    label: 'Category', 
    sortable: true, 
    defaultVisible: true,
    mobileOrder: 4,
  },
  { 
    key: 'brand', 
    label: 'Brand', 
    sortable: true, 
    defaultVisible: true,
    mobileOrder: 5,
  },
  { 
    key: 'stock', 
    label: 'Stock', 
    sortable: true, 
    defaultVisible: true,
    mobileOrder: 3,
  },
  { 
    key: 'pricing', 
    label: 'Pricing & Margin', 
    sortable: true, 
    defaultVisible: true,
    mobileLabel: 'Price',
    mobileOrder: 6,
  },
  { 
    key: 'price', 
    label: 'Selling Price', 
    sortable: true, 
    defaultVisible: false,
    mobileLabel: 'Price',
    mobileOrder: 7,
  },
  { 
    key: 'status', 
    label: 'Status', 
    sortable: true, 
    defaultVisible: true,
    mobileOrder: 8,
  },
  { 
    key: 'supplier', 
    label: 'Supplier', 
    sortable: false, 
    defaultVisible: true,
    mobileOrder: 9,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    defaultVisible: false,
  },
  { key: 'barcode', label: 'Barcode', sortable: true, defaultVisible: false },
  { key: 'cost', label: 'Cost Price', sortable: true, defaultVisible: false },
  {
    key: 'minStock',
    label: 'Min Stock',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'maxStock',
    label: 'Max Stock',
    sortable: true,
    defaultVisible: false,
  },
  { key: 'unit', label: 'Unit', sortable: true, defaultVisible: false },
  { key: 'weight', label: 'Weight', sortable: true, defaultVisible: false },
  {
    key: 'dimensions',
    label: 'Dimensions',
    sortable: false,
    defaultVisible: false,
  },
  { key: 'color', label: 'Color', sortable: true, defaultVisible: false },
  { key: 'size', label: 'Size', sortable: true, defaultVisible: false },
  { key: 'material', label: 'Material', sortable: true, defaultVisible: false },
  {
    key: 'has_variants',
    label: 'Has Variants',
    sortable: true,
    defaultVisible: false,
  },
  { key: 'tags', label: 'Tags', sortable: false, defaultVisible: false },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'wordpress_id',
    label: 'WordPress ID',
    sortable: true,
    defaultVisible: false,
  },
];

export const SUPPLIER_COLUMNS: TableColumn[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'contactPerson',
    label: 'Contact Person',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'address',
    label: 'Address',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'city',
    label: 'City',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'state',
    label: 'State',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'website',
    label: 'Website',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'notes',
    label: 'Notes',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    sortable: true,
    defaultVisible: false,
  },
];

export const CATEGORY_COLUMNS: TableColumn[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'isActive',
    label: 'Status',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'wordpress_id',
    label: 'WordPress ID',
    sortable: true,
    defaultVisible: false,
  },
];

export const COUPON_COLUMNS: TableColumn[] = [
  {
    key: 'code',
    label: 'Coupon Code',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'value',
    label: 'Value',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'wordpress_id',
    label: 'WordPress ID',
    sortable: true,
    defaultVisible: false,
  },
];

export const CUSTOMER_COLUMNS: TableColumn[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'city',
    label: 'City',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'country',
    label: 'Country',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'customerType',
    label: 'Type',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'isActive',
    label: 'Status',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'wordpress_id',
    label: 'WordPress ID',
    sortable: true,
    defaultVisible: false,
  },
];

export const STOCK_RECONCILIATION_COLUMNS: TableColumn[] = [
  {
    key: 'title',
    label: 'Reconciliation Title',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'itemCount',
    label: 'Items Count',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'totalDiscrepancy',
    label: 'Total Discrepancy',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'createdBy',
    label: 'Created By',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'updatedAt',
    label: 'Updated Date',
    sortable: true,
    defaultVisible: false,
  },
];

interface ColumnCustomizerProps {
  columns?: TableColumn[];
  onColumnsChange: (_visibleColumns: string[]) => void;
  localStorageKey?: string;
}

export function ColumnCustomizer({
  columns = PRODUCT_COLUMNS,
  onColumnsChange,
  localStorageKey = 'products-visible-columns',
}: ColumnCustomizerProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Initialize visible columns from localStorage or defaults
  useEffect(() => {
    const savedColumns = localStorage.getItem(localStorageKey);
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Ensure required columns are always included
        const requiredColumns = columns
          .filter(col => col.required)
          .map(col => col.key);
        const mergedColumns = [...new Set([...requiredColumns, ...parsed])];
        setVisibleColumns(mergedColumns);
        onColumnsChange(mergedColumns);
      } catch {
        // Fallback to defaults if parsing fails
        const defaultColumns = columns
          .filter(col => col.defaultVisible)
          .map(col => col.key);
        setVisibleColumns(defaultColumns);
        onColumnsChange(defaultColumns);
      }
    } else {
      // Use default visible columns
      const defaultColumns = columns
        .filter(col => col.defaultVisible)
        .map(col => col.key);
      setVisibleColumns(defaultColumns);
      onColumnsChange(defaultColumns);
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
    const defaultColumns = columns
      .filter(col => col.defaultVisible)
      .map(col => col.key);

    setVisibleColumns(defaultColumns);
    onColumnsChange(defaultColumns);
    localStorage.setItem(localStorageKey, JSON.stringify(defaultColumns));
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
