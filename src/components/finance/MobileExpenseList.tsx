'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Icons
import {
  IconEye,
  IconRefresh,
  IconTrendingDown,
  IconPlus,
  IconEdit,
  IconDots,
  IconReceipt,
  IconCalendar,
  IconCreditCard,
  IconUser,
} from '@tabler/icons-react';

import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { AppUser } from '@/types/user';
import { canReadFinance, canWriteFinance } from '@/lib/auth/roles';

interface FinancialTransaction {
  id: number;
  transactionNumber: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'REJECTED';
  approvedBy: number | null;
  approvedAt: Date | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  expenseDetails?: {
    id: number;
    expenseType: string;
    vendorName: string | null;
  };
  incomeDetails?: {
    id: number;
    incomeSource: string;
    payerName: string | null;
  };
  createdByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface MobileExpenseListProps {
  user: AppUser;
}

export function MobileExpenseList({ user }: MobileExpenseListProps) {
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
      'financial-transactions',
      {
        type: 'EXPENSE',
        search: debouncedSearchTerm,
        status: filters.status !== 'all' ? filters.status : undefined,
        paymentMethod: filters.payment !== 'all' ? filters.payment : undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', 'EXPENSE');
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filters.status && filters.status !== 'all')
        params.append('status', filters.status);
      if (filters.payment && filters.payment !== 'all')
        params.append('paymentMethod', filters.payment);
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.limit));
      params.append('sortBy', 'transactionDate');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/finance/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch expense transactions');
      return response.json();
    },
  });

  // Extract transactions array from API response
  const transactions = transactionData?.data || [];
  const apiPagination = transactionData?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages: apiPagination?.totalPages || pagination.totalPages,
    totalItems: apiPagination?.total || 0,
  };

  if (error) {
    toast.error('Failed to load expense transactions');
  }

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
        key: 'description',
        label: 'Description',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'expenseType',
        label: 'Expense Type',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'vendorName',
        label: 'Vendor',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'transactionDate',
        label: 'Date',
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
        key: 'status',
        label: 'Status',
        defaultVisible: true,
        className: 'font-bold',
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
          { value: 'all', label: 'All Status' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
        placeholder: 'All Status',
      },
      {
        key: 'payment',
        label: 'Payment Method',
        type: 'select',
        options: [
          { value: 'all', label: 'All Methods' },
          { value: 'CASH', label: 'Cash' },
          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
          { value: 'POS', label: 'POS' },
          { value: 'MOBILE_MONEY', label: 'Mobile Money' },
        ],
        placeholder: 'All Methods',
      },
      {
        key: 'date',
        label: 'Date Range',
        type: 'select',
        options: [
          { value: 'all', label: 'All Dates' },
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

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  }, []);

  // Get payment method icon
  const getPaymentIcon = useCallback((method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return <span className="text-green-600">💵</span>;
      case 'bank_transfer':
        return <span className="text-blue-600">🏦</span>;
      case 'pos':
        return <span className="text-purple-600">💳</span>;
      case 'mobile_money':
        return <span className="text-orange-600">📱</span>;
      default:
        return <span className="text-gray-600">💰</span>;
    }
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (transaction: FinancialTransaction, columnKey: string) => {
      switch (columnKey) {
        case 'transactionNumber':
          return (
            <span className="font-mono text-xs sm:text-sm">
              {transaction.transactionNumber}
            </span>
          );
        case 'description':
          return (
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">
                {transaction.description}
              </div>
              {transaction.expenseDetails?.vendorName && (
                <div className="text-muted-foreground text-xs truncate">
                  Vendor: {transaction.expenseDetails.vendorName}
                </div>
              )}
            </div>
          );
        case 'expenseType':
          return (
            <span className="capitalize text-xs sm:text-sm">
              {transaction.expenseDetails?.expenseType || 'N/A'}
            </span>
          );
        case 'vendorName':
          return (
            <span className="text-xs sm:text-sm truncate">
              {transaction.expenseDetails?.vendorName || 'N/A'}
            </span>
          );
        case 'amount':
          return (
            <span className="font-semibold text-red-600 text-xs sm:text-sm">
              -{formatCurrency(transaction.amount)}
            </span>
          );
        case 'transactionDate':
          return (
            <div>
              <div className="font-medium text-xs sm:text-sm">
                {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
              </div>
              <div className="text-muted-foreground text-xs">
                {format(new Date(transaction.transactionDate), 'HH:mm')}
              </div>
            </div>
          );
        case 'paymentMethod':
          return (
            <div className="flex items-center gap-1 sm:gap-2">
              {getPaymentIcon(transaction.paymentMethod || '')}
              <span className="capitalize text-xs sm:text-sm truncate">
                {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
              </span>
            </div>
          );
        case 'status':
          return getStatusBadge(transaction.status);
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getStatusBadge, getPaymentIcon]
  );

  // Check permissions
  const canRead = canReadFinance(user.role);
  const canWrite = canWriteFinance(user.role);

  // Render actions function
  const renderActions = useCallback(
    (transaction: FinancialTransaction) => {
      if (!canRead) return null;

      return (
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
                    Expense Details - {transaction.transactionNumber}
                  </DialogTitle>
                </DialogHeader>
                {selectedTransaction && (
                  <TransactionDetailsContent transaction={selectedTransaction} />
                )}
              </DialogContent>
            </Dialog>
            {canWrite && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/finance/expenses/${transaction.id}/edit`}
                    className="flex items-center gap-2"
                  >
                    <IconEdit className="h-4 w-4" />
                    Edit Expense
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [selectedTransaction, canRead, canWrite]
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (transaction: FinancialTransaction) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
        <IconReceipt className="h-5 w-5 text-red-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {transaction.description || `Expense #${transaction.transactionNumber}`}
      </span>
    </div>
  );

  const mobileCardSubtitle = (transaction: FinancialTransaction) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconCalendar className="h-3 w-3" />
      <span>{format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}</span>
      <span>•</span>
      <IconCreditCard className="h-3 w-3" />
      <span className="capitalize">
        {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
      </span>
      <span>•</span>
      <span className="font-semibold text-red-600">
        -{formatCurrency(transaction.amount)}
      </span>
    </div>
  );

  return (
    <DashboardPageLayout
      title="Expense Transactions"
      description="View and manage all expense transactions"
      actions={
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="hidden sm:flex">
            <IconRefresh className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          {canWrite && (
            <Button asChild>
              <Link href="/finance/expenses/new" className="flex items-center gap-2">
                <IconPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Mobile-optimized Filters */}
        <MobileDashboardFiltersBar
          searchPlaceholder="Search expense transactions..."
          searchValue={filters.search}
          onSearchChange={value => handleFilterChange('search', value)}
          isSearching={isSearching}
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Mobile-optimized Table */}
        <MobileDashboardTable
          tableTitle="Expense Transactions"
          totalCount={currentPagination.totalItems}
          currentCount={transactions.length}
          columns={columns}
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
          columnCustomizerKey="expense-transactions-visible-columns"
          data={transactions}
          renderCell={renderCell}
          renderActions={renderActions}
          pagination={currentPagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          isRefetching={transactionData && isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyStateIcon={
            <IconTrendingDown className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          }
          emptyStateMessage={
            debouncedSearchTerm ||
            filters.status ||
            filters.payment ||
            filters.date
              ? 'No expense transactions found matching your filters.'
              : 'No expense transactions found.'
          }
          emptyStateAction={
            canWrite ? (
              <Button asChild>
                <Link href="/finance/expenses/new">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add First Expense
                </Link>
              </Button>
            ) : undefined
          }
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          keyExtractor={transaction => transaction.id}
        />
      </div>
    </DashboardPageLayout>
  );
}

function TransactionDetailsContent({
  transaction,
}: {
  transaction: FinancialTransaction;
}) {
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
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>
                {format(new Date(transaction.transactionDate), 'PPP')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="capitalize">
                {transaction.status.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Payment Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span className="capitalize">
                {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Expense Details */}
      {transaction.expenseDetails && (
        <div>
          <h4 className="mb-3 text-sm font-medium">Expense Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expense Type:</span>
              <span className="capitalize">
                {transaction.expenseDetails.expenseType}
              </span>
            </div>
            {transaction.expenseDetails.vendorName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span>{transaction.expenseDetails.vendorName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Created By */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Created By</h4>
        <div className="text-muted-foreground text-sm">
          {transaction.createdByUser.firstName}{' '}
          {transaction.createdByUser.lastName}
          <br />
          {transaction.createdByUser.email}
        </div>
      </div>

      {/* Approved By */}
      {transaction.approvedByUser && (
        <>
          <Separator />
          <div>
            <h4 className="mb-2 text-sm font-medium">Approved By</h4>
            <div className="text-muted-foreground text-sm">
              {transaction.approvedByUser.firstName}{' '}
              {transaction.approvedByUser.lastName}
              <br />
              {transaction.approvedByUser.email}
              {transaction.approvedAt && (
                <>
                  <br />
                  {format(new Date(transaction.approvedAt), 'PPP')}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}