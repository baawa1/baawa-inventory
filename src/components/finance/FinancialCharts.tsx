'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useFinancialAnalyticsCharts } from '@/hooks/api/useFinancialAnalytics';

interface FinancialChartsProps {
  dateRange?: DateRange;
  transactionType?: string;
  paymentMethod?: string;
}

const COLORS = {
  revenue: '#10b981',
  expenses: '#ef4444',
  transactions: '#3b82f6',
  cash: '#10b981',
  pos: '#3b82f6',
  bankTransfer: '#8b5cf6',
  mobileMoney: '#f59e0b',
};

export function FinancialCharts({
  dateRange,
  transactionType,
  paymentMethod,
}: FinancialChartsProps) {
  const { data: chartData, isLoading } = useFinancialAnalyticsCharts({
    dateRange,
    type: transactionType as 'all' | 'income' | 'expense',
    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] animate-pulse rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Process payment method data for pie chart
  const paymentMethodData =
    chartData?.paymentMethodDistribution?.map(method => ({
      name: method.name,
      value: method.value,
      amount: method.amount,
      color:
        COLORS[
          method.name.toLowerCase().replace(/\s+/g, '') as keyof typeof COLORS
        ] || '#6b7280',
    })) || [];

  // Process daily trends data
  const dailyTrendsData =
    chartData?.dailyTrends?.map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      revenue: trend.revenue,
      transactions: trend.transactions,
    })) || [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Revenue vs Transactions Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                yAxisId="left"
                tickFormatter={value => `₦${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={value => value.toString()}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Transactions',
                ]}
                labelFormatter={label => `Date: ${label}`}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke={COLORS.revenue}
                fill={COLORS.revenue}
                fillOpacity={0.6}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="transactions"
                stroke={COLORS.transactions}
                strokeWidth={2}
                dot={{ fill: COLORS.transactions, strokeWidth: 2, r: 4 }}
                name="Transactions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Method Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} transactions`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [value, 'Transactions']}
                labelFormatter={label => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke={COLORS.transactions}
                strokeWidth={2}
                dot={{ fill: COLORS.transactions, strokeWidth: 2, r: 4 }}
                name="Daily Transactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                tickFormatter={value => `₦${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  'Revenue',
                ]}
                labelFormatter={label => `Date: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                fill={COLORS.revenue}
                name="Daily Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
