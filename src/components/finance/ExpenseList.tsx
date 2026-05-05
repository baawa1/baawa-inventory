'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IconEye,
  IconRefresh,
  IconTrendingDown,
  IconPlus,
  IconEdit,
  IconTrash,
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
import { FinancialTransactionDeleteAction } from './shared/FinancialTransactionDeleteAction';
import { ManualTransactionDetailDialog } from './shared/ManualTransactionDetailDialog';
import Link from 'next/link';
import { canDeleteFinance, canReadFinance, canWriteFinance } from '@/lib/auth/roles';
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import {
  DEFAULT_DATE_RANGE_PRESET,
  getDateRangePreset,
} from '@/lib/utils/date-range';

interface ExpenseListProps {
  user: AppUser;
}

export function ExpenseList({ user }: ExpenseListProps) {
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
        type: 'EXPENSE',
        search: debouncedSearchTerm,
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
      params.append('type', 'EXPENSE');
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
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
      params.append('view', 'manual');

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
        key: 'expenseType',
        label: 'Expense Type',
        defaultVisible: true,
      },
      {
        key: 'vendorName',
        label: 'Vendor',
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
              {transaction.expenseDetails?.vendorName && (
                <div className="text-muted-foreground text-sm">
                  Vendor: {transaction.expenseDetails.vendorName}
                </div>
              )}
            </div>
          );
        case 'expenseType':
          return (
            <span className="capitalize">
              {transaction.expenseDetails?.expenseType || 'N/A'}
            </span>
          );
        case 'vendorName':
          return <span>{transaction.expenseDetails?.vendorName || 'N/A'}</span>;
        case 'amount':
          return (
            <span className="font-semibold text-red-600">
              -{formatCurrency(transaction.amount)}
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
        default:
          return null;
      }
    },
    []
  );

  // Check permissions
  const canRead = canReadFinance(user.role);
  const canWrite = canWriteFinance(user.role);
  const canDelete = canDeleteFinance(user.role);

  // Render actions function
  const renderActions = useCallback(
    (transaction: FinancialTransaction) => {
      if (!canRead) return null;

      return (
        <div className="flex items-center justify-start gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`View expense ${transaction.transactionNumber}`}
              >
                <IconEye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <ManualTransactionDetailDialog transaction={transaction} />
          </Dialog>

          {canWrite && (
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/finance/expenses/${transaction.id}/edit`}
                aria-label={`Edit expense ${transaction.transactionNumber}`}
              >
                <IconEdit className="h-4 w-4" />
              </Link>
            </Button>
          )}

          {canDelete && (
            <FinancialTransactionDeleteAction
              transactionId={transaction.id}
              transactionNumber={transaction.transactionNumber}
              transactionType="expense"
              transactionStatus={transaction.status}
              renderTrigger={({ actionLabel, blocked, openDialog }) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={actionLabel}
                  onClick={openDialog}
                  disabled={blocked}
                  className="text-destructive hover:text-destructive"
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              )}
            />
          )}
        </div>
      );
    },
    [canDelete, canRead, canWrite]
  );

  return (
    <>
      <DashboardTableLayout
        // Header
        title="Expense Transactions"
        description="View and manage all expense transactions"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {canWrite && (
              <Button asChild>
                <Link href="/finance/expenses/new">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Expense
                </Link>
              </Button>
            )}
          </div>
        }
        // Filters
        searchPlaceholder="Search expense transactions..."
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
        emptyStateIcon={
          <IconTrendingDown className="h-12 w-12 text-gray-400" />
        }
        emptyStateMessage={
          debouncedSearchTerm ||
          filters.payment ||
          dateRange
            ? 'No expense transactions found matching your filters.'
            : 'No expense transactions found.'
        }
        emptyStateAction={
          <Button asChild>
            <Link href="/finance/expenses/new">
              <IconPlus className="mr-2 h-4 w-4" />
              Add First Expense
            </Link>
          </Button>
        }
      />
    </>
  );
}
