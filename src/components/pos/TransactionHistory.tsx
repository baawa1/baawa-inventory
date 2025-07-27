/**
 * Transaction History Component
 * Displays both online and offline transactions with comprehensive filtering and management
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  IconPrinter,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useOffline } from '@/hooks/useOffline';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import type { FilterConfig } from '@/components/layouts/DashboardFiltersBar';
import { ReceiptPrinter } from './ReceiptPrinter';

import type { TransformedTransaction } from '@/types/pos';

type Transaction = TransformedTransaction;

const paymentMethodIcons = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuildingBank,
  mobile_money: IconDeviceMobile,
};

// Removed unused statusIcons variable

export function TransactionHistory() {
  const { data: _ } = useSession();
  const { isOnline, syncNow } = useOffline();
  const { handleError: _handleError } = usePOSErrorHandler();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    paymentMethod: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    staffName: 'all',
  });

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'transactionNumber',
        label: 'Transaction #',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'timestamp',
        label: 'Date & Time',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'staffName',
        label: 'Staff',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'customerName',
        label: 'Customer',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'items',
        label: 'Items',
        sortable: false,
        defaultVisible: true,
      },
      {
        key: 'paymentMethod',
        label: 'Payment',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'total',
        label: 'Total',
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

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      if (filters.search) params.append('search', filters.search);
      if (filters.paymentMethod !== 'all')
        params.append('paymentMethod', filters.paymentMethod);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.staffName !== 'all')
        params.append('staffId', filters.staffName);

      const response = await fetch(
        `/api/pos/transactions?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      const data = await response.json();
      setTransactions(data.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Use transactions directly since filtering is now handled server-side
  const filteredTransactions = transactions;

  // Get unique staff for filter
  const uniqueStaff = useMemo(
    () => [
      ...new Set(transactions.map(t => ({ id: t.staffId, name: t.staffName }))),
    ],
    [transactions]
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
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'completed', label: 'Completed' },
          { value: 'failed', label: 'Failed' },
        ],
        placeholder: 'All Status',
      },
      {
        key: 'dateFrom',
        label: 'From Date',
        type: 'date',
        placeholder: 'dd/mm/yyyy',
      },
      {
        key: 'dateTo',
        label: 'To Date',
        type: 'date',
        placeholder: 'dd/mm/yyyy',
      },
      {
        key: 'staffName',
        label: 'Staff',
        type: 'select',
        options: uniqueStaff.map(staff => ({
          value: staff.id.toString(),
          label: staff.name,
        })),
        placeholder: 'All Staff',
      },
    ],
    [uniqueStaff]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Handle page size changes
  const handlePageSizeChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      paymentMethod: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      staffName: 'all',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle sync retry (placeholder for future implementation)
  const _handleSyncRetry = async () => {
    if (isOnline) {
      await syncNow();
      await loadTransactions();
    }
  };

  // Export transactions to CSV
  const exportTransactions = () => {
    const csvContent = [
      [
        'Transaction #',
        'Date',
        'Staff',
        'Customer',
        'Items',
        'Payment Method',
        'Total',
        'Status',
      ],
      ...filteredTransactions.map(transaction => [
        transaction.transactionNumber,
        transaction.timestamp
          ? format(transaction.timestamp, 'MMM dd, yyyy HH:mm:ss')
          : '-',
        transaction.staffName,
        transaction.customerName || 'Walk-in Customer',
        transaction.items.length.toString(),
        transaction.paymentMethod.replace('_', ' '),
        formatCurrency(transaction.total),
        transaction.paymentStatus || 'completed',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
  };

  // Render cell function
  const renderCell = useCallback(
    (transaction: Transaction, columnKey: string) => {
      switch (columnKey) {
        case 'transactionNumber':
          return (
            <span className="font-mono text-sm">
              {transaction.transactionNumber}
            </span>
          );
        case 'timestamp':
          return (
            <div className="text-sm">
              <div>
                {transaction.timestamp
                  ? format(transaction.timestamp, 'MMM dd, yyyy')
                  : '-'}
              </div>
              <div className="text-muted-foreground">
                {transaction.timestamp
                  ? format(transaction.timestamp, 'HH:mm:ss')
                  : '-'}
              </div>
            </div>
          );
        case 'staffName':
          return <span className="text-sm">{transaction.staffName}</span>;
        case 'customerName':
          return (
            <span className="text-sm">
              {transaction.customerName || 'Walk-in Customer'}
            </span>
          );
        case 'items':
          return (
            <div className="text-sm">
              <div>{transaction.items.length} items</div>
              <div className="text-muted-foreground">
                {transaction.items
                  .slice(0, 2)
                  .map(item => item.name)
                  .join(', ')}
                {transaction.items.length > 2 && '...'}
              </div>
            </div>
          );
        case 'paymentMethod':
          const PaymentIcon =
            paymentMethodIcons[
              transaction.paymentMethod as keyof typeof paymentMethodIcons
            ] || IconCash;
          return (
            <div className="flex items-center gap-2">
              <PaymentIcon className="h-4 w-4" />
              <span className="text-sm capitalize">
                {transaction.paymentMethod.replace('_', ' ')}
              </span>
            </div>
          );
        case 'total':
          return (
            <span className="font-medium">
              {formatCurrency(transaction.total)}
            </span>
          );
        case 'status':
          const statusColor =
            transaction.paymentStatus === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : transaction.paymentStatus === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800';
          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={statusColor}>
                {transaction.paymentStatus || 'completed'}
              </Badge>
            </div>
          );
        default:
          return null;
      }
    },
    []
  );

  // Render actions
  const renderActions = useCallback(
    (transaction: Transaction) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTransaction(transaction)}
        >
          <IconEye className="h-4 w-4" />
        </Button>
        <ReceiptPrinter
          receiptData={{
            id: transaction.id.toString(),
            transactionNumber: transaction.transactionNumber,
            timestamp: transaction.timestamp || new Date(),
            staffName: transaction.staffName,
            customerName: transaction.customerName || '',
            customerPhone: transaction.customerPhone || '',
            customerEmail: transaction.customerEmail || '',
            items: transaction.items.map(item => ({
              id: item.id,
              name: item.name,
              sku: item.sku,
              price: item.price,
              quantity: item.quantity,
              category: '',
            })),
            subtotal: transaction.subtotal,
            discount: transaction.discount,
            total: transaction.total,
            paymentMethod: transaction.paymentMethod,
          }}
          trigger={
            <Button variant="ghost" size="sm">
              <IconPrinter className="h-4 w-4" />
            </Button>
          }
          size="sm"
          variant="ghost"
        />
      </div>
    ),
    []
  );

  // Transaction details dialog
  const TransactionDetailsDialog = ({
    transaction,
  }: {
    transaction: Transaction;
  }) => (
    <Dialog
      open={!!selectedTransaction}
      onOpenChange={() => setSelectedTransaction(null)}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Transaction Details - {transaction.transactionNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <p className="text-muted-foreground text-sm">
                {transaction.timestamp
                  ? format(transaction.timestamp, 'MMM dd, yyyy HH:mm:ss')
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Staff</label>
              <p className="text-muted-foreground text-sm">
                {transaction.staffName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Customer</label>
              <p className="text-muted-foreground text-sm">
                {transaction.customerName || 'Walk-in Customer'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <p className="text-muted-foreground text-sm capitalize">
                {transaction.paymentMethod.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Items</label>
            <div className="mt-2 space-y-2">
              {transaction.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} (x{item.quantity})
                  </span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-{formatCurrency(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          {/* Print Actions */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Actions:</span>
              <ReceiptPrinter
                receiptData={{
                  id: transaction.id.toString(),
                  transactionNumber: transaction.transactionNumber,
                  timestamp: transaction.timestamp || new Date(),
                  staffName: transaction.staffName,
                  customerName: transaction.customerName || '',
                  customerPhone: transaction.customerPhone || '',
                  customerEmail: transaction.customerEmail || '',
                  items: transaction.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    price: item.price,
                    quantity: item.quantity,
                    category: '',
                  })),
                  subtotal: transaction.subtotal,
                  discount: transaction.discount,
                  total: transaction.total,
                  paymentMethod: transaction.paymentMethod,
                }}
                trigger={
                  <Button variant="outline" size="sm">
                    <IconPrinter className="mr-2 h-4 w-4" />
                    Print Receipt
                  </Button>
                }
                size="sm"
                variant="outline"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <DashboardTableLayout
        title="Transaction History"
        description="View and manage sales transactions from both online and offline sources"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadTransactions}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportTransactions}>
              <IconDownload className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
        searchPlaceholder="Search transactions..."
        searchValue={filters.search}
        onSearchChange={value => handleFilterChange('search', value)}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        columns={columns}
        visibleColumns={visibleColumns}
        data={filteredTransactions}
        renderCell={renderCell}
        renderActions={renderActions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={loading}
        error={error || undefined}
        onRetry={loadTransactions}
        emptyStateMessage="No transactions found"
        totalCount={pagination.totalItems}
        currentCount={filteredTransactions.length}
      />

      {selectedTransaction && (
        <TransactionDetailsDialog transaction={selectedTransaction} />
      )}
    </>
  );
}
