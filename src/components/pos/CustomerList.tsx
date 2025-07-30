'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import type { FilterConfig } from '@/components/layouts/DashboardFiltersBar';
import { toast } from 'sonner';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface CustomerListProps {
  user: User;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  const response = await fetch('/api/pos/analytics/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  const result = await response.json();
  return result.data?.customers || [];
}

export function CustomerList({ user: _ }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customers-list'],
    queryFn: fetchCustomers,
  });

  if (error) {
    toast.error('Failed to load customers');
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm);

      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'vip')
          return customer.rank <= Math.ceil(customers.length * 0.1);
        if (statusFilter === 'regular')
          return (
            customer.rank > Math.ceil(customers.length * 0.1) &&
            customer.rank <= Math.ceil(customers.length * 0.5)
          );
        if (statusFilter === 'occasional')
          return (
            customer.rank > Math.ceil(customers.length * 0.5) &&
            customer.rank <= Math.ceil(customers.length * 0.8)
          );
        if (statusFilter === 'inactive')
          return customer.rank > Math.ceil(customers.length * 0.8);
        return true;
      })();

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'totalOrders':
          return b.totalOrders - a.totalOrders;
        case 'lastPurchase':
          return (
            new Date(b.lastPurchase).getTime() -
            new Date(a.lastPurchase).getTime()
          );
        case 'averageOrderValue':
          return b.averageOrderValue - a.averageOrderValue;
        default:
          return 0;
      }
    });
  }, [filteredCustomers, sortBy]);

  // Pagination logic
  const totalItems = sortedCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCustomers = sortedCustomers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'rank',
        label: 'Rank',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'name',
        label: 'Customer Name',
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
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'totalSpent',
        label: 'Total Spent',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'totalOrders',
        label: 'Orders',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'averageOrderValue',
        label: 'Avg Order',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'lastPurchase',
        label: 'Last Purchase',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        defaultVisible: true,
      },
    ],
    []
  );

  const [visibleColumns] = useState<string[]>(
    columns.filter(col => col.defaultVisible).map(col => col.key)
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'all', label: 'All Customers' },
          { value: 'vip', label: 'VIP (Top 10%)' },
          { value: 'regular', label: 'Regular (Top 50%)' },
          { value: 'occasional', label: 'Occasional (Top 80%)' },
          { value: 'inactive', label: 'Inactive (Bottom 20%)' },
        ],
        placeholder: 'All Status',
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'status') {
      setStatusFilter(value as string);
    }
    setCurrentPage(1);
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSortChange = (sortValue: string) => {
    const [field, order] = sortValue.split('-');
    setSortBy(field);
  };

  // Render cell content
  const renderCell = (customer: Customer, columnKey: string) => {
    switch (columnKey) {
      case 'rank':
        return <Badge variant="outline">#{customer.rank}</Badge>;
      case 'name':
        return <span className="font-medium">{customer.name}</span>;
      case 'email':
        return customer.email;
      case 'phone':
        return customer.phone || 'N/A';
      case 'totalSpent':
        return formatCurrency(customer.totalSpent);
      case 'totalOrders':
        return customer.totalOrders.toString();
      case 'averageOrderValue':
        return formatCurrency(customer.averageOrderValue);
      case 'lastPurchase':
        return new Date(customer.lastPurchase).toLocaleDateString();
      case 'status':
        const getStatusBadge = () => {
          const totalCustomers = customers.length;
          if (customer.rank <= Math.ceil(totalCustomers * 0.1)) {
            return <Badge className="bg-purple-100 text-purple-800">VIP</Badge>;
          } else if (customer.rank <= Math.ceil(totalCustomers * 0.5)) {
            return (
              <Badge className="bg-green-100 text-green-800">Regular</Badge>
            );
          } else if (customer.rank <= Math.ceil(totalCustomers * 0.8)) {
            return (
              <Badge className="bg-yellow-100 text-yellow-800">
                Occasional
              </Badge>
            );
          } else {
            return (
              <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
            );
          }
        };
        return getStatusBadge();
      default:
        return null;
    }
  };

  // Render actions
  const renderActions = (_customer: Customer) => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm">
        <IconEye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <IconEdit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <IconTrash className="h-4 w-4" />
      </Button>
    </div>
  );

  // Pagination object for DashboardTableLayout
  const pagination = {
    page: currentPage,
    limit: pageSize,
    totalPages,
    totalItems,
  };

  return (
    <DashboardTableLayout
      title="Customer Management"
      description="Manage and view all customer information"
      actions={
        <Button className="gap-2">
          <IconPlus className="h-4 w-4" />
          Add Customer
        </Button>
      }
      searchPlaceholder="Search customers..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterConfigs}
      filterValues={{ status: statusFilter }}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      columns={columns}
      visibleColumns={visibleColumns}
      data={paginatedCustomers}
      renderCell={renderCell}
      renderActions={renderActions}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      emptyStateMessage="No customers found"
      totalCount={totalItems}
      currentCount={paginatedCustomers.length}
      isLoading={isLoading}
      sortOptions={[
        { value: 'totalSpent-desc', label: 'Total Spent (High to Low)' },
        { value: 'totalSpent-asc', label: 'Total Spent (Low to High)' },
        { value: 'totalOrders-desc', label: 'Orders (High to Low)' },
        { value: 'totalOrders-asc', label: 'Orders (Low to High)' },
        { value: 'averageOrderValue-desc', label: 'Avg Order (High to Low)' },
        { value: 'averageOrderValue-asc', label: 'Avg Order (Low to High)' },
        { value: 'lastPurchase-desc', label: 'Last Purchase (Recent)' },
        { value: 'lastPurchase-asc', label: 'Last Purchase (Oldest)' },
        { value: 'name-asc', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' },
      ]}
      currentSort={`${sortBy}-desc`}
      onSortChange={handleSortChange}
    />
  );
}
