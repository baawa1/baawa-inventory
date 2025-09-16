# Mobile Table Optimization Plan

## Overview

This document outlines a comprehensive plan to optimize mobile-optimized tables across the inventory POS application. The plan addresses critical issues found during the review of mobile table implementations across products, categories, brands, suppliers, and coupons.

## Issues Identified

### 1. Inconsistent Table Architecture
- **Coupons** uses older `DashboardTableLayout` instead of `MobileDashboardTable`
- Other tables (products, categories, brands, suppliers) all use the newer `MobileDashboardTable` component
- This creates inconsistent UX across different sections

### 2. Performance Issues
- Multiple `useMemo()` calls with dependencies that change frequently
- Unnecessary re-renders due to filter object recreation
- Heavy computations in render functions (e.g., `getProductImage`, `getHierarchyDisplay`)

### 3. Mobile UX Problems
- **Text Truncation**: Inconsistent truncation logic across tables
- **Touch Targets**: Some action buttons may be too small for mobile
- **Information Density**: Cards show too much/little information
- **Expand/Collapse**: Limited information shown before expansion

### 4. Data Display Issues
- **Products**: Price display varies (some show cost, some don't)
- **Categories**: Hierarchy display is verbose and truncates poorly
- **Suppliers**: Contact information layout is cramped
- **Inconsistent Badge Styles**: Different color schemes across tables

### 5. Code Duplication
- Similar filtering logic repeated across all table components
- Pagination logic duplicated in each component
- Status badge rendering logic scattered

## Implementation Plan

### Phase 1: Create Shared Utilities and Hooks (Priority: High)

#### 1.1 Create Shared Status Badge Utility
**File**: `src/lib/utils/status-badges.tsx`

```typescript
import { Badge } from '@/components/ui/badge';

export type StatusType = 'product' | 'category' | 'brand' | 'supplier' | 'coupon' | 'user';

export interface StatusBadgeConfig {
  [key: string]: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    label: string;
  };
}

const STATUS_CONFIGS: Record<StatusType, StatusBadgeConfig> = {
  product: {
    ACTIVE: { variant: 'default', className: 'bg-green-500', label: 'Active' },
    INACTIVE: { variant: 'secondary', label: 'Inactive' },
    OUT_OF_STOCK: { variant: 'secondary', className: 'bg-yellow-500', label: 'Out of Stock' },
    DISCONTINUED: { variant: 'secondary', className: 'bg-gray-500', label: 'Discontinued' },
  },
  category: {
    true: { variant: 'default', className: 'bg-green-500', label: 'Active' },
    false: { variant: 'secondary', label: 'Inactive' },
  },
  brand: {
    true: { variant: 'default', className: 'bg-green-500', label: 'Active' },
    false: { variant: 'secondary', label: 'Inactive' },
  },
  supplier: {
    ACTIVE: { variant: 'default', className: 'bg-green-500', label: 'Active' },
    INACTIVE: { variant: 'secondary', label: 'Inactive' },
  },
  coupon: {
    active: { variant: 'default', className: 'bg-green-100 text-green-800', label: 'Active' },
    inactive: { variant: 'secondary', className: 'bg-gray-100 text-gray-800', label: 'Inactive' },
    expired: { variant: 'destructive', className: 'bg-red-100 text-red-800', label: 'Expired' },
    'used up': { variant: 'secondary', className: 'bg-orange-100 text-orange-800', label: 'Used Up' },
  },
  user: {
    APPROVED: { variant: 'default', label: 'Approved' },
    PENDING: { variant: 'secondary', label: 'Pending' },
    VERIFIED: { variant: 'outline', label: 'Verified' },
    REJECTED: { variant: 'destructive', label: 'Rejected' },
    SUSPENDED: { variant: 'destructive', label: 'Suspended' },
  },
};

export const createStatusBadge = (
  status: string, 
  type: StatusType, 
  className?: string
) => {
  const config = STATUS_CONFIGS[type]?.[status];
  
  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className || ''} ${className || ''}`.trim()}
    >
      {config.label}
    </Badge>
  );
};
```

#### 1.2 Create Text Truncation Utility
**File**: `src/lib/utils/text-utils.ts`

```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface TruncateOptions {
  maxLength: number;
  suffix?: string;
  showTooltip?: boolean;
  className?: string;
}

export const smartTruncate = (
  text: string, 
  options: TruncateOptions
): string => {
  const { maxLength, suffix = '...' } = options;
  
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const TruncatedText = ({ 
  text, 
  maxLength = 20, 
  showTooltip = true,
  className = "truncate"
}: {
  text: string;
  maxLength?: number;
  showTooltip?: boolean;
  className?: string;
}) => {
  const shouldTruncate = text && text.length > maxLength;
  const truncatedText = shouldTruncate ? smartTruncate(text, { maxLength }) : text;
  
  if (!shouldTruncate || !showTooltip) {
    return <span className={className}>{truncatedText}</span>;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{truncatedText}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

#### 1.3 Create Unified Table Hook
**File**: `src/hooks/useTableState.ts`

```typescript
import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export interface TableFilters {
  search: string;
  [key: string]: any;
}

export interface PaginationState {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TableState<T extends TableFilters = TableFilters> {
  filters: T;
  pagination: PaginationState;
  sorting: SortState;
  visibleColumns: string[];
}

export interface UseTableStateOptions<T extends TableFilters = TableFilters> {
  initialFilters: T;
  initialPagination?: Partial<PaginationState>;
  initialSorting?: Partial<SortState>;
  initialVisibleColumns?: string[];
  debounceMs?: number;
}

export const useTableState = <T extends TableFilters = TableFilters>({
  initialFilters,
  initialPagination = {},
  initialSorting = { sortBy: 'createdAt', sortOrder: 'desc' },
  initialVisibleColumns = [],
  debounceMs = 300,
}: UseTableStateOptions<T>) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    ...initialPagination,
  });
  const [sorting, setSorting] = useState<SortState>(initialSorting);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(initialVisibleColumns);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, debounceMs);
  const isSearching = filters.search !== debouncedSearchTerm;

  // Memoized filter values for API calls
  const apiFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearchTerm,
  }), [filters, debouncedSearchTerm]);

  const handleFilterChange = useCallback((key: keyof T, value: any) => {
    setFilters(prev => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [initialFilters]);

  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setSorting({ 
      sortBy, 
      sortOrder: sortOrder as 'asc' | 'desc' 
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  }, []);

  const updatePaginationFromAPI = useCallback((apiPagination: any) => {
    setPagination(prev => ({
      ...prev,
      totalPages: apiPagination.totalPages || Math.ceil((apiPagination.total || 0) / prev.limit),
      totalItems: apiPagination.total || apiPagination.totalItems || 0,
    }));
  }, []);

  return {
    filters,
    apiFilters,
    pagination,
    sorting,
    visibleColumns,
    isSearching,
    handleFilterChange,
    handleResetFilters,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    updatePaginationFromAPI,
    setVisibleColumns,
  };
};
```

#### 1.4 Create Mobile Card Templates
**File**: `src/components/ui/mobile-card-templates.tsx`

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileCardTitleProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export const MobileCardTitle = ({ 
  icon, 
  title, 
  subtitle, 
  className,
  children 
}: MobileCardTitleProps) => {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {icon && (
        <div className="flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export interface MobileCardSubtitleProps {
  items: Array<{
    label: string;
    value?: string | number;
    icon?: React.ReactNode;
    className?: string;
  }>;
  className?: string;
}

export const MobileCardSubtitle = ({ items, className }: MobileCardSubtitleProps) => {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground flex-wrap", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>•</span>}
          <div className={cn("flex items-center gap-1 truncate", item.className)}>
            {item.icon}
            <span>
              {item.label}
              {item.value && `: ${item.value}`}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export interface IconWrapperProps {
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IconWrapper = ({ 
  children, 
  bgColor = 'bg-gray-100', 
  textColor = 'text-gray-600',
  size = 'md',
  className 
}: IconWrapperProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={cn(
      sizeClasses[size], 
      bgColor, 
      textColor,
      "rounded-lg flex items-center justify-center flex-shrink-0",
      className
    )}>
      <div className={iconSizeClasses[size]}>
        {children}
      </div>
    </div>
  );
};
```

**Time Estimate**: 2-3 days  
**Impact**: High - Eliminates code duplication and ensures consistency

---

### Phase 2: Standardize Table Architecture (Priority: Critical)

#### 2.1 Convert CouponList to MobileDashboardTable
**File**: `src/components/pos/CouponList.tsx`

**Changes Required**:
1. Replace `DashboardTableLayout` with `MobileDashboardTable`
2. Add mobile card title/subtitle functions
3. Implement consistent action dropdowns
4. Add proper mobile pagination
5. Use shared utilities from Phase 1

#### 2.2 Create Unified Column Configurations
**File Structure**:
```
src/lib/table-columns/
├── product-columns.ts
├── category-columns.ts  
├── brand-columns.ts
├── supplier-columns.ts
└── coupon-columns.ts
```

**Example - Product Columns**:
```typescript
// src/lib/table-columns/product-columns.ts
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';

export const PRODUCT_COLUMNS: DashboardTableColumn[] = [
  {
    key: 'image',
    label: 'Image',
    defaultVisible: true,
    required: false,
    hideOnMobile: false,
    mobileOrder: 0,
    className: 'w-16',
  },
  {
    key: 'name',
    label: 'Product Name',
    sortable: true,
    defaultVisible: true,
    required: true,
    hideOnMobile: false,
    mobileOrder: 1,
    mobileLabel: 'Name',
    className: 'min-w-[200px]',
  },
  {
    key: 'sku',
    label: 'SKU',
    sortable: true,
    defaultVisible: true,
    required: false,
    hideOnMobile: false,
    mobileOrder: 2,
    className: 'font-mono text-sm',
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    defaultVisible: true,
    required: false,
    hideOnMobile: false,
    mobileOrder: 3,
  },
  {
    key: 'brand',
    label: 'Brand',
    sortable: true,
    defaultVisible: true,
    required: false,
    hideOnMobile: false,
    mobileOrder: 4,
  },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
    defaultVisible: true,
    required: false,
    hideOnMobile: false,
    mobileOrder: 5,
  },
  {
    key: 'pricing',
    label: 'Pricing',
    sortable: false,
    defaultVisible: true,
    required: false,
    hideOnMobile: false,
    mobileOrder: 6,
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    defaultVisible: false,
    required: false,
    hideOnMobile: true,
    mobileOrder: 7,
  },
  {
    key: 'cost',
    label: 'Cost',
    sortable: true,
    defaultVisible: false,
    required: false,
    hideOnMobile: true,
    mobileOrder: 8,
    permissionRequired: 'COST_VIEW',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    defaultVisible: true,
    required: false,
    hideOnMobile: false,
    mobileOrder: 9,
  },
  {
    key: 'supplier',
    label: 'Supplier',
    sortable: true,
    defaultVisible: false,
    required: false,
    hideOnMobile: true,
    mobileOrder: 10,
  },
];
```

#### 2.3 Standardize Action Menus
**File**: `src/components/ui/table-actions.tsx`

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconDots } from '@tabler/icons-react';

export interface TableAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  hidden?: boolean;
  requiresConfirmation?: boolean;
}

export interface TableActionMenuProps {
  actions: TableAction[];
  align?: 'start' | 'center' | 'end';
  label?: string;
  className?: string;
}

export const TableActionMenu = ({ 
  actions, 
  align = 'end', 
  label = 'Actions',
  className 
}: TableActionMenuProps) => {
  const visibleActions = actions.filter(action => !action.hidden);
  
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`h-8 w-8 p-0 ${className || ''}`}
          disabled={visibleActions.every(action => action.disabled)}
        >
          <IconDots className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[160px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {visibleActions.map((action, index) => (
          <React.Fragment key={action.key}>
            {index > 0 && action.variant === 'destructive' && 
             visibleActions[index - 1].variant !== 'destructive' && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex items-center gap-2 ${
                action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''
              }`}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

**Time Estimate**: 3-4 days  
**Impact**: Critical - Ensures consistent UX across all tables

---

### Phase 3: Optimize Mobile Card Designs (Priority: High)

#### 3.1 Redesign Product Cards
**File**: `src/components/inventory/MobileProductList.tsx`

**Issues to fix**:
- Complex image handling logic
- Inconsistent price display
- Stock status not prominent enough

**New implementation**:
```typescript
// Extract image handling to utility
const OptimizedProductImage = memo(({ src, alt, className }: {
  src: string;
  alt: string;
  className?: string;
}) => {
  return (
    <ProductImage
      src={src}
      alt={alt}
      size="sm"
      className={cn("rounded-lg", className)}
      fallback={
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <IconPackages className="w-6 h-6 text-gray-400" />
        </div>
      }
    />
  );
});

// Optimized stock status component
const StockStatusBadge = memo(({ stock, minStock }: {
  stock: number;
  minStock: number;
}) => {
  const status = useMemo(() => {
    if (stock === 0) {
      return {
        icon: <IconAlertTriangle className="w-3 h-3" />,
        text: 'Out of stock',
        className: 'text-red-600 bg-red-50 border-red-200',
      };
    } else if (stock <= minStock) {
      return {
        icon: <IconAlertTriangle className="w-3 h-3" />,
        text: 'Low stock',
        className: 'text-amber-600 bg-amber-50 border-amber-200',
      };
    }
    return {
      icon: <IconPackages className="w-3 h-3" />,
      text: 'In stock',
      className: 'text-green-600 bg-green-50 border-green-200',
    };
  }, [stock, minStock]);

  return (
    <Badge className={cn("text-xs px-2 py-0.5 font-medium", status.className)}>
      <span className="flex items-center gap-1">
        {status.icon}
        {status.text}
      </span>
    </Badge>
  );
});

// New mobile card design
const mobileCardTitle = useCallback((product: APIProduct) => (
  <MobileCardTitle
    icon={
      <OptimizedProductImage 
        src={getProductImage(product)} 
        alt={product.name}
        className="w-12 h-12"
      />
    }
    title={product.name}
    subtitle={product.brand?.name}
  >
    <div className="flex items-center gap-2 mt-1">
      <StockStatusBadge stock={product.stock || 0} minStock={product.minStock || 0} />
      <span className="font-semibold text-green-600">
        {formatCurrency(product.price || 0)}
      </span>
    </div>
  </MobileCardTitle>
), []);

const mobileCardSubtitle = useCallback((product: APIProduct) => (
  <MobileCardSubtitle
    items={[
      { label: 'SKU', value: product.sku },
      { 
        label: 'Stock', 
        value: product.stock || 0,
        icon: <IconPackages className="w-3 h-3" />,
      },
      ...(product.category ? [{ 
        label: 'Category', 
        value: product.category.name 
      }] : []),
    ]}
  />
), []);
```

#### 3.2 Redesign Category Cards
**File**: `src/components/inventory/MobileCategoryList.tsx`

**Issues to fix**:
- Verbose hierarchy display
- Poor truncation of category paths

**New implementation**:
```typescript
// Optimized hierarchy display
const CategoryHierarchyDisplay = memo(({ category }: { category: APICategory }) => {
  if (!category.parent) {
    return <span>{category.name}</span>;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-muted-foreground truncate max-w-[100px]">
        {category.parent.name}
      </span>
      <IconChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <span className="font-medium truncate">{category.name}</span>
    </div>
  );
});

// New mobile card design
const mobileCardTitle = useCallback((category: APICategory) => (
  <MobileCardTitle
    icon={
      <IconWrapper 
        bgColor="bg-blue-100" 
        textColor="text-blue-600"
        size="md"
      >
        {category.parent ? 
          <IconFolder className="w-5 h-5" /> : 
          <IconFolderOpen className="w-5 h-5" />
        }
      </IconWrapper>
    }
    title={category.name}
    subtitle={category.parent?.name ? `in ${category.parent.name}` : undefined}
  />
), []);

const mobileCardSubtitle = useCallback((category: APICategory) => (
  <MobileCardSubtitle
    items={[
      { 
        label: 'Products', 
        value: category.productCount || 0,
        icon: <IconPackages className="w-3 h-3" />,
      },
      ...(category.children && category.children.length > 0 ? [{
        label: 'Subcategories',
        value: category.children.length,
        icon: <IconFolder className="w-3 h-3" />,
      }] : []),
      {
        label: createStatusBadge(category.isActive.toString(), 'category'),
      }
    ]}
  />
), []);
```

#### 3.3 Redesign Supplier Cards
**File**: `src/components/inventory/MobileSupplierList.tsx`

**Issues to fix**:
- Cramped contact information
- Missing key metrics

**New implementation**:
```typescript
// Contact information component
const SupplierContactInfo = memo(({ supplier }: { supplier: APISupplier }) => {
  const contacts = useMemo(() => {
    const info = [];
    if (supplier.phone) {
      info.push({
        type: 'phone',
        value: supplier.phone,
        icon: <IconPhone className="w-3 h-3" />,
        href: `tel:${supplier.phone}`,
      });
    }
    if (supplier.email) {
      info.push({
        type: 'email',
        value: supplier.email,
        icon: <IconMail className="w-3 h-3" />,
        href: `mailto:${supplier.email}`,
      });
    }
    return info;
  }, [supplier.phone, supplier.email]);

  return (
    <div className="flex items-center gap-3 mt-1">
      {contacts.slice(0, 2).map((contact) => (
        <a
          key={contact.type}
          href={contact.href}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          {contact.icon}
          <TruncatedText text={contact.value} maxLength={15} />
        </a>
      ))}
    </div>
  );
});

// New mobile card design
const mobileCardTitle = useCallback((supplier: APISupplier) => (
  <MobileCardTitle
    icon={
      <IconWrapper 
        bgColor="bg-orange-100" 
        textColor="text-orange-600"
        size="md"
      >
        <IconTruck className="w-5 h-5" />
      </IconWrapper>
    }
    title={supplier.name}
    subtitle={supplier.contactPerson}
  >
    <SupplierContactInfo supplier={supplier} />
  </MobileCardTitle>
), []);

const mobileCardSubtitle = useCallback((supplier: APISupplier) => (
  <MobileCardSubtitle
    items={[
      { 
        label: 'Products', 
        value: supplier._count?.products || 0,
        icon: <IconPackages className="w-3 h-3" />,
      },
      ...(supplier.city ? [{ 
        label: 'Location', 
        value: supplier.city,
        icon: <IconMapPin className="w-3 h-3" />,
      }] : []),
      {
        label: createStatusBadge('ACTIVE', 'supplier'),
      }
    ]}
  />
), []);
```

**Time Estimate**: 4-5 days  
**Impact**: High - Significantly improves mobile UX and information hierarchy

---

### Phase 4: Implement Performance Optimizations (Priority: Medium-High)

#### 4.1 Optimize Expensive Computations
**Target Files**: All table components

**Create Performance Hook**:
```typescript
// src/hooks/useTablePerformance.ts
import { useMemo, useCallback } from 'react';

export const useTablePerformance = <T extends Record<string, any>>(
  data: T[],
  dependencies: any[] = []
) => {
  // Memoize expensive operations
  const memoizedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      _computed: {
        // Pre-compute expensive values
        displayName: computeDisplayName(item),
        statusInfo: computeStatusInfo(item),
        formattedValues: computeFormattedValues(item),
      }
    }));
  }, [data, ...dependencies]);

  // Memoized cell renderers
  const createCellRenderer = useCallback(<K extends keyof T>(
    columnKey: K,
    renderFn: (item: T, key: K) => React.ReactNode
  ) => {
    return (item: T) => renderFn(item, columnKey);
  }, []);

  return {
    memoizedData,
    createCellRenderer,
  };
};
```

**Optimized Image Component**:
```typescript
// src/components/ui/optimized-image.tsx
import { memo, useState, useCallback } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  lazy?: boolean;
}

export const OptimizedImage = memo(({
  src,
  alt,
  className,
  fallback,
  lazy = true
}: OptimizedImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
  }, []);

  if (imageError || !src) {
    return fallback || <div className={`bg-gray-200 ${className}`} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});
```

#### 4.2 Implement Virtual Scrolling (Optional)
**File**: `src/components/ui/virtual-table.tsx`

```typescript
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

interface VirtualTableProps<T> {
  data: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => JSX.Element;
}

export const VirtualTable = memo(<T extends any>({
  data,
  height,
  itemHeight,
  renderItem
}: VirtualTableProps<T>) => {
  return (
    <List
      height={height}
      itemCount={data.length}
      itemSize={itemHeight}
      itemData={data}
    >
      {renderItem}
    </List>
  );
});
```

#### 4.3 Bundle Size Optimization
**Create Lazy Loading Wrapper**:
```typescript
// src/components/ui/lazy-table.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load table components
export const LazyProductTable = lazy(() => import('@/components/inventory/MobileProductList'));
export const LazyCategoryTable = lazy(() => import('@/components/inventory/MobileCategoryList'));
export const LazyBrandTable = lazy(() => import('@/components/inventory/MobileBrandList'));
export const LazySupplierTable = lazy(() => import('@/components/inventory/MobileSupplierList'));
export const LazyCouponTable = lazy(() => import('@/components/pos/CouponList'));

const TableSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
);

export const TableWithSuspense = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => (
  <Suspense fallback={<TableSkeleton />}>
    {children}
  </Suspense>
);
```

**Time Estimate**: 3-4 days  
**Impact**: Medium-High - Improves app performance and reduces load times

---

### Phase 5: Enhance Responsive Design (Priority: Medium)

#### 5.1 Improve Touch Targets
**File**: `src/styles/mobile-table.css`

```css
/* Mobile-optimized touch targets */
.mobile-table-container {
  --touch-target-size: 44px;
}

.mobile-action-button {
  min-height: var(--touch-target-size);
  min-width: var(--touch-target-size);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.mobile-card {
  padding: 16px;
  margin-bottom: 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.mobile-card:hover {
  background-color: var(--card-hover-bg);
}

.mobile-card:active {
  transform: scale(0.98);
  background-color: var(--card-active-bg);
}

/* Improve scrolling performance */
.mobile-table-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* Better focus indicators for keyboard navigation */
.mobile-card:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* Responsive text sizing */
@media (max-width: 640px) {
  .mobile-card-title {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  .mobile-card-subtitle {
    font-size: 0.75rem;
    line-height: 1rem;
  }
}

/* Loading states */
.mobile-card-loading {
  pointer-events: none;
  opacity: 0.6;
}

.mobile-card-loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.4), 
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

#### 5.2 Enhanced Loading States
**File**: `src/components/ui/mobile-skeletons.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const MobileCardSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="w-8 h-8 rounded" />
          </div>
          
          {/* Expandable content skeleton */}
          <div className="mt-4 pt-4 border-t space-y-2 opacity-50">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const MobileTableSkeleton = () => (
  <div className="space-y-6">
    {/* Filter bar skeleton */}
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
    
    {/* Cards skeleton */}
    <MobileCardSkeleton count={5} />
    
    {/* Pagination skeleton */}
    <div className="flex items-center justify-between pt-4">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  </div>
);
```

#### 5.3 Pull-to-Refresh Implementation
**File**: `src/hooks/usePullToRefresh.ts`

```typescript
import { useEffect, useRef, useCallback, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 100,
  disabled = false
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.6, threshold * 1.2));
      e.preventDefault();
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || pullDistance < threshold) {
      setPullDistance(0);
      startY.current = 0;
      return;
    }

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      startY.current = 0;
    }
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    shouldShowRefreshIndicator: pullDistance > 0,
  };
};
```

**Time Estimate**: 2-3 days  
**Impact**: Medium - Enhances mobile user experience

---

### Phase 6: Testing and Validation (Priority: High)

#### 6.1 Create Testing Utilities
**File**: `tests/utils/table-test-helpers.ts`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

export const mockTableData = {
  products: [
    {
      id: 1,
      name: 'Test Product',
      sku: 'TEST001',
      price: 100,
      stock: 10,
      status: 'ACTIVE',
      brand: { id: 1, name: 'Test Brand' },
      category: { id: 1, name: 'Test Category' },
    },
  ],
  categories: [
    {
      id: 1,
      name: 'Test Category',
      isActive: true,
      productCount: 5,
      children: [],
    },
  ],
  // ... more mock data
};

export const testMobileInteraction = async (element: HTMLElement) => {
  const user = userEvent.setup();
  
  // Test touch interactions
  fireEvent.touchStart(element);
  fireEvent.touchEnd(element);
  
  // Test keyboard navigation
  await user.tab();
  await user.keyboard('{Enter}');
};
```

#### 6.2 Component Tests
**File**: `tests/components/mobile-tables.test.tsx`

```typescript
describe('Mobile Table Components', () => {
  describe('MobileProductList', () => {
    it('renders product cards correctly', async () => {
      renderWithQueryClient(
        <MobileProductList user={mockUser} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('handles search functionality', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <MobileProductList user={mockUser} />
      );
      
      const searchInput = screen.getByPlaceholderText('Search products...');
      await user.type(searchInput, 'test');
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });
    });

    it('expands/collapses card details', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <MobileProductList user={mockUser} />
      );
      
      const card = screen.getByText('Test Product').closest('[data-testid="mobile-card"]');
      await user.click(card!);
      
      await waitFor(() => {
        expect(screen.getByText('Tap to collapse')).toBeInTheDocument();
      });
    });
  });

  // Similar tests for other table components
});
```

#### 6.3 Performance Tests
**File**: `tests/performance/table-performance.test.ts`

```typescript
describe('Table Performance', () => {
  it('renders large datasets without performance issues', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      // ... other fields
    }));

    const start = performance.now();
    renderWithQueryClient(
      <MobileProductList user={mockUser} initialData={largeDataset} />
    );
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // Should render in less than 100ms
  });

  it('minimizes re-renders on filter changes', () => {
    const renderSpy = jest.fn();
    // Test implementation
  });
});
```

#### 6.4 Accessibility Tests
**File**: `tests/accessibility/table-a11y.test.ts`

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Table Accessibility', () => {
  it('meets accessibility standards', async () => {
    const { container } = renderWithQueryClient(
      <MobileProductList user={mockUser} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MobileProductList user={mockUser} />
    );

    // Test tab navigation
    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });
});
```

**Time Estimate**: 2-3 days  
**Impact**: High - Ensures quality and prevents regressions

---

## Implementation Timeline

| Phase | Duration | Dependencies | Key Deliverables |
|-------|----------|--------------|------------------|
| **Phase 1** | 2-3 days | None | - Shared utilities<br>- Unified table hook<br>- Mobile card templates |
| **Phase 2** | 3-4 days | Phase 1 | - Standardized table architecture<br>- Unified column configurations<br>- Consistent action menus |
| **Phase 3** | 4-5 days | Phase 1, 2 | - Optimized product cards<br>- Enhanced category cards<br>- Improved supplier cards |
| **Phase 4** | 3-4 days | Phase 1, 2 | - Performance optimizations<br>- Bundle size improvements<br>- Memory usage optimizations |
| **Phase 5** | 2-3 days | Phase 3 | - Enhanced touch targets<br>- Better loading states<br>- Pull-to-refresh |
| **Phase 6** | 2-3 days | All phases | - Comprehensive testing<br>- Performance validation<br>- Accessibility compliance |

**Total Estimated Time**: 16-22 days

## Success Metrics

### Consistency Metrics
- [ ] All tables use the same `MobileDashboardTable` architecture
- [ ] Consistent status badge styling across all tables
- [ ] Unified action menu patterns
- [ ] Standardized mobile card layouts

### Performance Metrics
- [ ] 50% reduction in unnecessary re-renders
- [ ] 30% reduction in bundle size for table components
- [ ] Initial render time < 100ms for datasets with 50+ items
- [ ] Smooth 60fps scrolling on mobile devices

### User Experience Metrics
- [ ] Touch targets meet 44px minimum requirement
- [ ] Consistent information hierarchy across all cards
- [ ] Improved mobile usability scores
- [ ] Reduced user complaints about mobile table usage

### Code Quality Metrics
- [ ] 60% reduction in code duplication
- [ ] All components use shared utilities
- [ ] Consistent code patterns across all tables
- [ ] 90%+ test coverage for table components

## Risk Mitigation Strategies

### Technical Risks
1. **Breaking Changes**
   - Implement behind feature flags initially
   - Gradual rollout with A/B testing
   - Maintain backward compatibility during transition

2. **Performance Regressions**
   - Monitor bundle size with webpack-bundle-analyzer
   - Set up performance budgets in CI/CD
   - Regular performance testing on various devices

3. **User Experience Issues**
   - Conduct user testing sessions
   - Monitor user feedback and analytics
   - Have rollback plan ready

### Timeline Risks
1. **Scope Creep**
   - Strict adherence to defined phases
   - Regular progress reviews
   - Clear definition of done for each phase

2. **Dependency Delays**
   - Identify critical path dependencies early
   - Parallel development where possible
   - Buffer time built into estimates

## Next Steps

1. **Immediate**: Begin Phase 1 implementation
2. **Week 1**: Complete shared utilities and hooks
3. **Week 2**: Standardize table architecture
4. **Week 3**: Optimize mobile card designs
5. **Week 4**: Performance optimizations and testing

## Maintenance Plan

### Post-Implementation
1. **Monitor Performance**: Set up performance monitoring for mobile tables
2. **User Feedback**: Collect and analyze user feedback on new designs
3. **Iterative Improvements**: Plan quarterly improvements based on usage data
4. **Documentation**: Maintain documentation for new patterns and utilities

This plan provides a comprehensive roadmap to address all identified issues while ensuring a consistent, performant, and user-friendly mobile table experience across your application.