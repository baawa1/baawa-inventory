'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconDots, IconUser, IconMail, IconPhone, IconCalendar } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MobileCustomerListProps {
  user: User;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  customerType?: string;
  billingAddress?: string;
  shippingAddress?: string;
  notes?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  averageOrderValue: number;
  rank: number;
  firstPurchase: string;
  daysSinceLastPurchase: number;
  customerLifetimeValue: number;
  purchaseFrequency: number;
}

// API function to fetch customers
async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch('/api/pos/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  const result = await response.json();
  return result || [];
}

// API function to update customer
async function updateCustomer(
  customerEmail: string,
  data: Partial<Customer>
): Promise<Customer> {
  const encodedEmail = encodeURIComponent(customerEmail);
  const response = await fetch(`/api/pos/customers/${encodedEmail}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update customer');
  }

  return response.json();
}

export function MobileCustomerList({ user }: MobileCustomerListProps) {
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    customerType: '',
    sortBy: 'totalSpent',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    customerType: '',
    billingAddress: '',
    shippingAddress: '',
    notes: '',
  });

  // Fetch customers
  const {
    data: customers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: ({ email, data }: { email: string; data: Partial<Customer> }) =>
      updateCustomer(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      setEditDialogOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });

  // Filter and sort customers
  const processedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        customer.phone?.includes(debouncedSearchTerm);
      
      const matchesType = !filters.customerType || customer.customerType === filters.customerType;
      
      return matchesSearch && matchesType;
    });

    // Sort customers
    filtered = filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Customer];
      const bValue = b[filters.sortBy as keyof Customer];
      
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
  }, [customers, debouncedSearchTerm, filters.customerType, filters.sortBy, filters.sortOrder]);

  // Paginate customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return processedCustomers.slice(startIndex, endIndex);
  }, [processedCustomers, pagination.page, pagination.limit]);

  // Update pagination when filtered data changes
  useEffect(() => {
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
        key: 'customerType',
        label: 'Type',
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
        label: 'Orders',
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
        key: 'city',
        label: 'City',
        defaultVisible: false,
        className: 'font-bold',
      },
      {
        key: 'state',
        label: 'State',
        defaultVisible: false,
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
        key: 'customerType',
        label: 'Customer Type',
        type: 'select',
        options: [
          { value: '', label: 'All Types' },
          { value: 'REGULAR', label: 'Regular' },
          { value: 'VIP', label: 'VIP' },
          { value: 'WHOLESALE', label: 'Wholesale' },
        ],
        placeholder: 'All Types',
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      customerType: '',
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

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || '',
      customerType: customer.customerType || '',
      billingAddress: customer.billingAddress || '',
      shippingAddress: customer.shippingAddress || '',
      notes: customer.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer) return;
    
    updateCustomerMutation.mutate({
      email: selectedCustomer.email,
      data: editFormData,
    });
  };

  // Get customer type badge
  const getCustomerTypeBadge = useCallback((type?: string) => {
    switch (type) {
      case 'VIP':
        return <Badge className="bg-gold-100 text-gold-700 text-xs">VIP</Badge>;
      case 'WHOLESALE':
        return <Badge className="bg-purple-100 text-purple-700 text-xs">Wholesale</Badge>;
      case 'REGULAR':
        return <Badge variant="secondary" className="text-xs">Regular</Badge>;
      default:
        return type ? <Badge variant="outline" className="text-xs">{type}</Badge> : <span className="text-xs">-</span>;
    }
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (customer: Customer, columnKey: string) => {
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
        case 'customerType':
          return getCustomerTypeBadge(customer.customerType);
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
        case 'city':
          return (
            <span className="text-xs sm:text-sm">
              {customer.city || '-'}
            </span>
          );
        case 'state':
          return (
            <span className="text-xs sm:text-sm">
              {customer.state || '-'}
            </span>
          );
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getCustomerTypeBadge]
  );

  // Check if user can manage customers
  const canManageCustomers = user.role === 'ADMIN' || user.role === 'MANAGER';

  // Render actions function
  const renderActions = useCallback(
    (customer: Customer) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {canManageCustomers && (
            <DropdownMenuItem
              onClick={() => handleEditCustomer(customer)}
              className="flex items-center gap-2"
            >
              <IconEdit className="h-4 w-4" />
              Edit Customer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [canManageCustomers]
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (customer: Customer) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
        <IconUser className="h-5 w-5 text-blue-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {customer.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (customer: Customer) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconMail className="h-3 w-3" />
      <span className="truncate">{customer.email}</span>
      {customer.phone && (
        <>
          <span>•</span>
          <IconPhone className="h-3 w-3" />
          <span>{customer.phone}</span>
        </>
      )}
      <span>•</span>
      <span className="font-semibold text-green-600">
        {formatCurrency(customer.totalSpent)}
      </span>
      <span>•</span>
      <span>{customer.totalOrders} orders</span>
    </div>
  );

  return (
    <>
      <DashboardPageLayout
        title="Customer Management"
        description="Manage customer information and purchase history"
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
            tableTitle="Customers"
            totalCount={pagination.totalItems}
            currentCount={paginatedCustomers.length}
            columns={columns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="customers-visible-columns"
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
              <IconUser className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No customers found"
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={customer => customer.id}
          />
        </div>
      </DashboardPageLayout>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              Update customer information and details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editFormData.phone}
                  onChange={e => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="customerType">Customer Type</Label>
                <Select
                  value={editFormData.customerType}
                  onValueChange={value => setEditFormData(prev => ({ ...prev, customerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editFormData.city}
                  onChange={e => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editFormData.state}
                  onChange={e => setEditFormData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={editFormData.country}
                  onChange={e => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editFormData.notes}
                onChange={e => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCustomer}
              disabled={updateCustomerMutation.isPending}
            >
              {updateCustomerMutation.isPending ? 'Updating...' : 'Update Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}