'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/ui/page-header';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import { useFinancialAnalytics } from '@/hooks/api/useFinancialAnalytics';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InlineLoading } from '@/components/ui/loading';
import {
  IconAlertTriangle,
  IconChartLine,
  IconRefresh,
  IconScale,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react';

interface ForecastSummary {
  metrics: {
    thirtyDay: {
      projectedCashPosition: number;
      totalProjectedIncome: number;
      totalProjectedExpense: number;
    };
    runway: {
      daysUntilNegative: number | null;
      isPositive: boolean;
    };
  };
  methodology: {
    model: string;
  };
}

async function fetchForecastSummary(): Promise<ForecastSummary> {
  const response = await fetch('/api/finance/cash-flow-forecast?days=30');
  if (!response.ok) {
    throw new Error('Failed to fetch forecast summary');
  }

  const result = await response.json();
  return result.data;
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatPeriod(period: string) {
  return new Date(period).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}

export function AnalyticsReportPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useFinancialAnalytics({
    dateRange,
    groupBy,
  });
  const {
    data: forecast,
    isLoading: forecastLoading,
    error: forecastError,
  } = useQuery({
    queryKey: ['cash-flow-forecast-summary', 30],
    queryFn: fetchForecastSummary,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <InlineLoading className="justify-center" label="Loading financial analytics..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load financial analytics.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Financial Analytics"
          description="Trend analysis, revenue mix, receivables, and estimated health signals based on the ledger model."
        />
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select analytics range"
          />
          <Select value={groupBy} onValueChange={value => setGroupBy(value as typeof groupBy)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={data.methodology.status === 'exact' ? 'default' : 'secondary'}>
          {data.methodology.status}
        </Badge>
        <Badge variant="outline">{groupBy}</Badge>
        <Badge variant="outline">{data.health.status}</Badge>
      </div>

      {data.methodology.estimated ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-900">
            <IconAlertTriangle className="mt-0.5 h-4 w-4" />
            <div className="space-y-1">
              {data.methodology.reasons.map(reason => (
                <div key={reason}>{reason}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AnalyticsCard
          title="Operating Revenue"
          value={formatCurrency(data.overview.trading.operatingRevenue)}
          detail={formatPercent(data.overview.activity.revenueGrowth)}
          icon={<IconTrendingUp className="h-4 w-4 text-green-600" />}
        />
        <AnalyticsCard
          title="Net Profit"
          value={formatCurrency(data.overview.trading.netProfit)}
          detail={formatPercent(data.overview.activity.netProfitGrowth)}
          icon={<IconChartLine className="h-4 w-4 text-emerald-600" />}
        />
        <AnalyticsCard
          title="Net Cash Movement"
          value={formatCurrency(data.overview.cashMovement.netCashMovement)}
          detail={formatPercent(data.overview.activity.netCashGrowth)}
          icon={<IconWallet className="h-4 w-4 text-blue-600" />}
        />
        <AnalyticsCard
          title="Receivables"
          value={formatCurrency(data.overview.businessPosition.receivablesOutstanding)}
          detail={`${data.overview.businessPosition.customersWithBalances} customers`}
          icon={<IconTrendingDown className="h-4 w-4 text-amber-600" />}
        />
        <AnalyticsCard
          title="Health Score"
          value={`${data.health.healthScore}/100`}
          detail={`${data.health.profitMargin.toFixed(1)}% profit margin`}
          icon={<IconScale className="h-4 w-4 text-purple-600" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trading Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">COGS</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tradingTrends.slice(-8).map(item => (
                  <TableRow key={item.period}>
                    <TableCell>{formatPeriod(item.period)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.costOfGoodsSold)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.netProfit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Movement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Cash In</TableHead>
                  <TableHead className="text-right">Cash Out</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cashTrends.slice(-8).map(item => (
                  <TableRow key={item.period}>
                    <TableCell>{formatPeriod(item.period)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.cashReceived)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.cashSpent)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.netCashMovement)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue By Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.revenueBySource.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No revenue data for this range.
              </p>
            ) : (
              data.revenueBySource.map(source => (
                <div
                  key={source.source}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {source.source.replace(/_/g, ' ')}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {source.transactionCount} ledger rows
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(source.revenue)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.expenseBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No expense data for this range.
              </p>
            ) : (
              data.expenseBreakdown.slice(0, 8).map(expense => (
                <div
                  key={expense.category}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span>{expense.label}</span>
                  <span className="font-semibold">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receivables Aging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.receivables.aging).map(([bucket, values]) => (
              <div
                key={bucket}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{bucket} days</div>
                  <div className="text-muted-foreground text-xs">
                    {values.count} transactions
                  </div>
                </div>
                <div className="font-semibold">
                  {formatCurrency(values.amount)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Debtors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.receivables.topDebtors.map(debtor => (
                  <TableRow key={debtor.customerName}>
                    <TableCell>{debtor.customerName}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(debtor.totalOwed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {debtor.transactionCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimated Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          {forecastLoading ? (
            <InlineLoading label="Loading forecast..." />
          ) : forecastError || !forecast ? (
            <p className="text-muted-foreground text-sm">
              Forecast summary is unavailable right now.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <ForecastCard
                label="30-Day Cash Position"
                value={formatCurrency(
                  forecast.metrics.thirtyDay.projectedCashPosition
                )}
              />
              <ForecastCard
                label="30-Day Projected Income"
                value={formatCurrency(
                  forecast.metrics.thirtyDay.totalProjectedIncome
                )}
              />
              <ForecastCard
                label="Runway"
                value={
                  forecast.metrics.runway.daysUntilNegative === null
                    ? 'Positive'
                    : `${forecast.metrics.runway.daysUntilNegative} days`
                }
                detail={forecast.methodology.model}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ForecastCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {detail ? <div className="text-muted-foreground mt-1 text-xs">{detail}</div> : null}
    </div>
  );
}
