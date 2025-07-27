'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import type { FilterConfig } from '@/components/layouts/DashboardFiltersBar';

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
  phone: string;
  totalSpend: number;
  orders: number;
  lastOrder: string;
  status: 'active' | 'inactive' | 'vip';
  createdAt: string;
}

export function CustomerList({ user: _ }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [_sortBy, _setSortBy] = useState('name');

  // Mock data - replace with actual API calls
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Alebiosu Dolapo',
      email: 'dolapo@example.com',
      phone: '+234 801 234 5678',
      totalSpend: 104500,
      orders: 1,
      lastOrder: '2025-07-26',
      status: 'active',
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+234 802 345 6789',
      totalSpend: 85000,
      orders: 3,
      lastOrder: '2025-07-20',
      status: 'vip',
      createdAt: '2024-12-10',
    },
    {
      id: '3',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+234 803 456 7890',
      totalSpend: 45000,
      orders: 2,
      lastOrder: '2025-07-15',
      status: 'active',
      createdAt: '2025-02-20',
    },
  ];

  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter(customer => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [mockCustomers, searchTerm, statusFilter]);

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      switch (_sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalSpend':
          return b.totalSpend - a.totalSpend;
        case 'orders':
          return b.orders - a.orders;
        case 'lastOrder':
          return (
            new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime()
          );
        default:
          return 0;
      }
    });
  }, [filteredCustomers, _sortBy]);

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
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
        key: 'totalSpend',
        label: 'Total Spend',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'orders',
        label: 'Orders',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'lastOrder',
        label: 'Last Order',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
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
          { value: 'active', label: 'Active' },
          { value: 'vip', label: 'VIP' },
          { value: 'inactive', label: 'Inactive' },
        ],
        placeholder: 'All Status',
      },
    ],
    []
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: Math.ceil(sortedCustomers.length / 10),
    totalItems: sortedCustomers.length,
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'status') {
      setStatusFilter(value as string);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  // Render cell content
  const renderCell = (customer: Customer, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <span className="font-medium">{customer.name}</span>;
      case 'email':
        return customer.email;
      case 'phone':
        return customer.phone;
      case 'totalSpend':
        return formatCurrency(customer.totalSpend);
      case 'orders':
        return customer.orders.toString();
      case 'lastOrder':
        return new Date(customer.lastOrder).toLocaleDateString();
      case 'status':
        return (
          <Badge
            variant={
              customer.status === 'vip'
                ? 'default'
                : customer.status === 'active'
                  ? 'secondary'
                  : 'outline'
            }
            className={
              customer.status === 'vip'
                ? 'bg-purple-100 text-purple-800'
                : customer.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
            }
          >
            {customer.status.toUpperCase()}
          </Badge>
        );
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

  return (
    <DashboardTableLayout
      title="Customers"
      description="Manage customer information and view customer analytics"
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
      data={sortedCustomers}
      renderCell={renderCell}
      renderActions={renderActions}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      emptyStateMessage="No customers found"
      totalCount={sortedCustomers.length}
      currentCount={sortedCustomers.length}
    />
  );
}
