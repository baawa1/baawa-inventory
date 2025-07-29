'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  IconTarget,
  IconChartBar,
  IconBrain,
  IconCalculator,
} from '@tabler/icons-react';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';
import { useFinancialAnalytics } from '@/hooks/api/useFinancialAnalytics';

interface AdvancedAnalyticsProps {
  dateRange?: DateRange;
  transactionType?: string;
  paymentMethod?: string;
}

export function AdvancedAnalytics({
  dateRange,
  transactionType,
  paymentMethod,
}: AdvancedAnalyticsProps) {
  const [analysisType, setAnalysisType] = useState('trends');
  const [metric, setMetric] = useState('revenue');

  const { data: analyticsData, isLoading } = useFinancialAnalytics({
    dateRange,
    type: transactionType as 'all' | 'income' | 'expense',
    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
  });

  const summary = analyticsData?.summary;

  // Mock data for demonstration - replace with real API data
  const trendAnalysis = {
    revenue: {
      current: summary?.totalRevenue || 0,
      previous: (summary?.totalRevenue || 0) * 0.85,
      change: 15.2,
      trend: 'up',
    },
    expenses: {
      current: summary?.totalExpenses || 0,
      previous: (summary?.totalExpenses || 0) * 0.92,
      change: 8.7,
      trend: 'up',
    },
    profit: {
      current: summary?.netProfit || 0,
      previous: (summary?.netProfit || 0) * 0.78,
      change: 22.1,
      trend: 'up',
    },
    transactions: {
      current: summary?.totalTransactions || 0,
      previous: (summary?.totalTransactions || 0) * 0.88,
      change: 12.3,
      trend: 'up',
    },
  };

  const performanceMetrics = {
    profitMargin:
      ((summary?.netProfit || 0) / (summary?.totalRevenue || 1)) * 100,
    averageTransactionValue: summary?.averageTransactionValue || 0,
    revenuePerTransaction:
      (summary?.totalRevenue || 0) / (summary?.totalTransactions || 1),
    expenseRatio:
      ((summary?.totalExpenses || 0) / (summary?.totalRevenue || 1)) * 100,
  };

  const predictions = {
    nextMonthRevenue: (summary?.totalRevenue || 0) * 1.08,
    nextMonthExpenses: (summary?.totalExpenses || 0) * 1.05,
    nextMonthProfit:
      (summary?.totalRevenue || 0) * 1.08 -
      (summary?.totalExpenses || 0) * 1.05,
    growthRate: 8.2,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="py-8 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin border-b-2"></div>
          <p className="text-muted-foreground mt-2">
            Loading advanced analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Deep insights and predictive analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="transactions">Transactions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analysis Tabs */}
      <Tabs
        value={analysisType}
        onValueChange={setAnalysisType}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <IconTrendingUp className="h-4 w-4" />
            Trend Analysis
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <IconTarget className="h-4 w-4" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <IconBrain className="h-4 w-4" />
            Predictions
          </TabsTrigger>
        </TabsList>

        {/* Trend Analysis */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(trendAnalysis).map(([key, data]) => (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {key} Trend
                  </CardTitle>
                  <Badge
                    variant={data.trend === 'up' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {data.trend === 'up' ? '+' : '-'}
                    {data.change}%
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.current)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    vs {formatCurrency(data.previous)} previous period
                  </p>
                  <div className="mt-2 flex items-center">
                    {data.trend === 'up' ? (
                      <IconTrendingUp className="mr-1 h-4 w-4 text-green-600" />
                    ) : (
                      <IconTrendingDown className="mr-1 h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-xs ${data.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {data.change}% change
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trend Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <div>
                    <h4 className="font-medium text-green-800">
                      Revenue Growth
                    </h4>
                    <p className="text-sm text-green-600">
                      Strong revenue growth of {trendAnalysis.revenue.change}%
                      indicates healthy business expansion
                    </p>
                  </div>
                  <IconTrendingUp className="h-6 w-6 text-green-600" />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <div>
                    <h4 className="font-medium text-blue-800">
                      Profit Improvement
                    </h4>
                    <p className="text-sm text-blue-600">
                      Profit increased by {trendAnalysis.profit.change}%,
                      showing improved efficiency
                    </p>
                  </div>
                  <IconTrendingUp className="h-6 w-6 text-blue-600" />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      Expense Management
                    </h4>
                    <p className="text-sm text-yellow-600">
                      Expenses increased by {trendAnalysis.expenses.change}%,
                      monitor for cost control
                    </p>
                  </div>
                  <IconTrendingDown className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Profit Margin
                </CardTitle>
                <IconCalculator className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics.profitMargin.toFixed(1)}%
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Net profit margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Transaction
                </CardTitle>
                <IconChartBar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(performanceMetrics.averageTransactionValue)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Per transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenue per Transaction
                </CardTitle>
                <IconTrendingUp className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(performanceMetrics.revenuePerTransaction)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Average revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Expense Ratio
                </CardTitle>
                <IconTrendingDown className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics.expenseRatio.toFixed(1)}%
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Of total revenue
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">Profitability</h4>
                    <p className="text-muted-foreground text-sm">
                      Your profit margin of{' '}
                      {performanceMetrics.profitMargin.toFixed(1)}% is
                      {performanceMetrics.profitMargin > 20
                        ? ' excellent'
                        : performanceMetrics.profitMargin > 10
                          ? ' good'
                          : ' below average'}
                      .
                      {performanceMetrics.profitMargin < 15 &&
                        ' Consider reviewing pricing strategy and cost management.'}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">Transaction Efficiency</h4>
                    <p className="text-muted-foreground text-sm">
                      Average transaction value of{' '}
                      {formatCurrency(
                        performanceMetrics.averageTransactionValue
                      )}
                      {performanceMetrics.averageTransactionValue > 50000
                        ? ' indicates high-value sales'
                        : ' suggests focus on upselling opportunities'}
                      .
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Next Month Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(predictions.nextMonthRevenue)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  +{predictions.growthRate}% projected growth
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Next Month Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(predictions.nextMonthExpenses)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  +5% projected increase
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Next Month Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${predictions.nextMonthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(predictions.nextMonthProfit)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Projected net profit
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <h4 className="mb-2 font-medium text-blue-800">
                    Revenue Forecast
                  </h4>
                  <p className="text-sm text-blue-600">
                    Based on current trends, revenue is expected to grow by{' '}
                    {predictions.growthRate}% next month. This projection
                    considers seasonal patterns and recent performance.
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <h4 className="mb-2 font-medium text-green-800">
                    Profit Outlook
                  </h4>
                  <p className="text-sm text-green-600">
                    Projected profit of{' '}
                    {formatCurrency(predictions.nextMonthProfit)} suggests
                    continued profitability. Focus on maintaining current
                    efficiency levels.
                  </p>
                </div>

                <div className="rounded-lg bg-yellow-50 p-4">
                  <h4 className="mb-2 font-medium text-yellow-800">
                    Risk Factors
                  </h4>
                  <p className="text-sm text-yellow-600">
                    Monitor expense growth closely. Current projections show a
                    5% increase in expenses, which could impact profit margins
                    if not managed effectively.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
