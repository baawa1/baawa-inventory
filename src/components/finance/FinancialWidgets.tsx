'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  ShoppingCart,
} from 'lucide-react';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageTransactionValue: number;
  transactionCount: number;
  topExpenseCategory: string;
  topIncomeSource: string;
  monthlyGrowth: number;
  expenseGrowth: number;
}

interface FinancialWidgetsProps {
  metrics: FinancialMetrics;
  period: string;
}

export function FinancialWidgets({ metrics, period }: FinancialWidgetsProps) {
  const widgets = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.monthlyGrowth,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(metrics.totalExpenses),
      change: metrics.expenseGrowth,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(metrics.netProfit),
      change: metrics.profitMargin,
      icon: DollarSign,
      color: metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'Avg Transaction',
      value: formatCurrency(metrics.averageTransactionValue),
      change: null,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  const insights = [
    {
      label: 'Top Expense Category',
      value: metrics.topExpenseCategory,
      icon: ShoppingCart,
    },
    {
      label: 'Top Income Source',
      value: metrics.topIncomeSource,
      icon: TrendingUp,
    },
    {
      label: 'Total Transactions',
      value: metrics.transactionCount.toString(),
      icon: Receipt,
    },
    {
      label: 'Profit Margin',
      value: `${metrics.profitMargin.toFixed(1)}%`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {widgets.map((widget, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {widget.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${widget.bgColor}`}>
                <widget.icon className={`h-4 w-4 ${widget.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{widget.value}</div>
              {widget.change !== null && (
                <div className="text-muted-foreground flex items-center text-xs">
                  {widget.change >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  )}
                  {widget.change > 0 ? '+' : ''}
                  {widget.change.toFixed(1)}% from last {period}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>
            Important financial metrics and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="rounded-lg bg-gray-50 p-2">
                  <insight.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {insight.label}
                  </p>
                  <p className="font-medium">{insight.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
