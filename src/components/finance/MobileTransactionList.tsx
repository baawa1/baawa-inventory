'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Icons
import {
  IconFilter,
  IconEye,
  IconDownload,
  IconRefresh,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconDots,
  IconReceipt,
  IconCalendar,
  IconUser,
  IconShoppingCart,
} from '@tabler/icons-react';

import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  transactionNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionType: string;
  createdAt: string;
  staffName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface MobileTransactionListProps {
  user: any;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    paymentMethod?: string;
  };
}

const paymentMethodIcons = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuildingBank,
  mobile_money: IconDeviceMobile,
};

const paymentMethodLabels = {
  cash: 'Cash',
  pos: 'POS Machine',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
};

export function MobileTransactionList({
  user: _user,
  filters = {},
}: MobileTransactionListProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.type && filters.type !== 'all')
      params.append('type', filters.type);
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      params.append('paymentMethod', filters.paymentMethod);
    }

    return params.toString();
  }, [search, currentPage, pageSize, filters]);

  // Fetch transactions
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactions', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/sales?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });

  const transactions = transactionData?.data || [];
  const pagination = transactionData?.pagination || {};

  // Column configuration with bold headers
  const columns = useMemo(
    () => [
      {
        key: 'transactionNumber',
        label: 'Transaction #',
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'customerName',
        label: 'Customer',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'totalAmount',
        label: 'Amount',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'paymentStatus',
        label: 'Status',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'transactionType',
        label: 'Type',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'createdAt',
        label: 'Date',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'staffName',
        label: 'Staff',
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
        key: 'type',
        label: 'Transaction Type',
        type: 'select',
        options: [
          { value: 'all', label: 'All Types' },
          { value: 'sale', label: 'Sale' },
          { value: 'return', label: 'Return' },
          { value: 'exchange', label: 'Exchange' },
        ],
        placeholder: 'All Types',
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        type: 'select',
        options: [
          { value: 'all', label: 'All Methods' },
          { value: 'cash', label: 'Cash' },
          { value: 'pos', label: 'POS Machine' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'mobile_money', label: 'Mobile Money' },
        ],
        placeholder: 'All Methods',
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    // Handle filter changes through the parent component
    // This would typically update the filters prop
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    // Reset filters through parent component
    setCurrentPage(1);
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Get payment method icon
  const getPaymentMethodIcon = useCallback((method: string) => {
    const IconComponent = paymentMethodIcons[method as keyof typeof paymentMethodIcons] || IconCreditCard;
    return <IconComponent className="h-4 w-4" />;
  }, []);

  // Get payment status badge
  const getPaymentStatusBadge = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 text-xs">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  }, []);

  // Get transaction type badge
  const getTransactionTypeBadge = useCallback((type: string) => {
    switch (type?.toLowerCase()) {
      case 'sale':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Sale</Badge>;
      case 'return':
        return <Badge className="bg-red-100 text-red-700 text-xs">Return</Badge>;
      case 'exchange':
        return <Badge className="bg-purple-100 text-purple-700 text-xs">Exchange</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{type}</Badge>;
    }
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (transaction: Transaction, columnKey: string) => {
      switch (columnKey) {
        case 'transactionNumber':
          return (
            <span className="font-mono text-xs sm:text-sm">
              {transaction.transactionNumber}
            </span>
          );
        case 'customerName':
          return (
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">
                {transaction.customerName || 'Walk-in Customer'}
              </div>
              {transaction.customerPhone && (
                <div className="text-muted-foreground text-xs truncate">
                  {transaction.customerPhone}
                </div>
              )}
            </div>
          );
        case 'totalAmount':
          return (
            <span className="font-semibold text-green-600 text-xs sm:text-sm">
              {formatCurrency(transaction.totalAmount)}
            </span>
          );
        case 'paymentMethod':
          return (
            <div className="flex items-center gap-1 sm:gap-2">
              {getPaymentMethodIcon(transaction.paymentMethod)}
              <span className="text-xs sm:text-sm">
                {paymentMethodLabels[transaction.paymentMethod as keyof typeof paymentMethodLabels] || transaction.paymentMethod}
              </span>
            </div>
          );
        case 'paymentStatus':
          return getPaymentStatusBadge(transaction.paymentStatus);
        case 'transactionType':
          return getTransactionTypeBadge(transaction.transactionType);
        case 'createdAt':
          return (
            <div>
              <div className="font-medium text-xs sm:text-sm">
                {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
              </div>
              <div className="text-muted-foreground text-xs">
                {format(new Date(transaction.createdAt), 'HH:mm')}
              </div>
            </div>
          );
        case 'staffName':
          return (
            <span className="text-xs sm:text-sm truncate">
              {transaction.staffName}
            </span>
          );
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getPaymentMethodIcon, getPaymentStatusBadge, getTransactionTypeBadge]
  );

  // Render actions function
  const renderActions = useCallback(
    (transaction: Transaction) => (
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
                onClick={() => setSelectedTransaction(transaction)}
                className="flex items-center gap-2"
              >
                <IconEye className="h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Transaction Details - {transaction.transactionNumber}
                </DialogTitle>
              </DialogHeader>
              {selectedTransaction && (
                <TransactionDetailsContent transaction={selectedTransaction} />
              )}
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2">
            <IconDownload className="h-4 w-4" />
            Export Receipt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [selectedTransaction]
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (transaction: Transaction) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
        <IconReceipt className="h-5 w-5 text-blue-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {transaction.transactionNumber}
      </span>
    </div>
  );

  const mobileCardSubtitle = (transaction: Transaction) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconCalendar className="h-3 w-3" />
      <span>{format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}</span>
      <span>•</span>
      <IconUser className="h-3 w-3" />
      <span className="truncate">
        {transaction.customerName || 'Walk-in'}
      </span>
      <span>•</span>
      <span className="font-semibold text-green-600">
        {formatCurrency(transaction.totalAmount)}
      </span>
    </div>
  );

  // Current pagination state
  const currentPagination = {
    page: currentPage,
    limit: pageSize,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.total || 0,
  };

  return (
    <DashboardPageLayout
      title="Transactions"
      description="View and manage all sales transactions"
      actions={
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="hidden sm:flex">
            <IconRefresh className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <IconDownload className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Export</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Mobile-optimized Filters */}
        <MobileDashboardFiltersBar
          searchPlaceholder="Search transactions..."
          searchValue={search}
          onSearchChange={handleSearch}
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Mobile-optimized Table */}
        <MobileDashboardTable
          tableTitle="Sales Transactions"
          totalCount={currentPagination.totalItems}
          currentCount={transactions.length}
          columns={columns}
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
          columnCustomizerKey="sales-transactions-visible-columns"
          data={transactions}
          renderCell={renderCell}
          renderActions={renderActions}
          pagination={currentPagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyStateIcon={
            <IconShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          }
          emptyStateMessage="No transactions found"
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          keyExtractor={transaction => transaction.id}
        />
      </div>
    </DashboardPageLayout>
  );
}

function TransactionDetailsContent({ transaction }: { transaction: Transaction }) {
  const totalItems = transaction.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Transaction Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction #:</span>
              <span className="font-mono">{transaction.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{format(new Date(transaction.createdAt), 'PPP p')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize">{transaction.transactionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Staff:</span>
              <span>{transaction.staffName}</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Customer & Payment</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span>{transaction.customerName || 'Walk-in'}</span>
            </div>
            {transaction.customerPhone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{transaction.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="capitalize">
                {paymentMethodLabels[transaction.paymentMethod as keyof typeof paymentMethodLabels] || transaction.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="capitalize">{transaction.paymentStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Items ({totalItems} items)</h4>
        <div className="space-y-2">
          {transaction.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.productName}</div>
                <div className="text-xs text-muted-foreground">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </div>
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(item.totalPrice)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <span className="font-medium">Total:</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(transaction.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}