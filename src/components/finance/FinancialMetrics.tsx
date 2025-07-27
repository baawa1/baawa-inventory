'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCash,
  IconShoppingCart,
  IconUsers,
  IconPackage,
} from '@tabler/icons-react';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';

interface TransactionStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topPaymentMethod: string;
  revenueGrowth: number;
  expenseGrowth: number;
}

interface FinancialMetricsProps {
  transactionStats?: TransactionStats;
  isLoading: boolean;
  dateRange?: DateRange;
}

export function FinancialMetrics({
  transactionStats,
  isLoading,
  dateRange,
}: FinancialMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 animate-pulse rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!transactionStats) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              No data available
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    totalRevenue,
    totalExpenses,
    netProfit,
    totalTransactions,
    averageTransactionValue,
    topPaymentMethod,
    revenueGrowth,
    expenseGrowth,
  } = transactionStats;

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: IconTrendingUp,
      trend: revenueGrowth,
      trendLabel: 'vs last period',
      className: 'text-green-600',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: IconTrendingDown,
      trend: expenseGrowth,
      trendLabel: 'vs last period',
      className: 'text-red-600',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(netProfit),
      icon: IconCash,
      trend: netProfit > 0 ? 'positive' : 'negative',
      trendLabel: netProfit > 0 ? 'Profit' : 'Loss',
      className: netProfit > 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Total Transactions',
      value: totalTransactions.toLocaleString(),
      icon: IconShoppingCart,
      trend: 'neutral',
      trendLabel: 'transactions',
      className: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.className}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-muted-foreground flex items-center space-x-2 text-xs">
                  {metric.trend !== 'neutral' && (
                    <Badge
                      variant={
                        metric.trend === 'positive' ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {metric.trend === 'positive' ? '+' : '-'}
                      {typeof metric.trend === 'number'
                        ? `${Math.abs(metric.trend)}%`
                        : ''}
                    </Badge>
                  )}
                  <span>{metric.trendLabel}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Average Transaction Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageTransactionValue)}
            </div>
            <p className="text-muted-foreground text-xs">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Top Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {topPaymentMethod}
            </div>
            <p className="text-muted-foreground text-xs">
              Most used payment method
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Info */}
      {dateRange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {dateRange.from && dateRange.to
                ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                : 'Custom date range selected'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
