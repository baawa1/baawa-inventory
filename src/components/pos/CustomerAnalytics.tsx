'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  IconTrendingUp,
  IconCurrencyNaira,
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconShoppingBag,
  IconChartBar,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Link from 'next/link';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface CustomerAnalyticsProps {
  user: User;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  averageOrderValue: number;
  rank: number;
  firstPurchase: string;
  daysSinceLastPurchase: number;
  customerLifetimeValue: number;
  purchaseFrequency: number;
}

interface CustomerAnalyticsResponse {
  customers: CustomerData[];
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    newCustomers: number;
    returningCustomers: number;
    churnedCustomers: number;
    retentionRate: number;
  };
  customerSegments: {
    vip: number;
    regular: number;
    occasional: number;
    inactive: number;
  };
  customerTrends: {
    date: string;
    newCustomers: number;
    activeCustomers: number;
  }[];
  topCustomers: CustomerData[];
}

async function fetchCustomerAnalytics(
  dateRange?: DateRange
): Promise<CustomerAnalyticsResponse> {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.append('fromDate', dateRange.from.toISOString().split('T')[0]);
  }
  if (dateRange?.to) {
    params.append('toDate', dateRange.to.toISOString().split('T')[0]);
  }

  const response = await fetch(`/api/pos/analytics/customers?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch customer analytics');
  }

  const result = await response.json();
  console.log('Customer Analytics API Response:', result);

  if (result.success && result.data) {
    return result.data as CustomerAnalyticsResponse;
  }

  throw new Error('Invalid response format from customer analytics API');
}

export function CustomerAnalytics({ user: _user }: CustomerAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    to: new Date(), // Today
  });

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer-analytics', dateRange?.from, dateRange?.to],
    queryFn: () => fetchCustomerAnalytics(dateRange),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  if (error) {
    toast.error('Failed to load customer analytics data');
  }

  // Customer segment colors for pie chart
  const segmentColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive customer insights and analytics
          </p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
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

      {/* Charts Loading */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] animate-pulse rounded bg-gray-200" />
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
  if (!analyticsData) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Customer Analytics
            </h1>
            <p className="text-muted-foreground">
              Comprehensive customer insights and analytics
            </p>
          </div>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select date range"
            className="w-[300px]"
          />
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No customer analytics data available for the selected date range
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
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive customer insights and analytics
          </p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
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
                <IconUsers className="h-4 w-4" />
              </div>
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalCustomers}
            </div>
            <div className="mt-2 flex items-center">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <IconUserCheck className="mr-1 h-3 w-3" />
                {data.summary.returningCustomers} Returning
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="rounded-lg bg-green-100 p-2 text-green-600">
                <IconCurrencyNaira className="h-4 w-4" />
              </div>
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
            <div className="mt-2 flex items-center">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <IconTrendingUp className="mr-1 h-3 w-3" />
                CLV: {formatCurrency(data.summary.customerLifetimeValue)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                <IconShoppingBag className="h-4 w-4" />
              </div>
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.averageOrderValue)}
            </div>
            <div className="mt-2 flex items-center">
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800"
              >
                <IconChartBar className="mr-1 h-3 w-3" />
                {data.summary.retentionRate.toFixed(1)}% Retention
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <IconUserCheck className="h-4 w-4" />
              </div>
              New Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.newCustomers}
            </div>
            <div className="mt-2 flex items-center">
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800"
              >
                <IconUserX className="mr-1 h-3 w-3" />
                {data.summary.churnedCustomers} Churned
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth Trends</CardTitle>
            <p className="text-muted-foreground text-sm">
              New vs Active customers over time
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.customerTrends}>
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
                  <YAxis />
                  <Tooltip
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
                    dataKey="newCustomers"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="New Customers"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeCustomers"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Active Customers"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <p className="text-muted-foreground text-sm">
              Distribution by customer value
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'VIP', value: data.customerSegments.vip },
                      { name: 'Regular', value: data.customerSegments.regular },
                      {
                        name: 'Occasional',
                        value: data.customerSegments.occasional,
                      },
                      {
                        name: 'Inactive',
                        value: data.customerSegments.inactive,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {segmentColors.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => [value, 'Customers']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <p className="text-muted-foreground text-sm">
            View and manage all customers with detailed analytics
          </p>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="mb-4">
              <IconUsers className="text-muted-foreground mx-auto h-12 w-12" />
            </div>
            <h3 className="mb-2 text-lg font-medium">
              Customer Management System
            </h3>
            <p className="text-muted-foreground mb-4">
              Access the full customer management system with search, filtering,
              and detailed order history.
            </p>
            <Link href="/pos/customers/all">
              <Button className="w-full">
                <IconUsers className="mr-2 h-4 w-4" />
                Open Customer Management
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
