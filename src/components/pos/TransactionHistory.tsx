/**
 * Transaction History Component
 * Displays transactions in a two-panel layout with date grouping and order details
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineLoading } from '@/components/ui/loading';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  IconEye,
  IconDownload,
  IconRefresh,
  IconTrash,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconPrinter,
  IconChevronDown,
  IconChevronRight,
  IconChartBar,
  IconReportMoney,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import { ReceiptPrinter } from './ReceiptPrinter';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import { DateRange } from 'react-day-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPaymentMethodLabel } from '@/lib/utils/payment-methods';
import {
  formatCalendarDateInput,
  getDateRangePreset,
} from '@/lib/utils/date-range';
import { queryKeys } from '@/lib/query-client';

interface TransactionCoupon {
  id: number;
  code: string;
  name: string;
  type: string;
  value: number;
}

interface TransactionItem {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  basePrice?: number | null;
  unitPrice?: number | null;
  originalPrice?: number | null;
  quantity: number;
  total: number;
  overrideReason?: string | null;
  priceOverrideReason?: string | null;
  note?: string | null;
  coupon: TransactionCoupon | null;
}

interface TransactionFee {
  id: number;
  type: string;
  description?: string | null;
  amount: number;
  createdAt?: string | Date | null;
}

interface TransactionSplitPayment {
  id: number;
  amount: number;
  method: string;
  createdAt?: string | Date | null;
}

interface TransactionRecordedPayment {
  id: number;
  amount: number;
  method: string;
  note?: string | null;
  paymentDate?: string | Date | null;
  recordedById?: number | null;
  recordedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt?: string | Date | null;
}

interface TransactionCustomer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  customerType?: string | null;
}

type TransactionStatusFilter =
  | 'all'
  | 'outstanding'
  | 'pending'
  | 'partial'
  | 'paid';

const STATUS_OPTIONS: Array<{ key: TransactionStatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'pending', label: 'Pending' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
];

interface Transaction {
  id: number;
  transactionNumber: string;
  items: TransactionItem[];
  fees: TransactionFee[];
  customer: TransactionCustomer | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  staffName: string;
  staffId?: number;
  timestamp?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  paymentStatus?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  splitPayments?: TransactionSplitPayment[];
  transactionPayments?: TransactionRecordedPayment[];
  paymentMethod: string;
  notes?: string | null;
}

const paymentMethodIcons = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuildingBank,
  mobile_money: IconDeviceMobile,
};

interface GroupedTransactions {
  [date: string]: Transaction[];
}

export function TransactionHistory() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { handleError: _handleError } = usePOSErrorHandler();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] =
    useState<TransactionStatusFilter>('all');
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingTransaction, setDeletingTransaction] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  // Date range state - default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    getDateRangePreset('last_30_days')
  );

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      // Add date range filters
      if (dateRange?.from) {
        params.append('dateFrom', formatCalendarDateInput(dateRange.from));
      }
      if (dateRange?.to) {
        params.append('dateTo', formatCalendarDateInput(dateRange.to));
      }

      // Load all transactions for the date range (no pagination)
      params.append('limit', '1000'); // Large limit to get all transactions

      if (statusFilter !== 'all') {
        const statusQuery =
          statusFilter === 'outstanding'
            ? ['PENDING', 'PARTIAL']
            : [statusFilter.toUpperCase()];
        params.append('paymentStatus', statusQuery.join(','));
      }

      const response = await fetch(
        `/api/pos/transactions?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      const data = await response.json();
      setTransactions(data.data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const selectedTransaction = useMemo(() => {
    if (selectedTransactionId === null) {
      return null;
    }
    return transactions.find(t => t.id === selectedTransactionId) || null;
  }, [transactions, selectedTransactionId]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const grouped: GroupedTransactions = {};

    transactions.forEach(transaction => {
      if (transaction.timestamp) {
        const dateLabel = format(transaction.timestamp, 'MMMM d, yyyy');

        if (!grouped[dateLabel]) {
          grouped[dateLabel] = [];
        }
        grouped[dateLabel].push(transaction);
      }
    });

    // Sort dates in descending order
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      })
    );
  }, [transactions]);

  // Handle date range change
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  // Toggle date expansion
  const toggleDateExpansion = useCallback((date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  }, []);

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
      ...transactions.map(transaction => [
        transaction.id,
        transaction.timestamp
          ? format(transaction.timestamp, 'MMM dd, yyyy HH:mm:ss')
          : '-',
        transaction.staffName,
        transaction.customer?.name || 'Walk-in Customer',
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

  const handleDeleteTransaction = useCallback(async () => {
    if (!selectedTransaction) {
      return;
    }

    const reason = deleteReason.trim();
    if (!reason) {
      toast.error('Enter a reason for deleting this transaction');
      return;
    }

    setDeletingTransaction(true);

    try {
      const response = await fetch(`/api/sales/${selectedTransaction.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete transaction');
      }

      setTransactions(current =>
        current.filter(transaction => transaction.id !== selectedTransaction.id)
      );
      setError(null);
      setLoading(false);
      setSelectedTransactionId(null);
      setDeleteReason('');
      setDeleteDialogOpen(false);

      await loadTransactions();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pos.products() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      ]);
      toast.success('Transaction deleted successfully');
    } catch (deleteError) {
      console.error(deleteError);
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete transaction'
      );
    } finally {
      setDeletingTransaction(false);
    }
  }, [deleteReason, loadTransactions, queryClient, selectedTransaction]);

  // Render order item
  const renderOrderItem = (transaction: Transaction) => {
    const isSelected = selectedTransactionId === transaction.id;
    const normalizedStatus = (transaction.paymentStatus || '').toLowerCase();
    const statusLabel = normalizedStatus
      ? normalizedStatus
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Completed';
    const statusClass =
      normalizedStatus === 'completed' || normalizedStatus === 'paid'
        ? 'bg-green-100 text-green-800'
        : normalizedStatus === 'partial'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-yellow-100 text-yellow-800';

    return (
      <div
        key={`${transaction.id}-${transaction.id}`}
        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
          isSelected
            ? 'bg-primary/10 border-primary'
            : 'bg-card hover:bg-accent/50 border-border'
        }`}
        onClick={() => setSelectedTransactionId(transaction.id)}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">
              #{transaction.id}
            </span>
            <Badge variant="secondary" className={statusClass}>
              {statusLabel}
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">
            {transaction.timestamp
              ? format(transaction.timestamp, 'h:mm a')
              : '-'}
          </div>
        </div>

        <div className="text-muted-foreground mb-2 text-sm">
          Customer: {transaction.customer?.name || 'Walk-in Customer'}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">{transaction.items.length} items</div>
          <div className="font-medium">{formatCurrency(transaction.total)}</div>
        </div>
      </div>
    );
  };

  // Render order details
  const renderOrderDetails = () => {
    if (!selectedTransaction) {
      return (
        <div className="text-muted-foreground flex h-full items-center justify-center">
          <div className="text-center">
            <IconEye className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Select an order to view details</p>
          </div>
        </div>
      );
    }

    const transaction = selectedTransaction;
    const PaymentIcon =
      paymentMethodIcons[
        transaction.paymentMethod as keyof typeof paymentMethodIcons
      ] || IconCash;
    const normalizedStatus = (transaction.paymentStatus || '').toLowerCase();
    const statusLabel = normalizedStatus
      ? normalizedStatus
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Completed';
    const statusClass =
      normalizedStatus === 'completed' || normalizedStatus === 'paid'
        ? 'bg-green-100 text-green-800'
        : normalizedStatus === 'partial'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-yellow-100 text-yellow-800';

    return (
      <div className="space-y-6">
        {/* Order Header */}
        <div className="border-b pb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="bg-primary text-primary-foreground rounded-md px-3 py-1">
              <span className="font-mono font-medium">
                Order #{transaction.transactionNumber}
              </span>
            </div>
            <Badge variant="secondary" className={statusClass}>
              {statusLabel}
            </Badge>
          </div>

          <div className="text-muted-foreground mb-2 text-sm">
            Paid via {transaction.paymentMethod.replace('_', ' ')} on{' '}
            {transaction.timestamp
              ? format(transaction.timestamp, 'MMMM d, yyyy h:mm a')
              : '-'}
          </div>

          <div className="text-sm">
            Customer: {transaction.customer?.name || 'Walk-in Customer'}
          </div>
          <div className="text-sm">
            Outstanding Balance:{' '}
            <span
              className={
                (transaction.balanceDue ?? 0) > 0.01
                  ? 'font-semibold text-amber-600'
                  : 'text-muted-foreground'
              }
            >
              {formatCurrency(transaction.balanceDue ?? 0)}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="mb-3 font-medium">Items in Order</h3>
          <div className="space-y-3">
            {transaction.items.map((item: any) => {
              const basePrice =
                item.basePrice ??
                item.unitPrice ??
                item.originalPrice ??
                item.price;
              const hasOverride = Math.abs(item.price - basePrice) > 0.009;
              const overrideReason =
                item.overrideReason ??
                item.priceOverrideReason ??
                item.note ??
                undefined;

              return (
                <div
                  key={`${item.id}-${item.sku}`}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-md">
                    <IconChartBar className="text-muted-foreground h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-muted-foreground text-xs">
                      SKU: {item.sku}
                    </div>
                    {overrideReason && (
                      <div className="text-muted-foreground mt-1 text-xs">
                        Override reason: {overrideReason}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {hasOverride ? (
                        <span className="flex flex-col items-end">
                          <span className="line-through">
                            {formatCurrency(basePrice)} × {item.quantity}
                          </span>
                          <span className="text-emerald-600">
                            {formatCurrency(item.price)} × {item.quantity}
                          </span>
                        </span>
                      ) : (
                        `${item.quantity} × ${formatCurrency(item.price)}`
                      )}
                    </div>
                    <div className="font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span>-{formatCurrency(transaction.discount)}</span>
                </div>
                {/* Show coupon information if any items have coupons */}
                {transaction.items.some((item: any) => item.coupon) && (
                  <div className="bg-muted mt-2 rounded-md p-2">
                    <div className="text-muted-foreground mb-1 text-sm font-medium">
                      Applied Coupon:
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {
                          transaction.items.find((item: any) => item.coupon)
                            ?.coupon?.code
                        }
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {
                          transaction.items.find((item: any) => item.coupon)
                            ?.coupon?.name
                        }
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Display Fees */}
            {transaction.fees && transaction.fees.length > 0 && (
              <>
                {transaction.fees.map((fee: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{fee.description || fee.type}:</span>
                    <span>+{formatCurrency(fee.amount)}</span>
                  </div>
                ))}
              </>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-medium">
              <span>TOTAL</span>
              <span className="text-primary">
                {formatCurrency(transaction.total)}
              </span>
            </div>
          </div>

          <div className="bg-muted mt-4 rounded-lg p-3">
            <div className="mb-1 flex items-center gap-2">
              <PaymentIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-muted-foreground text-sm">
              {formatCurrency(transaction.total)}
            </div>
          </div>
        </div>

        {!!transaction.splitPayments?.length && (
          <div className="border-t pt-4">
            <h3 className="mb-2 text-sm font-medium">Split Payments</h3>
            <div className="space-y-2">
              {transaction.splitPayments.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span>{formatPaymentMethodLabel(payment.method)}</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(payment.amount)}
                    </div>
                    {payment.createdAt && (
                      <div className="text-muted-foreground text-xs">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!!transaction.transactionPayments?.length && (
          <div className="border-t pt-4">
            <h3 className="mb-2 text-sm font-medium">Recorded Payments</h3>
            <div className="space-y-2">
              {transaction.transactionPayments.map(payment => (
                <div key={payment.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{formatPaymentMethodLabel(payment.method)}</span>
                    <span className="font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex flex-wrap justify-between gap-2 text-xs">
                    <span>
                      {payment.paymentDate
                        ? format(new Date(payment.paymentDate), 'MMM d, yyyy')
                        : 'No date recorded'}
                    </span>
                    {payment.recordedBy && (
                      <span>
                        Recorded by {payment.recordedBy.firstName}{' '}
                        {payment.recordedBy.lastName}
                      </span>
                    )}
                  </div>
                  {payment.note && (
                    <div className="text-muted-foreground mt-2 text-xs">
                      {payment.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Notes */}
        {transaction.notes && (
          <div className="border-t pt-4">
            <h3 className="mb-2 text-sm font-medium">Notes</h3>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-sm">
                {transaction.notes}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-4">
          <div className="flex flex-col gap-2">
            <ReceiptPrinter
              receiptData={{
                id: transaction.id.toString(),
                transactionNumber: transaction.transactionNumber,
                timestamp: transaction.timestamp
                  ? new Date(transaction.timestamp)
                  : new Date(),
                staffName: transaction.staffName,
                customerName: transaction.customer?.name || '',
                customerPhone: transaction.customer?.phone || '',
                customerEmail: transaction.customer?.email || '',
                items: transaction.items.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  sku: item.sku,
                  price: item.price,
                  basePrice:
                    item.basePrice ??
                    item.unitPrice ??
                    item.originalPrice ??
                    item.price,
                  priceOverride:
                    Math.abs(
                      item.price -
                        (item.basePrice ??
                          item.unitPrice ??
                          item.originalPrice ??
                          item.price)
                    ) > 0.009
                      ? item.price
                      : undefined,
                  overrideReason:
                    item.overrideReason ??
                    item.priceOverrideReason ??
                    item.note ??
                    undefined,
                  quantity: item.quantity,
                  category: '',
                })),
                subtotal: transaction.subtotal,
                discount: transaction.discount,
                total: transaction.total,
                paymentMethod: transaction.paymentMethod,
              }}
              trigger={
                <Button className="w-full" variant="outline">
                  <IconPrinter className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              }
            />
            <Button variant="ghost" className="w-full text-sm">
              or print gift receipt
            </Button>
            {(transaction.balanceDue ?? 0) > 0.01 && (
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  setPaymentAmount(
                    Number((transaction.balanceDue ?? 0).toFixed(2))
                  );
                  setPaymentMethod('cash');
                  setPaymentNote('');
                  setPaymentDate(new Date().toISOString().split('T')[0]);
                  setRecordPaymentOpen(true);
                }}
              >
                <IconReportMoney className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  setDeleteReason('');
                  setDeleteDialogOpen(true);
                }}
                disabled={deletingTransaction}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete Transaction
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <InlineLoading label="Loading transactions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadTransactions}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            View and manage sales transactions
          </p>
        </div>
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
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="text-sm font-medium text-muted-foreground md:w-40">
              Payment Status
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(option => (
                <Button
                  key={option.key}
                  variant={statusFilter === option.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(option.key);
                    setSelectedTransactionId(null);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="text-sm font-medium text-muted-foreground md:w-40">
              Date Range
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateRangePickerWithPresets
                date={dateRange}
                onDateChange={handleDateRangeChange}
                placeholder="Select date range"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateRange(getDateRangePreset('last_30_days'));
                  setSelectedTransactionId(null);
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Constrained height with scrollable content */}
      <div className="flex min-h-0 flex-1 gap-6">
        {/* Left Panel - Order List */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Orders by Date</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <div className="h-full overflow-y-auto">
              {Object.entries(groupedTransactions).map(
                ([date, dateTransactions]) => (
                  <Collapsible
                    key={date}
                    open={expandedDates.has(date)}
                    onOpenChange={() => toggleDateExpansion(date)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="hover:bg-accent/50 flex cursor-pointer items-center justify-between border-b p-4">
                        <div className="flex items-center gap-2">
                          {expandedDates.has(date) ? (
                            <IconChevronDown className="h-4 w-4" />
                          ) : (
                            <IconChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">
                            {dateTransactions.length} order
                            {dateTransactions.length !== 1 ? 's' : ''}
                          </span>
                          <IconChartBar className="text-muted-foreground h-4 w-4" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-2 p-4 pt-2">
                        {dateTransactions.map(renderOrderItem)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              )}

              {Object.keys(groupedTransactions).length === 0 && (
                <div className="text-muted-foreground flex h-32 items-center justify-center">
                  <p>No transactions found for the selected date range</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Order Details */}
        <Card className="flex w-1/2 flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            {renderOrderDetails()}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <div>
          Showing {transactions.length} transaction
          {transactions.length !== 1 ? 's' : ''}
          {dateRange?.from && dateRange?.to && (
            <>
              {' '}
              from {format(dateRange.from, 'MMM dd, yyyy')} to{' '}
              {format(dateRange.to, 'MMM dd, yyyy')}
            </>
          )}
        </div>
        <div>
          Total:{' '}
          {formatCurrency(transactions.reduce((sum, t) => sum + t.total, 0))}
          {statusFilter !== 'paid' && (
            <span className="ml-2 text-xs text-amber-600">
              Outstanding:{' '}
              {formatCurrency(
                transactions.reduce((sum, t) => sum + (t.balanceDue ?? 0), 0)
              )}
            </span>
          )}
        </div>
      </div>

      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Log the amount collected to update the outstanding balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={event =>
                  setPaymentAmount(parseFloat(event.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="payment-method">Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="pos">POS Machine</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={event => setPaymentDate(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payment-note">Note</Label>
              <Textarea
                id="payment-note"
                rows={3}
                value={paymentNote}
                onChange={event => setPaymentNote(event.target.value)}
                placeholder="Optional note for this payment"
              />
            </div>
            {selectedTransaction && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Outstanding balance:{' '}
                {formatCurrency(selectedTransaction.balanceDue ?? 0)}
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setRecordPaymentOpen(false)}
              disabled={submittingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedTransaction) {
                  return;
                }
                const outstanding = selectedTransaction.balanceDue ?? 0;
                if (paymentAmount <= 0) {
                  toast.error('Enter a payment amount');
                  return;
                }
                if (paymentAmount - outstanding > 0.01) {
                  toast.error('Amount exceeds outstanding balance');
                  return;
                }
                setSubmittingPayment(true);
                try {
                  const response = await fetch(
                    `/api/sales/${selectedTransaction.id}/payments`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        amount: paymentAmount,
                        paymentMethod,
                        note: paymentNote || undefined,
                        paymentDate: paymentDate
                          ? new Date(paymentDate).toISOString()
                          : undefined,
                      }),
                    }
                  );
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                      errorData?.error || 'Failed to record payment'
                    );
                  }
                  await loadTransactions();
                  toast.success('Payment recorded');
                  setRecordPaymentOpen(false);
                } catch (recordError) {
                  console.error(recordError);
                  toast.error(
                    recordError instanceof Error
                      ? recordError.message
                      : 'Failed to record payment'
                  );
                } finally {
                  setSubmittingPayment(false);
                }
              }}
              disabled={submittingPayment}
            >
              {submittingPayment ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={open => {
          if (deletingTransaction) {
            return;
          }

          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              This permanently removes the sale from transaction history and all
              normal sales views.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTransaction && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Deleting order #{selectedTransaction.transactionNumber} will
                restore stock, reverse coupon usage, remove the sale from
                history, and keep audit and stock trace records.
              </div>
            )}
            <div>
              <Label htmlFor="delete-transaction-reason">Reason</Label>
              <Textarea
                id="delete-transaction-reason"
                rows={4}
                value={deleteReason}
                onChange={event => setDeleteReason(event.target.value)}
                placeholder="Explain why this transaction is being deleted"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteReason('');
              }}
              disabled={deletingTransaction}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTransaction}
              disabled={deletingTransaction}
            >
              {deletingTransaction ? 'Deleting...' : 'Delete Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
