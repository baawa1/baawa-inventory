'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconEdit, IconTrash, IconMinus } from '@tabler/icons-react';
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

interface CouponListProps {
  user: User;
}

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  orders: number;
  amountDiscounted: number;
  created: string;
  expires: string;
  status: 'active' | 'expired' | 'disabled';
}

export function CouponList({ user: _ }: CouponListProps) {
  const [dateRange, setDateRange] = useState('month-to-date');
  const [showFilter, setShowFilter] = useState('all-coupons');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  const mockCoupons: Coupon[] = [
    {
      id: '1',
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      orders: 15,
      amountDiscounted: 25000,
      created: '2025-01-15',
      expires: '2025-12-31',
      status: 'active',
    },
    {
      id: '2',
      code: 'FREESHIP',
      type: 'fixed',
      value: 5000,
      orders: 8,
      amountDiscounted: 40000,
      created: '2025-02-20',
      expires: '2025-08-31',
      status: 'active',
    },
    {
      id: '3',
      code: 'WELCOME20',
      type: 'percentage',
      value: 20,
      orders: 25,
      amountDiscounted: 75000,
      created: '2024-12-01',
      expires: '2025-06-30',
      status: 'expired',
    },
  ];

  const filteredCoupons = useMemo(() => {
    return mockCoupons.filter(coupon => {
      const matchesSearch = coupon.code
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        showFilter === 'all-coupons' || coupon.status === showFilter;
      return matchesSearch && matchesFilter;
    });
  }, [mockCoupons, searchTerm, showFilter]);

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'code',
        label: 'Coupon Code',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'orders',
        label: 'Orders',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'amountDiscounted',
        label: 'Amount Discounted',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'created',
        label: 'Created',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'expires',
        label: 'Expires',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'type',
        label: 'Type',
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
        key: 'dateRange',
        label: 'Date Range',
        type: 'select',
        options: [
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
          { value: 'week-to-date', label: 'Week to date' },
          { value: 'month-to-date', label: 'Month to date' },
          { value: 'quarter-to-date', label: 'Quarter to date' },
          { value: 'year-to-date', label: 'Year to date' },
          { value: 'custom', label: 'Custom range' },
        ],
        placeholder: 'Select date range',
      },
      {
        key: 'showFilter',
        label: 'Show',
        type: 'select',
        options: [
          { value: 'all-coupons', label: 'All coupons' },
          { value: 'active', label: 'Active' },
          { value: 'expired', label: 'Expired' },
          { value: 'disabled', label: 'Disabled' },
        ],
        placeholder: 'Show',
      },
    ],
    []
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: Math.ceil(filteredCoupons.length / 10),
    totalItems: filteredCoupons.length,
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'dateRange') {
      setDateRange(value as string);
    } else if (key === 'showFilter') {
      setShowFilter(value as string);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDateRange('month-to-date');
    setShowFilter('all-coupons');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  // Render cell content
  const renderCell = (coupon: Coupon, columnKey: string) => {
    switch (columnKey) {
      case 'code':
        return <span className="font-mono font-medium">{coupon.code}</span>;
      case 'orders':
        return coupon.orders.toString();
      case 'amountDiscounted':
        return formatCurrency(coupon.amountDiscounted);
      case 'created':
        return new Date(coupon.created).toLocaleDateString();
      case 'expires':
        return new Date(coupon.expires).toLocaleDateString();
      case 'type':
        return (
          <Badge variant="outline" className="capitalize">
            {coupon.type}
          </Badge>
        );
      case 'status':
        return (
          <Badge
            variant={
              coupon.status === 'active'
                ? 'default'
                : coupon.status === 'expired'
                  ? 'secondary'
                  : 'outline'
            }
            className={
              coupon.status === 'active'
                ? 'bg-green-100 text-green-800'
                : coupon.status === 'expired'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
            }
          >
            {coupon.status.toUpperCase()}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render actions
  const renderActions = (_coupon: Coupon) => (
    <div className="flex items-center gap-2">
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
      title="Coupons"
      description="Manage discount coupons and promotional codes"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Compare
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      }
      searchPlaceholder="Search coupons..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterConfigs}
      filterValues={{ dateRange, showFilter }}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      columns={columns}
      visibleColumns={visibleColumns}
      data={filteredCoupons}
      renderCell={renderCell}
      renderActions={renderActions}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      emptyStateMessage="No coupons found"
      totalCount={filteredCoupons.length}
      currentCount={filteredCoupons.length}
    />
  );
}
