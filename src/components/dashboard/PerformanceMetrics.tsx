'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconTarget,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants/ui';

const chartConfig = {
  value: {
    label: 'Value',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

// Sample performance data
const salesByCategory = [
  { name: 'Electronics', value: 45, amount: 850000 },
  { name: 'Accessories', value: 30, amount: 560000 },
  { name: 'Watches', value: 15, amount: 280000 },
  { name: 'Jewelry', value: 10, amount: 190000 },
];

const monthlyTargets = [
  { month: 'Jan', target: 1500000, actual: 1350000 },
  { month: 'Feb', target: 1600000, actual: 1580000 },
  { month: 'Mar', target: 1700000, actual: 1450000 },
  { month: 'Apr', target: 1800000, actual: 1920000 },
  { month: 'May', target: 1900000, actual: 1780000 },
  { month: 'Jun', target: 2000000, actual: 2150000 },
];

const COLORS = CHART_COLORS;

export function PerformanceMetrics() {
  const totalSales = salesByCategory.reduce((sum, cat) => sum + cat.amount, 0);
  const targetAchievement =
    (monthlyTargets[monthlyTargets.length - 1].actual /
      monthlyTargets[monthlyTargets.length - 1].target) *
    100;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Sales by Category Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IconChartBar className="h-5 w-5" />
              Sales by Category
            </span>
            <Badge variant="secondary" className="text-xs">
              {formatCurrency(totalSales)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any, name: any, props: any) => [
                        formatCurrency(props.payload.amount),
                        props.payload.name,
                      ]}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Category Breakdown */}
          <div className="mt-4 space-y-2">
            {salesByCategory.map((category, index) => (
              <div
                key={category.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(category.amount)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {category.value}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target vs Actual Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IconTarget className="h-5 w-5" />
              Target vs Actual
            </span>
            <div className="flex items-center gap-2">
              {targetAchievement >= 100 ? (
                <IconTrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <IconTrendingDown className="h-4 w-4 text-red-600" />
              )}
              <Badge
                variant={targetAchievement >= 100 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {targetAchievement.toFixed(1)}%
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTargets}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={value => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any, name: string) => [
                        formatCurrency(value),
                        name === 'target' ? 'Target' : 'Actual',
                      ]}
                    />
                  }
                />
                <Bar dataKey="target" fill="#e2e8f0" name="target" />
                <Bar
                  dataKey="actual"
                  fill="hsl(var(--primary))"
                  name="actual"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Performance Indicators */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(
                  monthlyTargets[monthlyTargets.length - 1].target
                )}
              </p>
              <p className="text-muted-foreground text-xs">Monthly Target</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(
                  monthlyTargets[monthlyTargets.length - 1].actual
                )}
              </p>
              <p className="text-muted-foreground text-xs">Actual Sales</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
