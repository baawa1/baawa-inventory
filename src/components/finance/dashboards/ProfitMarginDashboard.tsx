'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGridSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/finance';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ProfitMarginData {
  trends: Array<{
    period: string;
    revenue: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  }>;
  bySource: Array<{
    source: string;
    revenue: number;
    transactionCount: number;
  }>;
  summary: {
    totalRevenue: number;
    totalGrossProfit: number;
    totalNetProfit: number;
    averageGrossMargin: number;
    averageNetMargin: number;
  };
}

async function fetchProfitMargins(months: number): Promise<ProfitMarginData> {
  const response = await fetch(`/api/finance/profit-margins?months=${months}`);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
}

export function ProfitMarginDashboard() {
  const [months, setMonths] = useState(12);

  const { data, isLoading, error } = useQuery({
    queryKey: ['profit-margins', months],
    queryFn: () => fetchProfitMargins(months),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ProfitMarginSkeleton />;
  if (error || !data) return <div>Failed to load profit margin data</div>;

  const latestMargin = data.trends[data.trends.length - 1];
  const previousMargin = data.trends[data.trends.length - 2];
  const marginTrend =
    latestMargin && previousMargin
      ? latestMargin.netMargin - previousMargin.netMargin
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profit Margin Analysis</h2>
        <Select value={months.toString()} onValueChange={v => setMonths(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalGrossProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.averageGrossMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {data.summary.totalNetProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.summary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.summary.totalNetProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.averageNetMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margin Trend</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                marginTrend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {marginTrend >= 0 ? '+' : ''}
              {marginTrend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs previous month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Margin Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Margin Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="grossMargin"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Gross Margin %"
                />
                <Line
                  type="monotone"
                  dataKey="netMargin"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Net Margin %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.bySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="revenue"
                  nameKey="source"
                  label={({ name, percent }) =>
                    `${String(name || '').replace('_', ' ')}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {data.bySource.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Profit Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Profit Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={v => formatCurrency(v)} />
                <Tooltip formatter={(v) => formatCurrency(Number(v) || 0)} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="grossProfit" fill="#22c55e" name="Gross Profit" />
                <Bar dataKey="netProfit" fill="#8b5cf6" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfitMarginSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-64" descriptionWidth="w-72" />
      <CardGridSkeleton count={4} columns={{ base: 1, md: 2, lg: 4 }} />
    </div>
  );
}
