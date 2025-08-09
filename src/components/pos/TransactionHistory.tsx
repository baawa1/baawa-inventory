/**
 * Transaction History Component
 * Displays transactions in a two-panel layout with date grouping and order details
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  IconEye,
  IconDownload,
  IconRefresh,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconPrinter,
  IconChevronDown,
  IconChevronRight,
  IconChartBar,
  IconCalendar,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import { ReceiptPrinter } from './ReceiptPrinter';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import { DateRange } from 'react-day-picker';
import type { TransformedTransaction } from '@/types/pos';

type Transaction = TransformedTransaction;

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
  const { data: _ } = useSession();
  const { handleError: _handleError } = usePOSErrorHandler();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Date range state - default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      // Add date range filters
      if (dateRange?.from) {
        params.append('dateFrom', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        params.append('dateTo', dateRange.to.toISOString().split('T')[0]);
      }

      // Load all transactions for the date range (no pagination)
      params.append('limit', '1000'); // Large limit to get all transactions

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
  }, [dateRange]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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
        transaction.transactionNumber,
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

  // Render order item
  const renderOrderItem = (transaction: Transaction) => {
    const isSelected = selectedTransaction?.id === transaction.id;

    return (
      <div
        key={`${transaction.id}-${transaction.transactionNumber}`}
        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
          isSelected
            ? 'bg-primary/10 border-primary'
            : 'bg-card hover:bg-accent/50 border-border'
        }`}
        onClick={() => setSelectedTransaction(transaction)}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">
              #{transaction.transactionNumber}
            </span>
            <Badge
              variant="secondary"
              className={
                transaction.paymentStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {transaction.paymentStatus || 'completed'}
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
            <Badge
              variant="secondary"
              className={
                transaction.paymentStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {transaction.paymentStatus || 'completed'}
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
        </div>

        {/* Order Items */}
        <div>
          <h3 className="mb-3 font-medium">Items in Order</h3>
          <div className="space-y-3">
            {transaction.items.map(item => (
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
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {item.quantity} x {formatCurrency(item.price)}
                  </div>
                  <div className="font-medium">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              </div>
            ))}
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
                {transaction.items.some(item => item.coupon) && (
                  <div className="bg-muted mt-2 rounded-md p-2">
                    <div className="text-muted-foreground mb-1 text-sm font-medium">
                      Applied Coupon:
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {
                          transaction.items.find(item => item.coupon)?.coupon
                            ?.code
                        }
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {
                          transaction.items.find(item => item.coupon)?.coupon
                            ?.name
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
                {transaction.fees.map((fee, index: number) => (
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
                timestamp: transaction.timestamp || new Date(),
                staffName: transaction.staffName,
                customerName: transaction.customer?.name || '',
                customerPhone: transaction.customer?.phone || '',
                customerEmail: transaction.customer?.email || '',
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
                <Button className="w-full" variant="outline">
                  <IconPrinter className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              }
            />
            <Button variant="ghost" className="w-full text-sm">
              or print gift receipt
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p>Loading transactions...</p>
        </div>
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
    <div className="flex h-[calc(100vh-49px)] flex-col space-y-6 p-6">
      {/* Header with Actions */}
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

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <DateRangePickerWithPresets
              date={dateRange}
              onDateChange={handleDateRangeChange}
              placeholder="Select date range"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateRange(undefined);
                setSelectedTransaction(null);
              }}
            >
              Reset Filter
            </Button>
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
        </div>
      </div>
    </div>
  );
}
