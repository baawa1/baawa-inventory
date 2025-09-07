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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import {
  MobileDashboardFiltersBar,
  FilterConfig,
} from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Icons
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
  IconDots,
  IconCalendar,
  IconUser,
} from '@tabler/icons-react';

import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

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

interface MobileFinanceTransactionListProps {
  user: User;
}

export function MobileFinanceTransactionList({
  user: _,
}: MobileFinanceTransactionListProps) {
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
  } = useFinancialTransactions({
    search: debouncedSearchTerm,
    type: filters.type !== 'all' ? filters.type : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    paymentMethod:
      filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
  });

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
    toast.error('Failed to load financial transactions');
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
        key: 'type',
        label: 'Type',
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'description',
        label: 'Description',
        sortable: true,
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
      {
        key: 'createdByName',
        label: 'Created By',
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
          { value: 'INCOME', label: 'Income' },
          { value: 'EXPENSE', label: 'Expense' },
        ],
        placeholder: 'All Types',
      },
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
        key: 'paymentMethod',
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

  // Get payment method icon
  const getPaymentMethodIcon = useCallback((method?: string) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return <IconCash className="h-4 w-4 text-green-600" />;
      case 'bank_transfer':
        return <IconBuildingBank className="h-4 w-4 text-blue-600" />;
      case 'pos':
        return <IconCreditCard className="h-4 w-4 text-purple-600" />;
      case 'mobile_money':
        return <IconDeviceMobile className="h-4 w-4 text-orange-600" />;
      default:
        return <IconCreditCard className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-green-100 text-xs text-green-700">
            <IconCheck className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-xs text-yellow-700">
            <IconClock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-blue-100 text-xs text-blue-700">
            <IconCheck className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="text-xs">
            <IconX className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="text-xs">
            <IconX className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        );
    }
  }, []);

  // Get transaction type badge and icon
  const getTransactionTypeInfo = useCallback((type: string) => {
    switch (type) {
      case 'INCOME':
        return {
          badge: (
            <Badge className="bg-green-100 text-xs text-green-700">
              <IconTrendingUp className="mr-1 h-3 w-3" />
              Income
            </Badge>
          ),
          icon: <IconTrendingUp className="h-5 w-5 text-green-600" />,
          bgColor: 'bg-green-100',
        };
      case 'EXPENSE':
        return {
          badge: (
            <Badge className="bg-red-100 text-xs text-red-700">
              <IconTrendingDown className="mr-1 h-3 w-3" />
              Expense
            </Badge>
          ),
          icon: <IconTrendingDown className="h-5 w-5 text-red-600" />,
          bgColor: 'bg-red-100',
        };
      default:
        return {
          badge: (
            <Badge variant="secondary" className="text-xs">
              {type}
            </Badge>
          ),
          icon: <IconReceipt className="h-5 w-5 text-gray-600" />,
          bgColor: 'bg-gray-100',
        };
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
        case 'type':
          return getTransactionTypeInfo(transaction.type).badge;
        case 'description':
          return (
            <div className="min-w-0">
              <div className="truncate text-xs font-medium sm:text-sm">
                {transaction.description || 'No description'}
              </div>
              {transaction.type === 'EXPENSE' &&
                transaction.expenseDetails?.vendorName && (
                  <div className="text-muted-foreground truncate text-xs">
                    Vendor: {transaction.expenseDetails.vendorName}
                  </div>
                )}
              {transaction.type === 'INCOME' &&
                transaction.incomeDetails?.payerName && (
                  <div className="text-muted-foreground truncate text-xs">
                    Payer: {transaction.incomeDetails.payerName}
                  </div>
                )}
            </div>
          );
        case 'amount':
          const isIncome = transaction.type === 'INCOME';
          return (
            <span
              className={`text-xs font-semibold sm:text-sm ${isIncome ? 'text-green-600' : 'text-red-600'}`}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </span>
          );
        case 'transactionDate':
          return (
            <div>
              <div className="text-xs font-medium sm:text-sm">
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
              {getPaymentMethodIcon(transaction.paymentMethod)}
              <span className="text-xs capitalize sm:text-sm">
                {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
              </span>
            </div>
          );
        case 'status':
          return getStatusBadge(transaction.status);
        case 'createdByName':
          return (
            <span className="truncate text-xs sm:text-sm">
              {transaction.createdByName}
            </span>
          );
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getPaymentMethodIcon, getStatusBadge, getTransactionTypeInfo]
  );

  // Render actions function
  const renderActions = useCallback(
    (transaction: FinancialTransaction) => (
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
                onSelect={e => e.preventDefault()}
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
                <FinancialTransactionDetailsContent
                  transaction={selectedTransaction}
                />
              )}
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [selectedTransaction]
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (transaction: FinancialTransaction) => {
    const typeInfo = getTransactionTypeInfo(transaction.type);
    return (
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 flex-shrink-0 ${typeInfo.bgColor} flex items-center justify-center rounded-full`}
        >
          {typeInfo.icon}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {transaction.description ||
            `${transaction.type} #${transaction.transactionNumber}`}
        </span>
      </div>
    );
  };

  const mobileCardSubtitle = (transaction: FinancialTransaction) => (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <IconCalendar className="h-3 w-3" />
      <span>
        {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
      </span>
      <span>•</span>
      <IconUser className="h-3 w-3" />
      <span className="truncate">{transaction.createdByName}</span>
      <span>•</span>
      <span
        className={`font-semibold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}
      >
        {transaction.type === 'INCOME' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </span>
    </div>
  );

  return (
    <DashboardPageLayout
      title="Financial Transactions"
      description="View and manage all financial transactions"
      actions={
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <IconRefresh className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Refresh</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Mobile-optimized Filters */}
        <MobileDashboardFiltersBar
          searchPlaceholder="Search financial transactions..."
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
          pagination={currentPagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          isRefetching={transactionData && isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyStateIcon={
            <IconReceipt className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          }
          emptyStateMessage="No financial transactions found"
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          keyExtractor={transaction => transaction.id}
        />
      </div>
    </DashboardPageLayout>
  );
}

function FinancialTransactionDetailsContent({
  transaction,
}: {
  transaction: FinancialTransaction;
}) {
  const isIncome = transaction.type === 'INCOME';

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-medium">Transaction Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction #:</span>
              <span className="font-mono">{transaction.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize">
                {transaction.type.toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span
                className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
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

      {/* Type-specific Details */}
      {isIncome && transaction.incomeDetails ? (
        <div>
          <h4 className="mb-3 text-sm font-medium">Income Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span className="capitalize">
                {transaction.incomeDetails.incomeSource}
              </span>
            </div>
            {transaction.incomeDetails.payerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payer:</span>
                <span>{transaction.incomeDetails.payerName}</span>
              </div>
            )}
          </div>
        </div>
      ) : transaction.expenseDetails ? (
        <div>
          <h4 className="mb-3 text-sm font-medium">Expense Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
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
      ) : null}

      <Separator />

      {/* Created By */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Created By</h4>
        <div className="text-muted-foreground text-sm">
          {transaction.createdByName}
          <br />
          {format(new Date(transaction.createdAt), 'PPP p')}
        </div>
      </div>

      {/* Approved By */}
      {transaction.approvedByName && transaction.approvedAt && (
        <>
          <Separator />
          <div>
            <h4 className="mb-2 text-sm font-medium">Approved By</h4>
            <div className="text-muted-foreground text-sm">
              {transaction.approvedByName}
              <br />
              {format(new Date(transaction.approvedAt), 'PPP p')}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
