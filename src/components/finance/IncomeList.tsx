'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  IconTrendingUp,
  IconPlus,
  IconEdit,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import type { FilterConfig } from '@/components/layouts/DashboardFiltersBar';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import { AppUser } from '@/types/user';
import type { FinancialTransaction } from '@/types/finance';
import { PaymentMethodIcon } from './shared/PaymentMethodIcon';
import { TransactionStatusBadge } from './shared/TransactionStatusBadge';
import Link from 'next/link';
import { canReadFinance, canWriteFinance } from '@/lib/auth/roles';
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import {
  DEFAULT_DATE_RANGE_PRESET,
  getDateRangePreset,
} from '@/lib/utils/date-range';

interface IncomeListProps {
  user: AppUser;
}

export function IncomeList({ user }: IncomeListProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<FinancialTransaction | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Date range state for custom date filtering
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    getDateRangePreset(DEFAULT_DATE_RANGE_PRESET)
  );

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment: '',
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
        type: 'INCOME',
        search: debouncedSearchTerm,
        status: filters.status !== 'all' ? filters.status : undefined,
        paymentMethod: filters.payment !== 'all' ? filters.payment : undefined,
        startDate: dateRange?.from
          ? formatFinanceDateInput(dateRange.from)
          : undefined,
        endDate: dateRange?.to ? formatFinanceDateInput(dateRange.to) : undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', 'INCOME');
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filters.status && filters.status !== 'all')
        params.append('status', filters.status);
      if (filters.payment && filters.payment !== 'all')
        params.append('paymentMethod', filters.payment);
      if (dateRange?.from)
        params.append('startDate', formatFinanceDateInput(dateRange.from));
      if (dateRange?.to)
        params.append('endDate', formatFinanceDateInput(dateRange.to));
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.limit));
      params.append('sortBy', 'transactionDate');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/finance/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch income transactions');
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
    toast.error('Failed to load income transactions');
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
        key: 'description',
        label: 'Description',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'incomeSource',
        label: 'Income Source',
        defaultVisible: true,
      },
      {
        key: 'payerName',
        label: 'Payer',
        defaultVisible: true,
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'transactionDate',
        label: 'Date',
        sortable: true,
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
  // Note: DashboardFiltersBar automatically adds "All {label}" option, so don't include it here
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
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
        key: 'payment',
        label: 'Payment Method',
        type: 'select',
        options: [
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

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      payment: '',
    });
    setDateRange(getDateRangePreset(DEFAULT_DATE_RANGE_PRESET));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (transaction: FinancialTransaction, columnKey: string) => {
      switch (columnKey) {
        case 'transactionNumber':
          return (
            <span className="font-mono text-sm">
              {transaction.transactionNumber}
            </span>
          );
        case 'description':
          return (
            <div>
              <div className="font-medium">{transaction.description}</div>
              {transaction.incomeDetails?.payerName && (
                <div className="text-muted-foreground text-sm">
                  From: {transaction.incomeDetails.payerName}
                </div>
              )}
            </div>
          );
        case 'incomeSource':
          return (
            <span className="capitalize">
              {transaction.incomeDetails?.incomeSource || 'N/A'}
            </span>
          );
        case 'payerName':
          return <span>{transaction.incomeDetails?.payerName || 'N/A'}</span>;
        case 'amount':
          return (
            <span className="font-semibold text-green-600">
              +{formatCurrency(transaction.amount)}
            </span>
          );
        case 'transactionDate':
          return (
            <div>
              <div className="font-medium">
                {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
              </div>
              <div className="text-muted-foreground text-sm">
                {format(new Date(transaction.transactionDate), 'HH:mm')}
              </div>
            </div>
          );
        case 'paymentMethod':
          return (
            <PaymentMethodIcon method={transaction.paymentMethod} showLabel />
          );
        case 'status':
          return <TransactionStatusBadge status={transaction.status} />;
        default:
          return null;
      }
    },
    []
  );

  // Check permissions
  const canRead = canReadFinance(user.role);
  const canWrite = canWriteFinance(user.role);

  // Render actions function
  const renderActions = useCallback(
    (transaction: FinancialTransaction) => {
      if (!canRead) return null;

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
                  Income Details - {transaction.transactionNumber}
                </DialogTitle>
              </DialogHeader>
              {selectedTransaction && (
                <TransactionDetailsContent transaction={selectedTransaction} />
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Button */}
          {canWrite && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/finance/income/${transaction.id}/edit`}>
                <IconEdit className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      );
    },
    [selectedTransaction, canRead, canWrite]
  );

  return (
    <>
      <DashboardTableLayout
        // Header
        title="Income Transactions"
        description="View and manage all income transactions"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {canWrite && (
              <Button asChild>
                <Link href="/finance/income/new">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Income
                </Link>
              </Button>
            )}
          </div>
        }
        // Filters
        searchPlaceholder="Search income transactions..."
        searchValue={filters.search}
        onSearchChange={value => handleFilterChange('search', value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        inlineFilters={
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={handleDateRangeChange}
            placeholder="Filter by date range"
          />
        }
        // Table
        tableTitle="Income Transactions"
        totalCount={currentPagination.totalItems}
        currentCount={transactions.length}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="income-transactions-visible-columns"
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
        emptyStateIcon={<IconTrendingUp className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm ||
          filters.status ||
          filters.payment ||
          dateRange
            ? 'No income transactions found matching your filters.'
            : 'No income transactions found.'
        }
        emptyStateAction={
          <Button asChild>
            <Link href="/finance/income/new">
              <IconPlus className="mr-2 h-4 w-4" />
              Add First Income
            </Link>
          </Button>
        }
      />
    </>
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">Transaction Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction #:</span>
              <span className="font-mono">{transaction.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-green-600">
                +{formatCurrency(transaction.amount)}
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

      {/* Income Details */}
      {transaction.incomeDetails && (
        <div>
          <h4 className="mb-3 text-sm font-medium">Income Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Income Source:</span>
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
