'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Icons
import {
  IconDownload,
  IconTrendingUp,
  IconHistory,
  IconDots,
  IconCalendar,
  IconUser,
  IconPackages,
  IconShoppingCart,
} from '@tabler/icons-react';

import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface StockHistoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  supplier?: {
    id: string;
    name: string;
  };
  purchaseDate: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  previousStock?: number;
  newStock?: number;
}

interface MobileStockHistoryListProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

export function MobileStockHistoryList({ user: _ }: MobileStockHistoryListProps) {
  const [filters, setFilters] = useState({
    search: '',
    supplier: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 500);
  const isSearching = filters.search !== debouncedSearchTerm;

  const {
    data: stockHistoryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'stock-history',
      {
        search: debouncedSearchTerm,
        sort: filters.sortBy,
        order: filters.sortOrder,
        supplier: filters.supplier,
        page: pagination.page,
        limit: pagination.limit,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(filters.supplier !== 'all' && { supplier: filters.supplier }),
      });

      const response = await fetch(`/api/stock-additions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock history');
      }
      return response.json();
    },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      return response.json();
    },
  });

  // Extract data
  const stockHistory = stockHistoryData?.data || [];
  const suppliers = suppliersData?.data || [];
  const apiPagination = stockHistoryData?.pagination;

  // Update pagination from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages: apiPagination?.totalPages || pagination.totalPages,
    totalItems: apiPagination?.total || 0,
  };

  if (error) {
    toast.error('Failed to load stock history');
  }

  // Column configuration with bold headers
  const columns = useMemo(
    () => [
      {
        key: 'product',
        label: 'Product',
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'quantity',
        label: 'Quantity',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'costPerUnit',
        label: 'Cost/Unit',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'totalCost',
        label: 'Total Cost',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'supplier',
        label: 'Supplier',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'purchaseDate',
        label: 'Purchase Date',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'referenceNumber',
        label: 'Reference #',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'createdBy',
        label: 'Added By',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'createdAt',
        label: 'Date Added',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter(col => col.defaultVisible).map(col => col.key)
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'supplier',
        label: 'Supplier',
        type: 'select',
        options: [
          { value: 'all', label: 'All Suppliers' },
          ...suppliers.map((supplier: any) => ({
            value: supplier.id,
            label: supplier.name,
          })),
        ],
        placeholder: 'All Suppliers',
      },
    ],
    [suppliers]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => {
      if (prev[key as keyof typeof prev] === value) return prev;
      return { ...prev, [key]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      supplier: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle pagination
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

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    }));
  }, []);

  // Sort options
  const sortOptions = useMemo(
    () => [
      { value: 'createdAt-desc', label: 'Newest First' },
      { value: 'createdAt-asc', label: 'Oldest First' },
      { value: 'quantity-desc', label: 'Quantity (High to Low)' },
      { value: 'quantity-asc', label: 'Quantity (Low to High)' },
      { value: 'totalCost-desc', label: 'Cost (High to Low)' },
      { value: 'totalCost-asc', label: 'Cost (Low to High)' },
      { value: 'purchaseDate-desc', label: 'Purchase Date (Recent)' },
      { value: 'purchaseDate-asc', label: 'Purchase Date (Oldest)' },
    ],
    []
  );

  // Get stock change badge
  const getStockChangeBadge = useCallback((item: StockHistoryItem) => {
    const change = item.quantity;
    if (change > 0) {
      return <Badge className="bg-green-100 text-green-700 text-xs">+{change}</Badge>;
    } else if (change < 0) {
      return <Badge className="bg-red-100 text-red-700 text-xs">{change}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{change}</Badge>;
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (item: StockHistoryItem, columnKey: string) => {
      switch (columnKey) {
        case 'product':
          return (
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">
                {item.product.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                SKU: {item.product.sku}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.product.category}
              </div>
            </div>
          );
        case 'quantity':
          return (
            <div className="flex items-center gap-2">
              {getStockChangeBadge(item)}
              {item.previousStock !== undefined && item.newStock !== undefined && (
                <span className="text-xs text-muted-foreground">
                  ({item.previousStock} → {item.newStock})
                </span>
              )}
            </div>
          );
        case 'costPerUnit':
          return (
            <span className="text-xs sm:text-sm font-medium">
              {formatCurrency(item.costPerUnit)}
            </span>
          );
        case 'totalCost':
          return (
            <span className="text-xs sm:text-sm font-semibold text-green-600">
              {formatCurrency(item.totalCost)}
            </span>
          );
        case 'supplier':
          return (
            <span className="text-xs sm:text-sm">
              {item.supplier?.name || 'Direct'}
            </span>
          );
        case 'purchaseDate':
          return (
            <div>
              <div className="text-xs sm:text-sm">
                {format(new Date(item.purchaseDate), 'MMM dd, yyyy')}
              </div>
            </div>
          );
        case 'referenceNumber':
          return (
            <span className="font-mono text-xs sm:text-sm">
              {item.referenceNumber || '-'}
            </span>
          );
        case 'createdBy':
          return (
            <span className="text-xs sm:text-sm">
              {item.createdBy.name}
            </span>
          );
        case 'createdAt':
          return (
            <div>
              <div className="text-xs sm:text-sm">
                {format(new Date(item.createdAt), 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(item.createdAt), 'HH:mm')}
              </div>
            </div>
          );
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getStockChangeBadge]
  );

  // Render actions function
  const renderActions = useCallback(
    (item: StockHistoryItem) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem className="flex items-center gap-2">
            <IconDownload className="h-4 w-4" />
            Export Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    []
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (item: StockHistoryItem) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
        <IconTrendingUp className="h-5 w-5 text-green-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {item.product.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (item: StockHistoryItem) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconCalendar className="h-3 w-3" />
      <span>{format(new Date(item.purchaseDate), 'MMM dd, yyyy')}</span>
      <span>•</span>
      <IconShoppingCart className="h-3 w-3" />
      <span>Qty: {item.quantity}</span>
      <span>•</span>
      <span className="font-semibold text-green-600">
        {formatCurrency(item.totalCost)}
      </span>
      {item.supplier && (
        <>
          <span>•</span>
          <span className="truncate">{item.supplier.name}</span>
        </>
      )}
    </div>
  );

  return (
    <DashboardPageLayout
      title="Stock History"
      description="View all stock addition and adjustment history"
      actions={
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <IconHistory className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Refresh</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Mobile-optimized Filters */}
        <MobileDashboardFiltersBar
          searchPlaceholder="Search stock history..."
          searchValue={filters.search}
          onSearchChange={value => handleFilterChange('search', value)}
          isSearching={isSearching}
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          sortOptions={sortOptions}
          currentSort={`${filters.sortBy}-${filters.sortOrder}`}
          onSortChange={handleSortChange}
        />

        {/* Mobile-optimized Table */}
        <MobileDashboardTable
          tableTitle="Stock History"
          totalCount={currentPagination.totalItems}
          currentCount={stockHistory.length}
          columns={columns}
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
          columnCustomizerKey="stock-history-visible-columns"
          data={stockHistory}
          renderCell={renderCell}
          renderActions={renderActions}
          pagination={currentPagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          isRefetching={stockHistoryData && isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyStateIcon={
            <IconHistory className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          }
          emptyStateMessage="No stock history found"
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          keyExtractor={item => item.id}
        />
      </div>
    </DashboardPageLayout>
  );
}