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
import { Separator } from '@/components/ui/separator';
import {
  IconEye,
  IconDownload,
  IconRefresh,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconReceipt,
  IconTag,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { InventoryPageLayout } from '@/components/inventory/InventoryPageLayout';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import type { FilterConfig } from '@/components/layouts/DashboardFiltersBar';
import {
  ReceiptPrinter,
  type ReceiptData,
} from '@/components/pos/ReceiptPrinter';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface TransactionItem {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  coupon?: {
    id: number;
    code: string;
    name: string;
    type: string;
    value: number;
  } | null;
}

interface Transaction {
  id: number;
  transactionNumber: string;
  staffId: number;
  staffName: string;
  customerId?: number;
  customerName?: string;
  customerEmail: string | null;
  customerPhone?: string;
  customer?: {
    billingAddress?: string;
    city?: string;
    state?: string;
  };
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  fees?: Array<{
    type: string;
    description?: string;
    amount: number;
  }>;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionListProps {
  user: User;
}

export function TransactionList({ user: _ }: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment: '',
    date: '',
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 500);
  const isSearching = filters.search !== debouncedSearchTerm;

  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'transactions',
      debouncedSearchTerm,
      filters.status,
      filters.payment,
      filters.date,
      pagination.page,
      pagination.limit,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filters.status && filters.status !== 'all')
        params.append('status', filters.status);
      if (filters.payment && filters.payment !== 'all')
        params.append('payment', filters.payment);
      if (filters.date && filters.date !== 'all')
        params.append('date', filters.date);
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.limit));

      const response = await fetch(`/api/pos/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Extract transactions array from API response
  const transactions = transactionData?.transactions || [];
  const apiPagination = transactionData?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages: apiPagination?.totalPages || pagination.totalPages,
    totalItems: apiPagination?.total || 0,
  };

  if (error) {
    toast.error('Failed to load transactions');
  }

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'transactionNumber',
        label: 'Transaction #',
        defaultVisible: true,
        required: true,
      },
      {
        key: 'date',
        label: 'Date & Time',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'staff',
        label: 'Staff',
        defaultVisible: true,
      },
      {
        key: 'customer',
        label: 'Customer',
        defaultVisible: true,
      },
      {
        key: 'items',
        label: 'Items',
        defaultVisible: true,
      },
      {
        key: 'payment',
        label: 'Payment',
        defaultVisible: true,
      },
      {
        key: 'total',
        label: 'Total',
        defaultVisible: true,
        required: true,
      },
      {
        key: 'status',
        label: 'Status',
        defaultVisible: true,
      },
    ],
    []
  );

  // Initialize visible columns
  const defaultVisibleColumns = useMemo(
    () => columns.filter(col => col.defaultVisible).map(col => col.key),
    [columns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'completed', label: 'Completed' },
          { value: 'pending', label: 'Pending' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
        placeholder: 'All Status',
      },
      {
        key: 'payment',
        label: 'Payment Method',
        type: 'select',
        options: [
          { value: 'cash', label: 'Cash' },
          { value: 'card', label: 'Card' },
          { value: 'transfer', label: 'Bank Transfer' },
          { value: 'mobile', label: 'Mobile Money' },
        ],
        placeholder: 'All Payments',
      },
      {
        key: 'date',
        label: 'Date Range',
        type: 'select',
        options: [
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
        ],
        placeholder: 'All Dates',
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => {
      if (prev[key as keyof typeof prev] === value) return prev;
      return { ...prev, [key]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      payment: '',
      date: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  // Convert transaction to receipt data format
  const convertToReceiptData = useCallback(
    (transaction: Transaction): ReceiptData => {
      return {
        id: transaction.id.toString(),
        transactionNumber: transaction.transactionNumber,
        timestamp: transaction.createdAt
          ? new Date(transaction.createdAt)
          : new Date(),
        staffName: transaction.staffName || '',
        customerName: transaction.customerName || '',
        customerPhone: transaction.customerPhone || '',
        customerEmail: transaction.customerEmail || '',
        customerAddress: transaction.customer?.billingAddress || '',
        customerCity: transaction.customer?.city || '',
        customerState: transaction.customer?.state || '',
        fees: transaction.fees || [],
        items: transaction.items.map(item => ({
          id: item.productId,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          category: '',
          coupon: item.coupon || null,
        })),
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
      };
    },
    []
  );

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <IconCheck className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <IconClock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800">
            <IconX className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <IconAlertTriangle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
    }
  }, []);

  // Get payment method icon
  const getPaymentIcon = useCallback((method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <IconCash className="h-4 w-4 text-green-600" />;
      case 'card':
        return <IconCreditCard className="h-4 w-4 text-blue-600" />;
      case 'transfer':
        return <IconBuildingBank className="h-4 w-4 text-purple-600" />;
      case 'mobile':
        return <IconDeviceMobile className="h-4 w-4 text-orange-600" />;
      default:
        return <IconCash className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (transaction: Transaction, columnKey: string) => {
      switch (columnKey) {
        case 'transactionNumber':
          return (
            <span className="font-mono">{transaction.transactionNumber}</span>
          );
        case 'date':
          return (
            <div>
              <div className="font-medium">
                {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
              </div>
              <div className="text-muted-foreground text-sm">
                {format(new Date(transaction.createdAt), 'HH:mm')}
              </div>
            </div>
          );
        case 'staff':
          return <span>{transaction.staffName}</span>;
        case 'customer':
          return <span>{transaction.customerName || 'Walk-in Customer'}</span>;
        case 'items':
          return (
            <Badge variant="outline" className="text-xs">
              {transaction.items.length} items
            </Badge>
          );
        case 'payment':
          return (
            <div className="flex items-center gap-2">
              {getPaymentIcon(transaction.paymentMethod)}
              <span className="capitalize">{transaction.paymentMethod}</span>
            </div>
          );
        case 'total':
          return (
            <span className="font-semibold">
              {formatCurrency(transaction.total)}
            </span>
          );
        case 'status':
          return getStatusBadge(transaction.paymentStatus);
        default:
          return null;
      }
    },
    [getStatusBadge, getPaymentIcon]
  );

  // Render actions function
  const renderActions = useCallback(
    (transaction: Transaction) => {
      return (
        <div className="flex items-center gap-2">
          {/* View Details Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <IconEye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Transaction Details - {transaction.transactionNumber}
                </DialogTitle>
              </DialogHeader>
              {selectedTransaction && (
                <TransactionDetailsContent
                  transaction={selectedTransaction}
                  receiptData={convertToReceiptData(selectedTransaction)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Print Receipt Button */}
          <ReceiptPrinter
            receiptData={convertToReceiptData(transaction)}
            size="sm"
            variant="ghost"
            showEmailOption={!!transaction.customerEmail}
          />
        </div>
      );
    },
    [selectedTransaction, convertToReceiptData]
  );

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Transactions"
        description="View and manage all POS transactions"
        actions={
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
        // Filters
        searchPlaceholder="Search transactions..."
        searchValue={filters.search}
        onSearchChange={value => handleFilterChange('search', value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Transactions"
        totalCount={currentPagination.totalItems}
        currentCount={transactions.length}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="transactions-visible-columns"
        data={transactions}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={isLoading}
        isRefetching={transactionData && isLoading}
        error={error?.message}
        onRetry={() => refetch()}
        // Empty state
        emptyStateIcon={<IconReceipt className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm ||
          filters.status ||
          filters.payment ||
          filters.date
            ? 'No transactions found matching your filters.'
            : 'No transactions found.'
        }
      />
    </>
  );
}

// Transaction Details Component
function TransactionDetailsContent({
  transaction,
  receiptData,
}: {
  transaction: Transaction;
  receiptData: ReceiptData;
}) {
  return (
    <div className="space-y-6">
      {/* Transaction Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Transaction #
          </label>
          <p className="font-mono">{transaction.transactionNumber}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Date
          </label>
          <p>{format(new Date(transaction.createdAt), 'PPP p')}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Staff
          </label>
          <p>{transaction.staffName}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Customer
          </label>
          <p>{transaction.customerName || 'Walk-in Customer'}</p>
        </div>
      </div>

      <Separator />

      {/* Items */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Items</h4>
        <div className="space-y-2">
          {transaction.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground text-sm">SKU: {item.sku}</p>
                {item.coupon && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      <IconTag className="mr-1 h-3 w-3" />
                      {item.coupon.code}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.coupon.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {item.quantity} × {formatCurrency(item.price)}
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(item.total)}
                </p>
                {item.coupon && (
                  <p className="text-xs text-green-600">
                    {item.coupon.type === 'PERCENTAGE'
                      ? `${item.coupon.value}% off`
                      : `${formatCurrency(item.coupon.value)} off`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>
        {transaction.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount:</span>
            <span>-{formatCurrency(transaction.discount)}</span>
          </div>
        )}

        {/* Custom Fees */}
        {transaction.fees && transaction.fees.length > 0 && (
          <>
            {transaction.fees.map((fee, index: number) => (
              <div key={index} className="flex justify-between text-orange-600">
                <span>
                  {fee.type}
                  {fee.description ? ` (${fee.description})` : ''}:
                </span>
                <span>{formatCurrency(fee.amount)}</span>
              </div>
            ))}
          </>
        )}

        <Separator />
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>{formatCurrency(transaction.total)}</span>
        </div>
      </div>

      <Separator />

      {/* Payment Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Payment Method
          </label>
          <p className="capitalize">{transaction.paymentMethod}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Status
          </label>
          <p className="capitalize">{transaction.paymentStatus}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <ReceiptPrinter
          receiptData={receiptData}
          showEmailOption={!!transaction.customerEmail}
        />
        <Button variant="outline">
          <IconDownload className="mr-2 h-4 w-4" />
          Download Receipt
        </Button>
      </div>
    </div>
  );
}
