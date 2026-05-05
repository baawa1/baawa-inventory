'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { IconExternalLink, IconEye, IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useFinancialTransactions,
  type FinancialTransaction,
} from '@/hooks/api/finance';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import type { FilterConfig } from '@/components/layouts/DashboardFiltersBar';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransactionStatusBadge } from '@/components/finance/shared/TransactionStatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import {
  DEFAULT_DATE_RANGE_PRESET,
  getDateRangePreset,
} from '@/lib/utils/date-range';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface FinanceTransactionListProps {
  user: User;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'OWNER_FUNDING_IN', label: 'Owner Funding' },
  { value: 'STOCK_PURCHASE', label: 'Stock Purchase' },
  { value: 'MANUAL_OPERATING_INCOME', label: 'Manual Income' },
  { value: 'MANUAL_OPERATING_EXPENSE', label: 'Manual Expense' },
  { value: 'POS_CASH_SALE', label: 'POS Cash Sale' },
  { value: 'POS_DEBT_SALE_ISSUED', label: 'Debt Sale Issued' },
  { value: 'POS_DEBT_PAYMENT_COLLECTED', label: 'Debt Payment Collected' },
];

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'POS', label: 'POS' },
  { value: 'STOCK', label: 'Stock' },
];

const CASH_PROFIT_FILTERS: FilterConfig[] = [
  {
    key: 'source',
    label: 'Source',
    type: 'select',
    options: SOURCE_OPTIONS,
    placeholder: 'All Sources',
  },
  {
    key: 'eventType',
    label: 'Event Type',
    type: 'select',
    options: EVENT_TYPE_OPTIONS,
    placeholder: 'All Events',
  },
  {
    key: 'cashImpact',
    label: 'Cash Impact',
    type: 'select',
    options: [
      { value: 'in', label: 'Cash In' },
      { value: 'out', label: 'Cash Out' },
      { value: 'none', label: 'No Cash Move' },
    ],
    placeholder: 'All Cash Impact',
  },
  {
    key: 'profitImpact',
    label: 'Profit Impact',
    type: 'select',
    options: [
      { value: 'in', label: 'Profit In' },
      { value: 'out', label: 'Profit Out' },
      { value: 'none', label: 'No Profit Move' },
    ],
    placeholder: 'All Profit Impact',
  },
  {
    key: 'paymentState',
    label: 'Payment State',
    type: 'select',
    options: [
      { value: 'PAID', label: 'Paid' },
      { value: 'PARTIAL', label: 'Partial' },
      { value: 'PENDING', label: 'Pending' },
    ],
    placeholder: 'All Payment States',
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
      { value: 'DEBT', label: 'Debt Deposit' },
      { value: 'SPLIT', label: 'Split Payment' },
    ],
    placeholder: 'All Payment Methods',
  },
];

function formatSignedAmount(value: number) {
  if (value === 0) {
    return formatCurrency(0);
  }

  const prefix = value > 0 ? '+' : '-';
  return `${prefix}${formatCurrency(Math.abs(value))}`;
}

function EffectBadge({
  value,
  positiveColor,
  negativeColor,
}: {
  value: number;
  positiveColor: string;
  negativeColor: string;
}) {
  if (value === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <span className={`text-sm font-medium ${value > 0 ? positiveColor : negativeColor}`}>
      {formatSignedAmount(value)}
    </span>
  );
}

function LedgerDetailDialog({
  transaction,
  onOpenChange,
}: {
  transaction: FinancialTransaction | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!transaction} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ledger Event Details</DialogTitle>
        </DialogHeader>
        {transaction ? (
          <div className="grid gap-4 text-sm">
            <div className="grid gap-2 rounded-lg border p-4 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Event</p>
                <p className="font-medium">{transaction.displayLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reference</p>
                <p className="font-medium">{transaction.transactionNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(transaction.transactionDate), 'PPP p')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Source</p>
                <p className="font-medium">{transaction.source}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{transaction.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment State</p>
                <p className="font-medium">
                  {transaction.paymentState || 'Not applicable'}
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border p-4 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Cash Impact</p>
                <p className="font-medium">
                  {formatSignedAmount(transaction.netCashImpact)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Profit Impact</p>
                <p className="font-medium">
                  {formatSignedAmount(transaction.netProfitImpact)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Inventory Impact</p>
                <p className="font-medium">
                  {formatSignedAmount(transaction.netInventoryImpact)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Receivable Impact</p>
                <p className="font-medium">
                  {formatSignedAmount(transaction.netReceivableImpact)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground mb-1">Description</p>
              <p>{transaction.description}</p>
            </div>

            {transaction.estimated ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="font-medium">Estimated component</p>
                <p className="mt-1 text-sm">
                  {transaction.estimatedReason ||
                    'This row contains a best-effort estimate.'}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function FinanceTransactionList({
  user: _user,
}: FinanceTransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<FinancialTransaction | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    getDateRangePreset(DEFAULT_DATE_RANGE_PRESET)
  );
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    eventType: '',
    cashImpact: '',
    profitImpact: '',
    paymentState: '',
    paymentMethod: '',
  });

  const debouncedSearchTerm = useDebounce(filters.search, 500);
  const isSearching = filters.search !== debouncedSearchTerm;

  const {
    data: transactionData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useFinancialTransactions(
    {
      search: debouncedSearchTerm || undefined,
      source: filters.source || undefined,
      eventType: filters.eventType || undefined,
      cashImpact: (filters.cashImpact as 'in' | 'out' | 'none') || undefined,
      profitImpact:
        (filters.profitImpact as 'in' | 'out' | 'none') || undefined,
      paymentState: filters.paymentState || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      startDate: dateRange?.from
        ? formatFinanceDateInput(dateRange.from)
        : undefined,
      endDate: dateRange?.to ? formatFinanceDateInput(dateRange.to) : undefined,
      sortBy: 'transactionDate',
      sortOrder: 'desc',
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  useEffect(() => {
    if (error) {
      toast.error('Failed to load finance ledger events.');
    }
  }, [error]);

  const transactions = transactionData?.data || [];
  const apiPagination = transactionData?.pagination;
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages: apiPagination?.totalPages || pagination.totalPages,
    totalItems: apiPagination?.total || apiPagination?.totalItems || 0,
  };

  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'transactionDate',
        label: 'Date',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'displayLabel',
        label: 'Event',
        defaultVisible: true,
        required: true,
      },
      {
        key: 'source',
        label: 'Source',
        defaultVisible: true,
      },
      {
        key: 'amount',
        label: 'Amount',
        defaultVisible: true,
      },
      {
        key: 'cash',
        label: 'Cash',
        defaultVisible: true,
      },
      {
        key: 'profit',
        label: 'Profit',
        defaultVisible: true,
      },
      {
        key: 'inventory',
        label: 'Inventory',
        defaultVisible: false,
      },
      {
        key: 'receivable',
        label: 'Receivable',
        defaultVisible: false,
      },
      {
        key: 'paymentState',
        label: 'Payment State',
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

  const defaultVisibleColumns = useMemo(
    () => columns.filter(column => column.defaultVisible).map(column => column.key),
    [columns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns
  );

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters(prev => {
      if (prev[key as keyof typeof prev] === value) {
        return prev;
      }

      return { ...prev, [key]: String(value || '') };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      source: '',
      eventType: '',
      cashImpact: '',
      profitImpact: '',
      paymentState: '',
      paymentMethod: '',
    });
    setDateRange(getDateRangePreset(DEFAULT_DATE_RANGE_PRESET));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const renderCell = useCallback(
    (transaction: FinancialTransaction, columnKey: string) => {
      switch (columnKey) {
        case 'transactionDate':
          return (
            <div>
              <div className="font-medium">
                {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
              </div>
              <div className="text-muted-foreground text-xs">
                {format(new Date(transaction.transactionDate), 'p')}
              </div>
            </div>
          );
        case 'displayLabel':
          return (
            <div className="space-y-1">
              <div className="font-medium">{transaction.displayLabel}</div>
              <div className="text-muted-foreground text-xs">
                {transaction.description}
              </div>
              <div className="text-muted-foreground text-xs">
                {transaction.transactionNumber}
              </div>
            </div>
          );
        case 'source':
          return <Badge variant="outline">{transaction.source}</Badge>;
        case 'amount':
          return <span className="font-medium">{formatCurrency(transaction.amount)}</span>;
        case 'cash':
          return (
            <EffectBadge
              value={transaction.netCashImpact}
              positiveColor="text-green-600"
              negativeColor="text-red-600"
            />
          );
        case 'profit':
          return (
            <EffectBadge
              value={transaction.netProfitImpact}
              positiveColor="text-emerald-600"
              negativeColor="text-rose-600"
            />
          );
        case 'inventory':
          return (
            <EffectBadge
              value={transaction.netInventoryImpact}
              positiveColor="text-blue-600"
              negativeColor="text-amber-600"
            />
          );
        case 'receivable':
          return (
            <EffectBadge
              value={transaction.netReceivableImpact}
              positiveColor="text-purple-600"
              negativeColor="text-slate-600"
            />
          );
        case 'paymentState':
          return (
            <span className="text-sm">
              {transaction.paymentState || 'Not applicable'}
            </span>
          );
        case 'status':
          return <TransactionStatusBadge status={transaction.status} />;
        default:
          return null;
      }
    },
    []
  );

  const renderActions = useCallback((transaction: FinancialTransaction) => {
    const editHref =
      transaction.editable && transaction.source === 'MANUAL'
        ? transaction.type === 'INCOME'
          ? `/finance/income/${transaction.sourceId}/edit`
          : `/finance/expenses/${transaction.sourceId}/edit`
        : null;

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTransaction(transaction)}
        >
          <IconEye className="h-4 w-4" />
        </Button>
        {transaction.sourcePath ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={transaction.sourcePath}>
              <IconExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
        {editHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={editHref}>Edit</Link>
          </Button>
        ) : null}
      </div>
    );
  }, []);

  return (
    <>
      <DashboardTableLayout
        title="Finance Ledger"
        description="One master list for trading events, cash movement, stock purchases, owner funding, and receivables."
        actions={
          <>
            <DateRangePickerWithPresets
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Select ledger range"
            />
            <Button variant="outline" onClick={() => refetch()}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button asChild variant="outline">
              <Link href="/finance/income/new">Add Income</Link>
            </Button>
            <Button asChild>
              <Link href="/finance/expenses/new">Add Expense</Link>
            </Button>
          </>
        }
        searchPlaceholder="Search by event, customer, vendor, description, or reference..."
        searchValue={filters.search}
        onSearchChange={value => {
          setFilters(prev => ({ ...prev, search: value }));
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
        isSearching={isSearching}
        filters={CASH_PROFIT_FILTERS}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        tableTitle="Finance Ledger Events"
        totalCount={currentPagination.totalItems}
        currentCount={transactions.length}
        showingText="ledger events"
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="finance-ledger-columns"
        data={transactions}
        renderCell={renderCell}
        renderActions={renderActions}
        pagination={currentPagination}
        onPageChange={page =>
          setPagination(prev => ({ ...prev, page }))
        }
        onPageSizeChange={limit =>
          setPagination(prev => ({ ...prev, limit, page: 1 }))
        }
        isLoading={isLoading}
        isRefetching={isFetching}
        error={error ? 'Failed to load finance ledger.' : undefined}
        onRetry={() => refetch()}
        emptyStateMessage="No finance ledger events found for the selected filters."
      />

      <LedgerDetailDialog
        transaction={selectedTransaction}
        onOpenChange={open => {
          if (!open) {
            setSelectedTransaction(null);
          }
        }}
      />
    </>
  );
}
