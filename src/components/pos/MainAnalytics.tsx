'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconCurrencyNaira,
  IconShoppingCart,
  IconUsers,
  IconChartBar,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MainAnalyticsProps {
  user: User;
}

interface KPIData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  customersChange: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface TopProduct {
  id: number;
  name: string;
  revenue: number;
  quantity: number;
}

interface RecentTransaction {
  id: number;
  transactionNumber: string;
  customerName: string | null;
  totalAmount: number;
  createdAt: string;
}

interface AnalyticsResponse {
  kpis: KPIData;
  revenueData: RevenueData[];
  topProducts: TopProduct[];
  recentTransactions: RecentTransaction[];
}

async function fetchMainAnalytics(
  dateRange?: DateRange
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.append('fromDate', dateRange.from.toISOString().split('T')[0]);
  }
  if (dateRange?.to) {
    params.append('toDate', dateRange.to.toISOString().split('T')[0]);
  }

  const response = await fetch(`/api/pos/analytics/overview?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data');
  }

  const result = await response.json();
  console.log('API Response:', result);

  // Handle the wrapped API response format
  if (result.success && result.data) {
    console.log('Extracted data:', result.data);
    return result.data as AnalyticsResponse;
  }

  console.error('Invalid response format:', result);
  throw new Error('Invalid response format from analytics API');
}

export function MainAnalytics({ user: _ }: MainAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    to: new Date(), // Today
  });

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['main-analytics', dateRange?.from, dateRange?.to],
    queryFn: () => fetchMainAnalytics(dateRange),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  if (error) {
    toast.error('Failed to load analytics data');
  }

  const getChangeBadge = (change: number) => {
    if (change > 0) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <IconTrendingUp className="mr-1 h-3 w-3" />+{change.toFixed(1)}%
        </Badge>
      );
    } else if (change < 0) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <IconTrendingDown className="mr-1 h-3 w-3" />
          {Math.abs(change).toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <IconMinus className="mr-1 h-3 w-3" />
          0%
        </Badge>
      );
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Quick insights for informed decision-making
          </p>
        </div>
        <DateRangePickerWithPresets
          date={dateRange}
          onDateChange={handleDateRangeChange}
          placeholder="Select date range"
          className="w-[300px]"
        />
      </div>

      {/* KPI Cards Loading */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-16 animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Loading */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>

      {/* Bottom Section Loading */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(j => (
                  <div
                    key={j}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                      <div>
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Show loading skeleton while data is loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state if no data
  if (!analyticsData || !analyticsData.kpis) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Quick insights for informed decision-making
            </p>
          </div>
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={handleDateRangeChange}
            placeholder="Select date range"
            className="w-[300px]"
          />
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No analytics data available for the selected date range
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = analyticsData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Quick insights for informed decision-making
          </p>
        </div>
        <DateRangePickerWithPresets
          date={dateRange}
          onDateChange={handleDateRangeChange}
          placeholder="Select date range"
          className="w-[300px]"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                <IconCurrencyNaira className="h-4 w-4" />
              </div>
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.kpis.totalRevenue)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(data.kpis.revenueChange)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="rounded-lg bg-green-100 p-2 text-green-600">
                <IconShoppingCart className="h-4 w-4" />
              </div>
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.totalOrders}</div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(data.kpis.ordersChange)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                <IconChartBar className="h-4 w-4" />
              </div>
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.kpis.averageOrderValue)}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(data.kpis.aovChange)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <IconUsers className="h-4 w-4" />
              </div>
              Unique Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.kpis.uniqueCustomers}
            </div>
            <div className="mt-2 flex items-center">
              {getChangeBadge(data.kpis.customersChange)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <p className="text-muted-foreground text-sm">
            Last 30 days revenue performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={value =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis tickFormatter={value => formatCurrency(value, false)} />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    'Revenue',
                  ]}
                  labelFormatter={label =>
                    new Date(label).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section - Top Products and Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <p className="text-muted-foreground text-sm">
              Best performing products by revenue
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {product.quantity} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/pos/analytics/products">
                <Button variant="outline" className="w-full">
                  View All Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <p className="text-muted-foreground text-sm">
              Latest sales activity
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <IconShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.customerName || 'Walk-in Customer'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {transaction.transactionNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(transaction.totalAmount)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(transaction.createdAt).toLocaleTimeString(
                        'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/pos/analytics/sales">
                <Button variant="outline" className="w-full">
                  View All Sales
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
