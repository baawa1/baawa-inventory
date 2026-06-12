'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CardGridSkeleton,
  ChartCardSkeleton,
  PageHeaderSkeleton,
} from '@/components/ui/skeletons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatFinanceCurrency } from '@/lib/utils/finance';
import { AlertTriangle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface ForecastData {
  forecast: Array<{
    date: string;
    projectedIncome: number;
    projectedExpense: number;
    projectedNetCashFlow: number;
    projectedCashPosition: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
  metrics: {
    current: { cashPosition: number; date: string };
    thirtyDay: {
      projectedCashPosition: number;
      totalProjectedIncome: number;
      totalProjectedExpense: number;
    };
    ninetyDay: {
      projectedCashPosition: number;
      totalProjectedIncome: number;
      totalProjectedExpense: number;
    };
    runway: { daysUntilNegative: number | null; isPositive: boolean };
    averages: {
      dailyIncome: number;
      dailyExpense: number;
      dailyNetCashFlow: number;
    };
  };
  warnings: Array<{
    date: string;
    projectedCashPosition: number;
    severity: 'critical' | 'warning';
  }>;
}

async function fetchForecast(days: number): Promise<ForecastData> {
  const response = await fetch(`/api/finance/cash-flow-forecast?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
}

export function CashFlowForecastDashboard() {
  const [forecastDays, setForecastDays] = useState(90);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cash-flow-forecast', forecastDays],
    queryFn: () => fetchForecast(forecastDays),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <ForecastSkeleton />;
  if (error || !data) return <div>Failed to load forecast</div>;

  const thirtyDayChange =
    data.metrics.thirtyDay.projectedCashPosition - data.metrics.current.cashPosition;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cash Flow Forecast</h2>
        <Select
          value={forecastDays.toString()}
          onValueChange={v => setForecastDays(parseInt(v))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Forecast period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cash Flow Warning</AlertTitle>
          <AlertDescription>
            Projected low cash position on{' '}
            {data.warnings.map(w => new Date(w.date).toLocaleDateString()).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFinanceCurrency(data.metrics.current.cashPosition)}
            </div>
            <p className="text-xs text-muted-foreground">
              as of {new Date(data.metrics.current.date).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">30-Day Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFinanceCurrency(data.metrics.thirtyDay.projectedCashPosition)}
            </div>
            <div className="flex items-center gap-1">
              {thirtyDayChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-xs ${
                  thirtyDayChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {thirtyDayChange >= 0 ? '+' : ''}
                {formatFinanceCurrency(thirtyDayChange)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.metrics.averages.dailyNetCashFlow >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatFinanceCurrency(data.metrics.averages.dailyNetCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">average per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.runway.daysUntilNegative !== null
                ? `${data.metrics.runway.daysUntilNegative} days`
                : 'Sustainable'}
            </div>
            <Badge
              variant={data.metrics.runway.isPositive ? 'default' : 'destructive'}
            >
              {data.metrics.runway.isPositive ? 'Positive trend' : 'Negative trend'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projected Cash Position</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={v =>
                  new Date(v).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis tickFormatter={v => formatFinanceCurrency(v)} />
              <Tooltip
                formatter={(v) => formatFinanceCurrency(Number(v) || 0)}
                labelFormatter={v =>
                  new Date(v).toLocaleDateString('en-NG', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label="Break-even"
              />
              <ReferenceLine
                y={data.metrics.current.cashPosition}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label="Current"
              />
              <Area
                type="monotone"
                dataKey="projectedCashPosition"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
                name="Projected Cash"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Income vs Expense Projection */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">30-Day Projected Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatFinanceCurrency(data.metrics.thirtyDay.totalProjectedIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              ~{formatFinanceCurrency(data.metrics.averages.dailyIncome)}/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">30-Day Projected Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatFinanceCurrency(data.metrics.thirtyDay.totalProjectedExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              ~{formatFinanceCurrency(data.metrics.averages.dailyExpense)}/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Methodology Note */}
      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            Forecast based on {forecastDays}-day projection using historical patterns
            from the last 6 months. Confidence decreases for projections beyond 30 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-48" descriptionWidth="w-72" />
      <CardGridSkeleton count={4} columns={{ base: 1, md: 2, lg: 4 }} />
      <ChartCardSkeleton height="h-[400px]" showDescription={false} />
    </div>
  );
}
