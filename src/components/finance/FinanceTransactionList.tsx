'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useFinancialTransactions } from '@/hooks/api/finance';
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
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
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

interface FinancialTransaction {
  id: number;
  transactionNumber: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description?: string;
  transactionDate: string;
  paymentMethod?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  createdByName: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  expenseDetails?: {
    expenseType: string;
    vendorName?: string;
  };
  incomeDetails?: {
    incomeSource: string;
    payerName?: string;
  };
}

interface FinanceTransactionListProps {
  user: User;
}

export function FinanceTransactionList({
  user: _,
}: FinanceTransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<FinancialTransaction | null>(null);

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
    type: '',
    status: '',
    paymentMethod: '',
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
  } = useFinancialTransactions(
    {
      search: debouncedSearchTerm,
      type: filters.type,
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      date: filters.date,
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  // Extract transactions array from API response
  const transactions = transactionData?.data || [];
  const apiPagination = transactionData?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages: apiPagination?.totalPages || pagination.totalPages,
    totalItems: apiPagination?.totalItems || 0,
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
        label: 'Date',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'type',
        label: 'Type',
        defaultVisible: true,
        required: true,
      },
      {
        key: 'description',
        label: 'Description',
        defaultVisible: true,
      },
      {
        key: 'amount',
        label: 'Amount',
        defaultVisible: true,
        required: true,
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        defaultVisible: true,
      },
      {
        key: 'status',
        label: 'Status',
        defaultVisible: true,
      },
      {
        key: 'createdBy',
        label: 'Created By',
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
        key: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'EXPENSE', label: 'Expense' },
          { value: 'INCOME', label: 'Income' },
        ],
        placeholder: 'All Types',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
        placeholder: 'All Status',
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        type: 'select',
        options: [
          { value: 'CASH', label: 'Cash' },
          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
          { value: 'POS_MACHINE', label: 'POS Machine' },
          { value: 'CREDIT_CARD', label: 'Credit Card' },
          { value: 'MOBILE_MONEY', label: 'Mobile Money' },
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
  const handleFilterChange = useCallback((key: string, value: any) => {
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
      type: '',
      status: '',
      paymentMethod: '',
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

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <IconCheck className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <IconClock className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <IconX className="mr-1 h-3 w-3" />
            {status}
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

  // Get type badge
  const getTypeBadge = useCallback((type: string) => {
    switch (type.toUpperCase()) {
      case 'INCOME':
        return (
          <Badge className="bg-green-100 text-green-800">
            <IconTrendingUp className="mr-1 h-3 w-3" />
            Income
          </Badge>
        );
      case 'EXPENSE':
        return (
          <Badge className="bg-red-100 text-red-800">
            <IconTrendingDown className="mr-1 h-3 w-3" />
            Expense
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }, []);

  // Get payment method icon
  const getPaymentIcon = useCallback((method: string) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return <IconCash className="h-4 w-4 text-green-600" />;
      case 'CREDIT_CARD':
      case 'POS_MACHINE':
        return <IconCreditCard className="h-4 w-4 text-blue-600" />;
      case 'BANK_TRANSFER':
        return <IconBuildingBank className="h-4 w-4 text-purple-600" />;
      case 'MOBILE_MONEY':
        return <IconDeviceMobile className="h-4 w-4 text-orange-600" />;
      default:
        return <IconCash className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (transaction: FinancialTransaction, columnKey: string) => {
      switch (columnKey) {
        case 'transactionNumber':
          return (
            <span className="font-mono">{transaction.transactionNumber}</span>
          );
        case 'date':
          return (
            <div>
              <div className="font-medium">
                {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
              </div>
              <div className="text-muted-foreground text-sm">
                {format(new Date(transaction.createdAt), 'HH:mm')}
              </div>
            </div>
          );
        case 'type':
          return getTypeBadge(transaction.type);
        case 'description':
          return (
            <span className="max-w-xs truncate">
              {transaction.description || 'No description'}
            </span>
          );
        case 'amount':
          return (
            <span
              className={`font-semibold ${
                transaction.type === 'INCOME'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {transaction.type === 'EXPENSE' ? '-' : '+'}
              {formatCurrency(transaction.amount)}
            </span>
          );
        case 'paymentMethod':
          return transaction.paymentMethod ? (
            <div className="flex items-center gap-2">
              {getPaymentIcon(transaction.paymentMethod)}
              <span className="capitalize">
                {transaction.paymentMethod.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Not specified</span>
          );
        case 'status':
          return getStatusBadge(transaction.status);
        case 'createdBy':
          return <span>{transaction.createdByName}</span>;
        default:
          return null;
      }
    },
    [getStatusBadge, getTypeBadge, getPaymentIcon]
  );

  // Render actions function
  const renderActions = useCallback(
    (transaction: FinancialTransaction) => {
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
        </div>
      );
    },
    [selectedTransaction]
  );

  return (
    <>
      <DashboardTableLayout
        // Header
        title="Financial Transactions"
        description="View and manage all financial transactions (expenses and income)"
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
        tableTitle="Financial Transactions"
        totalCount={currentPagination.totalItems}
        currentCount={transactions.length}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="finance-transactions-visible-columns"
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
          filters.type ||
          filters.status ||
          filters.paymentMethod ||
          filters.date
            ? 'No transactions found matching your filters.'
            : 'No financial transactions found.'
        }
      />
    </>
  );
}

// Transaction Details Component
function TransactionDetailsContent({
  transaction,
}: {
  transaction: FinancialTransaction;
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
            Type
          </label>
          <p>{transaction.type}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Date
          </label>
          <p>{format(new Date(transaction.transactionDate), 'PPP')}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Amount
          </label>
          <p
            className={`font-semibold ${
              transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {transaction.type === 'EXPENSE' ? '-' : '+'}
            {formatCurrency(transaction.amount)}
          </p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Status
          </label>
          <p>{transaction.status}</p>
        </div>
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Created By
          </label>
          <p>{transaction.createdByName}</p>
        </div>
        {transaction.paymentMethod && (
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Payment Method
            </label>
            <p className="capitalize">
              {transaction.paymentMethod.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        )}
        {transaction.approvedByName && (
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Approved By
            </label>
            <p>{transaction.approvedByName}</p>
          </div>
        )}
      </div>

      {transaction.description && (
        <>
          <Separator />
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Description
            </label>
            <p>{transaction.description}</p>
          </div>
        </>
      )}

      {/* Expense Details */}
      {transaction.expenseDetails && (
        <>
          <Separator />
          <div>
            <h4 className="mb-3 text-sm font-medium">Expense Details</h4>
            <div className="space-y-2">
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Expense Type
                </label>
                <p className="capitalize">
                  {transaction.expenseDetails.expenseType
                    .replace('_', ' ')
                    .toLowerCase()}
                </p>
              </div>
              {transaction.expenseDetails.vendorName && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Vendor
                  </label>
                  <p>{transaction.expenseDetails.vendorName}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Income Details */}
      {transaction.incomeDetails && (
        <>
          <Separator />
          <div>
            <h4 className="mb-3 text-sm font-medium">Income Details</h4>
            <div className="space-y-2">
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Income Source
                </label>
                <p className="capitalize">
                  {transaction.incomeDetails.incomeSource
                    .replace('_', ' ')
                    .toLowerCase()}
                </p>
              </div>
              {transaction.incomeDetails.payerName && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Payer
                  </label>
                  <p>{transaction.incomeDetails.payerName}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="text-muted-foreground text-sm font-medium">
            Created At
          </label>
          <p>{format(new Date(transaction.createdAt), 'PPP p')}</p>
        </div>
        {transaction.approvedAt && (
          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Approved At
            </label>
            <p>{format(new Date(transaction.approvedAt), 'PPP p')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
