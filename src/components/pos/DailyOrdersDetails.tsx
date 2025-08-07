'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  IconEye,
  IconDownload,
  IconRefresh,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import type { FilterConfig } from '@/components/layouts/DashboardFiltersBar';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface DailyOrdersDetailsProps {
  user: User;
  date: string;
}

interface Order {
  id: number;
  transactionNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
  items?: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal?: number;
  discount?: number;
  staffName?: string;
}

interface DailyOrdersResponse {
  orders: Order[];
  date: string;
  totalOrders: number;
  totalAmount: number;
}

const paymentMethodIcons = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuildingBank,
  mobile_money: IconDeviceMobile,
};

async function fetchDailyOrders(date: string): Promise<DailyOrdersResponse> {
  const params = new URLSearchParams();
  params.append('date', date);

  const response = await fetch(`/api/pos/analytics/daily-orders?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch daily orders');
  }
  return response.json();
}

export function DailyOrdersDetails({ user: _, date }: DailyOrdersDetailsProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: 'all',
    customerName: 'all',
  });

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['daily-orders', date],
    queryFn: () => fetchDailyOrders(date),
  });

  if (error) {
    toast.error('Failed to load daily orders');
  }

  const orders = useMemo(() => ordersData?.orders || [], [ordersData?.orders]);

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.transactionNumber
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        (order.customerName &&
          order.customerName
            .toLowerCase()
            .includes(filters.search.toLowerCase()));

      const matchesPaymentMethod =
        filters.paymentMethod === 'all' ||
        order.paymentMethod === filters.paymentMethod;

      return matchesSearch && matchesPaymentMethod;
    });
  }, [orders, filters]);

  // Get unique customers for filters
  const uniqueCustomers = useMemo(
    () => [...new Set(orders.map(order => order.customerName).filter(Boolean))],
    [orders]
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        type: 'select',
        options: [
          { value: 'cash', label: 'Cash' },
          { value: 'pos', label: 'POS' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'mobile_money', label: 'Mobile Money' },
        ],
        placeholder: 'All Methods',
      },
      {
        key: 'customerName',
        label: 'Customer',
        type: 'select',
        options: uniqueCustomers.map(customer => ({
          value: customer!,
          label: customer!,
        })),
        placeholder: 'All Customers',
      },
    ],
    [uniqueCustomers]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      paymentMethod: 'all',
      customerName: 'all',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Table columns configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'transactionNumber',
        label: 'Order #',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'customerName',
        label: 'Customer',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'itemCount',
        label: 'Items',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'createdAt',
        label: 'Time',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        defaultVisible: true,
      },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter(col => col.defaultVisible).map(col => col.key)
  );

  // Render cell function
  const renderCell = useCallback((item: Order, columnKey: string) => {
    switch (columnKey) {
      case 'transactionNumber':
        return (
          <span className="font-mono text-sm">{item.transactionNumber}</span>
        );
      case 'customerName':
        return item.customerName || 'Walk-in Customer';
      case 'itemCount':
        return (
          <span className="text-muted-foreground text-sm">
            {item.itemCount} items
          </span>
        );
      case 'totalAmount':
        return formatCurrency(item.totalAmount);
      case 'paymentMethod':
        const PaymentIcon =
          paymentMethodIcons[
            item.paymentMethod as keyof typeof paymentMethodIcons
          ] || IconCash;
        return (
          <div className="flex items-center gap-2">
            <PaymentIcon className="h-4 w-4" />
            <span className="capitalize">
              {item.paymentMethod.replace('_', ' ')}
            </span>
          </div>
        );
      case 'createdAt':
        return format(new Date(item.createdAt), 'HH:mm:ss');
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrder(item)}
            >
              <IconEye className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, limit: size, page: 1 }));
  }, []);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!ordersData) {
      return {
        totalOrders: 0,
        totalAmount: 0,
        averageOrderValue: 0,
      };
    }

    return {
      totalOrders: ordersData.totalOrders,
      totalAmount: ordersData.totalAmount,
      averageOrderValue:
        ordersData.totalOrders > 0
          ? ordersData.totalAmount / ordersData.totalOrders
          : 0,
    };
  }, [ordersData]);

  // Export functionality
  const exportOrders = useCallback(() => {
    try {
      const csvContent = [
        [
          'Order #',
          'Customer',
          'Items',
          'Total Amount',
          'Payment Method',
          'Time',
        ],
        ...filteredOrders.map(order => [
          order.transactionNumber,
          order.customerName || 'Walk-in Customer',
          order.itemCount.toString(),
          order.totalAmount.toString(),
          order.paymentMethod,
          format(new Date(order.createdAt), 'HH:mm:ss'),
        ]),
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-orders-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Orders exported successfully');
    } catch (_err) {
      toast.error('Failed to export orders');
    }
  }, [filteredOrders, date]);

  // Order details dialog
  const OrderDetailsDialog = ({ order }: { order: Order }) => (
    <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details - {order.transactionNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <p className="text-muted-foreground text-sm">
                {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm:ss')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Customer</label>
              <p className="text-muted-foreground text-sm">
                {order.customerName || 'Walk-in Customer'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <p className="text-muted-foreground text-sm capitalize">
                {order.paymentMethod.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Items Count</label>
              <p className="text-muted-foreground text-sm">
                {order.itemCount} items
              </p>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div>
              <label className="text-sm font-medium">Items</label>
              <div className="mt-2 space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} (x{item.quantity})
                    </span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            {order.subtotal && (
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.discount && order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-muted-foreground text-sm font-medium">
            Total Orders
          </div>
          <div className="text-2xl font-bold">{summaryStats.totalOrders}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-muted-foreground text-sm font-medium">
            Total Amount
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(summaryStats.totalAmount)}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-muted-foreground text-sm font-medium">
            Average Order Value
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(summaryStats.averageOrderValue)}
          </div>
        </div>
      </div>

      <DashboardTableLayout
        title="Daily Orders"
        description={`Orders for ${format(new Date(date), 'MMM dd, yyyy')}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportOrders}>
              <IconDownload className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
        searchPlaceholder="Search by order number or customer..."
        searchValue={filters.search}
        onSearchChange={value => handleFilterChange('search', value)}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="daily-orders-columns"
        data={filteredOrders}
        renderCell={renderCell}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(filteredOrders.length / pagination.limit),
          totalItems: filteredOrders.length,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        error={error?.message}
        onRetry={() => refetch()}
        emptyStateMessage="No orders found for this date"
        totalCount={filteredOrders.length}
        currentCount={filteredOrders.length}
      />

      {selectedOrder && <OrderDetailsDialog order={selectedOrder} />}
    </>
  );
}
