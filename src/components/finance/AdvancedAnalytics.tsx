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
  IconMinus,
  IconChartLine,
  IconTarget,
  IconBrain,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useAdvancedAnalytics } from '@/hooks/api/useAdvancedAnalytics';

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
  const [metric, setMetric] = useState('revenue');
  const [analysisType, setAnalysisType] = useState('trends');

  const { data: advancedAnalyticsData, isLoading } = useAdvancedAnalytics({
    dateRange,
    type: transactionType as 'all' | 'income' | 'expense',
    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
  });

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

  if (!advancedAnalyticsData) {
    return (
      <div className="space-y-6">
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            No advanced analytics data available
          </p>
        </div>
      </div>
    );
  }

  const { trendAnalysis, performanceMetrics, predictions } =
    advancedAnalyticsData;

  const getTrendBadge = (trend: 'up' | 'down' | 'stable', change: number) => {
    if (trend === 'up') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <IconTrendingUp className="mr-1 h-3 w-3" />+{change.toFixed(1)}%
        </Badge>
      );
    } else if (trend === 'down') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <IconTrendingDown className="mr-1 h-3 w-3" />
          {change.toFixed(1)}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <IconMinus className="mr-1 h-3 w-3" />
        {change.toFixed(1)}%
      </Badge>
    );
  };

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
            <IconChartLine className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <IconTarget className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <IconBrain className="h-4 w-4" />
            Predictions
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Revenue Trends
                  {getTrendBadge(
                    trendAnalysis.revenue.trend,
                    trendAnalysis.revenue.change
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Current Period
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(trendAnalysis.revenue.current)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Previous Period
                    </span>
                    <span className="text-sm">
                      {formatCurrency(trendAnalysis.revenue.previous)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Expenses Trends
                  {getTrendBadge(
                    trendAnalysis.expenses.trend,
                    trendAnalysis.expenses.change
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Current Period
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(trendAnalysis.expenses.current)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Previous Period
                    </span>
                    <span className="text-sm">
                      {formatCurrency(trendAnalysis.expenses.previous)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profit Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profit Trends
                  {getTrendBadge(
                    trendAnalysis.profit.trend,
                    trendAnalysis.profit.change
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Current Period
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(trendAnalysis.profit.current)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Previous Period
                    </span>
                    <span className="text-sm">
                      {formatCurrency(trendAnalysis.profit.previous)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Transaction Trends
                  {getTrendBadge(
                    trendAnalysis.transactions.trend,
                    trendAnalysis.transactions.change
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Current Period
                    </span>
                    <span className="font-semibold">
                      {trendAnalysis.transactions.current.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Previous Period
                    </span>
                    <span className="text-sm">
                      {trendAnalysis.transactions.previous.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Profit Margin */}
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {performanceMetrics.profitMargin.toFixed(1)}%
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Net profit as a percentage of revenue
                </p>
              </CardContent>
            </Card>

            {/* Average Transaction Value */}
            <Card>
              <CardHeader>
                <CardTitle>Average Transaction Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(performanceMetrics.averageTransactionValue)}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Average amount per transaction
                </p>
              </CardContent>
            </Card>

            {/* Revenue Per Transaction */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Per Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(performanceMetrics.revenuePerTransaction)}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Revenue generated per transaction
                </p>
              </CardContent>
            </Card>

            {/* Expense Ratio */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {performanceMetrics.expenseRatio.toFixed(1)}%
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Expenses as a percentage of revenue
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Next Month Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Next Month Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(predictions.nextMonthRevenue)}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Projected revenue based on current trends
                </p>
              </CardContent>
            </Card>

            {/* Next Month Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Next Month Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(predictions.nextMonthExpenses)}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Projected expenses based on current trends
                </p>
              </CardContent>
            </Card>

            {/* Next Month Profit */}
            <Card>
              <CardHeader>
                <CardTitle>Next Month Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(predictions.nextMonthProfit)}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Projected net profit for next month
                </p>
              </CardContent>
            </Card>

            {/* Growth Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {predictions.growthRate.toFixed(1)}%
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Expected growth rate based on trends
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
