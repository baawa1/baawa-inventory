'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconChartLine,
  IconChartBar,
} from '@tabler/icons-react';
import { useTransactionStats } from '@/hooks/api/transactions';
import { CURRENCY, PLACEHOLDER_VALUES } from '@/lib/constants';

interface TransactionDataOverviewProps {
  dateFrom?: string;
  dateTo?: string;
}

export function TransactionDataOverview({
  dateFrom,
  dateTo,
}: TransactionDataOverviewProps) {
  const [dateRange, setDateRange] = useState('month-to-date');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [granularity, setGranularity] = useState('day');

  const { data: stats, isLoading } = useTransactionStats(dateFrom, dateTo);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Performance</h3>
            <p className="text-muted-foreground text-sm">
              Key metrics and performance indicators
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
                <div className="h-8 w-3/4 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `${CURRENCY.SYMBOL}${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? (
      <IconTrendingUp className="h-4 w-4" />
    ) : (
      <IconTrendingDown className="h-4 w-4" />
    );
  };

  const performanceMetrics = [
    {
      label: 'Total sales',
      value: formatCurrency(stats.totalSales),
      change: stats.salesChange,
      changeLabel: formatPercentage(stats.salesChange),
    },
    {
      label: 'Net sales',
      value: formatCurrency(stats.netSales),
      change: stats.salesChange,
      changeLabel: formatPercentage(stats.salesChange),
    },
    {
      label: 'Orders',
      value: stats.totalTransactions.toString(),
      change: stats.transactionsChange,
      changeLabel: formatPercentage(stats.transactionsChange),
    },
    {
      label: 'Average order value',
      value: formatCurrency(stats.averageOrderValue),
      change: stats.averageOrderValueChange,
      changeLabel: formatPercentage(stats.averageOrderValueChange),
    },
    {
      label: 'Products sold',
      value: stats.totalItems.toString(),
      change: stats.itemsChange,
      changeLabel: formatPercentage(stats.itemsChange),
    },
    {
      label: 'Discounted orders',
      value: PLACEHOLDER_VALUES.DISCOUNTED_ORDERS, // TODO: Add this to stats
      change: 0,
      changeLabel: PLACEHOLDER_VALUES.DISCOUNT_CHANGE,
    },
    {
      label: 'Net discount amount',
      value: formatCurrency(stats.totalDiscount),
      change: 0, // TODO: Add discount change to stats
      changeLabel: PLACEHOLDER_VALUES.DISCOUNT_CHANGE,
    },
    {
      label: 'Visitors',
      value: PLACEHOLDER_VALUES.VISITOR_COUNT, // TODO: Add visitor tracking
      change: 0,
      changeLabel: PLACEHOLDER_VALUES.VISITOR_CHANGE,
    },
    {
      label: 'Gross sales',
      value: formatCurrency(stats.totalSales),
      change: stats.salesChange,
      changeLabel: formatPercentage(stats.salesChange),
    },
    {
      label: 'Views',
      value: PLACEHOLDER_VALUES.VIEW_COUNT, // TODO: Add view tracking
      change: 0,
      changeLabel: PLACEHOLDER_VALUES.VIEW_CHANGE,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Performance</h3>
          <p className="text-muted-foreground text-sm">
            Key metrics and performance indicators
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week-to-date">Week to date</SelectItem>
              <SelectItem value="month-to-date">
                Month to date (Jul 1 - 18, 2025) vs. Previous year (Jul 1 - 18,
                2024)
              </SelectItem>
              <SelectItem value="quarter-to-date">Quarter to date</SelectItem>
              <SelectItem value="year-to-date">Year to date</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                {metric.change !== 0 && (
                  <Badge
                    variant={metric.change >= 0 ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {getChangeIcon(metric.change)}
                    {metric.changeLabel}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Charts</h3>
          <div className="flex items-center gap-2">
            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">By hour</SelectItem>
                <SelectItem value="day">By day</SelectItem>
                <SelectItem value="week">By week</SelectItem>
                <SelectItem value="month">By month</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 rounded-md border p-1">
              <button
                onClick={() => setChartType('line')}
                className={`rounded p-1 ${
                  chartType === 'line'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <IconChartLine className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`rounded p-1 ${
                  chartType === 'bar'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <IconChartBar className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Net sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted flex h-64 items-center justify-center rounded-lg">
                <div className="text-center">
                  <IconChartBar className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">
                    Chart visualization would go here
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Showing net sales over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted flex h-64 items-center justify-center rounded-lg">
                <div className="text-center">
                  <IconChartBar className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">
                    Chart visualization would go here
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Showing order count over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
