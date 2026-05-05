'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Coins,
  Package,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { queryKeys } from '@/lib/query-client';
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import type { AppUser } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import {
  CardGridSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
} from '@/components/ui/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

interface FinanceOverviewProps {
  user: AppUser;
}

const fetchFinancialSummary = async (startDate?: Date, endDate?: Date) => {
  const params = new URLSearchParams();
  if (startDate) {
    params.append('startDate', formatFinanceDateInput(startDate));
  }
  if (endDate) {
    params.append('endDate', formatFinanceDateInput(endDate));
  }

  const url = `/api/finance/summary${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch financial summary');
  }
  return response.json();
};

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function ComparisonText({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous: number;
}) {
  const change = percentageChange(current, previous);
  const positive = change >= 0;

  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      {positive ? (
        <ArrowUpRight className="h-3 w-3 text-green-600" />
      ) : (
        <ArrowDownRight className="h-3 w-3 text-red-600" />
      )}
      <span>
        {change > 0 ? '+' : ''}
        {change.toFixed(1)}% {label}
      </span>
    </div>
  );
}

export function FinanceOverview({ user: _user }: FinanceOverviewProps) {
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  });

  const {
    data: summaryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      ...queryKeys.finance.summary(),
      dateRange?.from ? formatFinanceDateInput(dateRange.from) : undefined,
      dateRange?.to ? formatFinanceDateInput(dateRange.to) : undefined,
    ],
    queryFn: () => fetchFinancialSummary(dateRange?.from, dateRange?.to),
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeaderSkeleton
          actionsCount={3}
          actionWidths={['w-[300px]', 'w-28', 'w-32']}
        />
        <CardGridSkeleton count={3} columns={{ base: 1, md: 1, lg: 3 }} />
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-72 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <ListSkeleton rows={4} withAvatar />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Finance Overview"
          description="Track trading performance, cash movement, and business position."
        />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load financial data.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-3">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = summaryData?.data;
  const trading = data?.trading || {
    salesRevenue: 0,
    manualOperatingIncome: 0,
    operatingRevenue: 0,
    costOfGoodsSold: 0,
    operatingExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
  };
  const cashMovement = data?.cashMovement || {
    cashReceived: 0,
    cashSpent: 0,
    customerCollections: 0,
    ownerFunding: 0,
    stockPurchases: 0,
    operatingExpensePayments: 0,
    manualIncomeCollections: 0,
    netCashMovement: 0,
  };
  const businessPosition = data?.businessPosition || {
    inventoryValueOnHand: 0,
    inventoryUnitsOnHand: 0,
    inventorySkusTracked: 0,
    receivablesOutstanding: 0,
    receivableTransactions: 0,
    customersWithBalances: 0,
    estimated: false,
    estimatedReasons: [],
  };
  const previousTrading = data?.previousTrading || trading;
  const previousCashMovement = data?.previousCashMovement || cashMovement;
  const recentTransactions = data?.recentTransactions || [];
  const methodology = data?.methodology;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Finance Overview"
          description="See what the business earned, what cash moved, and what value is still tied up in stock and receivables."
        />
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select date range"
          />
          <Button asChild>
            <Link href="/finance/income/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Income
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/finance/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {methodology?.estimated ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-900">
            This period includes best-effort estimates.
            {Array.isArray(methodology.reasons) && methodology.reasons.length > 0
              ? ` ${methodology.reasons.join(' ')}`
              : ''}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Trading Performance</CardTitle>
              <Briefcase className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue recognised</span>
              <span className="font-semibold">
                {formatCurrency(trading.operatingRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost of goods sold</span>
              <span className="font-semibold">
                {formatCurrency(trading.costOfGoodsSold)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Operating expenses</span>
              <span className="font-semibold">
                {formatCurrency(trading.operatingExpenses)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-medium">Net profit</span>
              <span
                className={`font-bold ${
                  trading.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(trading.netProfit)}
              </span>
            </div>
            <ComparisonText
              label="vs previous period"
              current={trading.netProfit}
              previous={previousTrading.netProfit}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cash Movement</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cash received</span>
              <span className="font-semibold">
                {formatCurrency(cashMovement.cashReceived)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cash spent</span>
              <span className="font-semibold">
                {formatCurrency(cashMovement.cashSpent)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Owner funding</span>
              <span className="font-semibold">
                {formatCurrency(cashMovement.ownerFunding)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-medium">Net cash movement</span>
              <span
                className={`font-bold ${
                  cashMovement.netCashMovement >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(cashMovement.netCashMovement)}
              </span>
            </div>
            <ComparisonText
              label="vs previous period"
              current={cashMovement.netCashMovement}
              previous={previousCashMovement.netCashMovement}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Business Position</CardTitle>
              <Package className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Inventory on hand</span>
              <span className="font-semibold">
                {formatCurrency(businessPosition.inventoryValueOnHand)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Units in stock</span>
              <span className="font-semibold">
                {businessPosition.inventoryUnitsOnHand}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customers owing</span>
              <span className="font-semibold">
                {formatCurrency(businessPosition.receivablesOutstanding)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3 text-sm">
              <span className="font-medium">Open receivable accounts</span>
              <span className="font-semibold">
                {businessPosition.customersWithBalances}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Finance Ledger Events</CardTitle>
              <p className="text-muted-foreground text-sm">
                Latest money movements and business events across finance, POS,
                and stock.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/finance/transactions">Open Ledger</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.slice(0, 5).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-slate-500" />
                      <p className="font-medium">
                        {transaction.displayLabel || transaction.description}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {transaction.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-muted-foreground">
                      {transaction.source}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Receipt className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No finance events yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
