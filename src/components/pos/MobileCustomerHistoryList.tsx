'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  IconSearch,
  IconUser,
  IconMail,
  IconPhone,
  IconEye,
  IconShoppingBag,
  IconCalendar,
  IconCurrencyNaira,
  IconDots,
  IconUsers,
} from '@tabler/icons-react';

import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomerDetailView } from './CustomerDetailView';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  averageOrderValue: number;
  rank: number;
}

interface User {
  id: string;
  role: string;
  status: string;
}

interface MobileCustomerHistoryListProps {
  user: User;
}

// API function to fetch customers
async function fetchCustomers(): Promise<CustomerData[]> {
  const response = await fetch('/api/pos/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

export function MobileCustomerHistoryList({ user }: MobileCustomerHistoryListProps) {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'totalSpent',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  const {
    data: customers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  // Filter and sort customers
  const processedCustomers = useMemo(() => {
    let filtered = customers.filter(
      customer =>
        customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.phone?.includes(debouncedSearchTerm)
    );

    // Sort customers
    filtered = filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof CustomerData];
      const bValue = b[filters.sortBy as keyof CustomerData];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [customers, debouncedSearchTerm, filters.sortBy, filters.sortOrder]);

  // Paginate customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return processedCustomers.slice(startIndex, endIndex);
  }, [processedCustomers, pagination.page, pagination.limit]);

  // Update pagination when filtered data changes
  React.useEffect(() => {
    const totalPages = Math.ceil(processedCustomers.length / pagination.limit);
    setPagination(prev => ({
      ...prev,
      totalPages,
      totalItems: processedCustomers.length,
    }));
  }, [processedCustomers.length, pagination.limit]);

  if (error) {
    toast.error('Failed to load customers');
  }

  // Column configuration with bold headers
  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Customer',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'email',
        label: 'Email',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'phone',
        label: 'Phone',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'totalSpent',
        label: 'Total Spent',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'totalOrders',
        label: 'Total Orders',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'averageOrderValue',
        label: 'Avg Order',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'lastPurchase',
        label: 'Last Purchase',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'rank',
        label: 'Rank',
        sortable: true,
        defaultVisible: false,
        className: 'font-bold',
      },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter(col => col.defaultVisible).map(col => col.key)
  );

  // Filter configurations (empty since we only have search)
  const filterConfigs: FilterConfig[] = [];

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      sortBy: 'totalSpent',
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
      { value: 'totalSpent-desc', label: 'Highest Spender' },
      { value: 'totalSpent-asc', label: 'Lowest Spender' },
      { value: 'totalOrders-desc', label: 'Most Orders' },
      { value: 'totalOrders-asc', label: 'Least Orders' },
      { value: 'name-asc', label: 'Name (A-Z)' },
      { value: 'name-desc', label: 'Name (Z-A)' },
      { value: 'lastPurchase-desc', label: 'Recent Purchase' },
      { value: 'lastPurchase-asc', label: 'Oldest Purchase' },
      { value: 'averageOrderValue-desc', label: 'Highest Avg Order' },
      { value: 'averageOrderValue-asc', label: 'Lowest Avg Order' },
    ],
    []
  );

  const handleViewCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setCustomerDetailOpen(true);
  };

  // Get customer rank badge
  const getCustomerRankBadge = useCallback((rank: number) => {
    if (rank <= 10) {
      return <Badge className="bg-gold-100 text-gold-700 text-xs">Top {rank}</Badge>;
    } else if (rank <= 50) {
      return <Badge className="bg-silver-100 text-silver-700 text-xs">Rank {rank}</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">#{rank}</Badge>;
    }
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (customer: CustomerData, columnKey: string) => {
      switch (columnKey) {
        case 'name':
          return (
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">
                {customer.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {customer.email}
              </div>
            </div>
          );
        case 'email':
          return (
            <span className="text-xs sm:text-sm truncate">
              {customer.email}
            </span>
          );
        case 'phone':
          return (
            <span className="text-xs sm:text-sm">
              {customer.phone || '-'}
            </span>
          );
        case 'totalSpent':
          return (
            <span className="font-semibold text-green-600 text-xs sm:text-sm">
              {formatCurrency(customer.totalSpent)}
            </span>
          );
        case 'totalOrders':
          return (
            <span className="font-medium text-xs sm:text-sm">
              {customer.totalOrders}
            </span>
          );
        case 'averageOrderValue':
          return (
            <span className="text-xs sm:text-sm">
              {formatCurrency(customer.averageOrderValue)}
            </span>
          );
        case 'lastPurchase':
          return (
            <div>
              <div className="text-xs sm:text-sm">
                {format(new Date(customer.lastPurchase), 'MMM dd, yyyy')}
              </div>
            </div>
          );
        case 'rank':
          return getCustomerRankBadge(customer.rank);
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getCustomerRankBadge]
  );

  // Render actions function
  const renderActions = useCallback(
    (customer: CustomerData) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() => handleViewCustomer(customer)}
                className="flex items-center gap-2"
              >
                <IconEye className="h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customer Details - {customer.name}</DialogTitle>
              </DialogHeader>
              {selectedCustomer && (
                <CustomerDetailView
                  customer={selectedCustomer}
                  user={user}
                />
              )}
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [selectedCustomer, user]
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (customer: CustomerData) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
        <IconUser className="h-5 w-5 text-blue-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {customer.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (customer: CustomerData) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconMail className="h-3 w-3" />
      <span className="truncate">{customer.email}</span>
      <span>•</span>
      <IconShoppingBag className="h-3 w-3" />
      <span>{customer.totalOrders} orders</span>
      <span>•</span>
      <span className="font-semibold text-green-600">
        {formatCurrency(customer.totalSpent)}
      </span>
      <span>•</span>
      <IconCalendar className="h-3 w-3" />
      <span>{format(new Date(customer.lastPurchase), 'MMM dd')}</span>
    </div>
  );

  return (
    <>
      <DashboardPageLayout
        title="Customer History"
        description="View customer purchase history and analytics"
        actions={
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <IconUsers className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Mobile-optimized Filters */}
          <MobileDashboardFiltersBar
            searchPlaceholder="Search customers..."
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
            tableTitle="Customer History"
            totalCount={pagination.totalItems}
            currentCount={paginatedCustomers.length}
            columns={columns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="customer-history-visible-columns"
            data={paginatedCustomers}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
            error={error?.message}
            onRetry={() => refetch()}
            emptyStateIcon={
              <IconUsers className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No customers found"
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={customer => customer.id}
          />
        </div>
      </DashboardPageLayout>

      {/* Customer Detail Dialog */}
      <Dialog open={customerDetailOpen} onOpenChange={setCustomerDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerDetailView
              customer={selectedCustomer}
              user={user}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}