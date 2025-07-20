"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconCurrencyNaira,
  IconChartLine,
  IconShoppingCart,
  IconTrendingUp,
  IconPackage,
  IconRefresh,
  IconCalendar,
  IconUsers,
  IconCategory,
  IconStar,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { useAnalytics } from "@/hooks/api/useAnalytics";
import { CHART_CONFIG, DATE_RANGES } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsDashboardProps {
  _user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

export function AnalyticsDashboard({ _user }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<string>(DATE_RANGES.MONTH);

  // Fetch real analytics data
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useAnalytics(dateRange);

  const refreshDashboard = () => {
    refetch();
  };

  // Use real data or fallback to empty data
  const transactionStats = analyticsData?.transactionStats || {
    totalSales: 0,
    netSales: 0,
    totalTransactions: 0,
    totalItems: 0,
    averageOrderValue: 0,
  };

  const salesData = analyticsData?.salesData || [];
  const topCustomers = analyticsData?.topCustomers || [];
  const topCategories = analyticsData?.topCategories || [];
  const topProducts = analyticsData?.topProducts || [];

  // Performance metrics
  const performanceMetrics = [
    {
      title: "Total sales",
      value: formatCurrency(transactionStats.totalSales),
      change: -100,
      trend: "down",
      icon: <IconCurrencyNaira className="h-4 w-4" />,
    },
    {
      title: "Net sales",
      value: formatCurrency(transactionStats.netSales),
      change: -100,
      trend: "down",
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      title: "Orders",
      value: transactionStats.totalTransactions,
      change: -100,
      trend: "down",
      icon: <IconShoppingCart className="h-4 w-4" />,
    },
    {
      title: "Average order value",
      value: formatCurrency(transactionStats.averageOrderValue),
      change: -100,
      trend: "down",
      icon: <IconTrendingUp className="h-4 w-4" />,
    },
    {
      title: "Products sold",
      value: transactionStats.totalItems,
      change: -50,
      trend: "down",
      icon: <IconPackage className="h-4 w-4" />,
    },
  ];

  const getTrendBadge = (change: number, _trend: string) => {
    const isPositive = change > 0;
    const variant = isPositive ? "default" : "destructive";
    const icon = isPositive ? "↗" : "↘";
    return (
      <Badge variant={variant} className="text-xs">
        {icon} {Math.abs(change)}%
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <Button variant="outline" size="sm" disabled>
            <IconRefresh className="h-4 w-4 mr-2" />
            Loading...
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Loading...
                </CardTitle>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <Button variant="outline" size="sm" onClick={refreshDashboard}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Failed to load analytics data. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor your business performance and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={isLoading}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center space-x-2">
        <IconCalendar className="h-4 w-4 text-muted-foreground" />
        <Tabs value={dateRange} onValueChange={setDateRange} className="w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value={DATE_RANGES.WEEK}>Week</TabsTrigger>
            <TabsTrigger value={DATE_RANGES.MONTH}>Month</TabsTrigger>
            <TabsTrigger value={DATE_RANGES.YEAR}>Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 mt-2">
                {getTrendBadge(metric.change, metric.trend)}
                <span className="text-xs text-muted-foreground">
                  vs last period
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_CONFIG.HEIGHT}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: unknown) => [
                    formatCurrency(Number(value)),
                    "Sales",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke={CHART_CONFIG.COLORS[0]}
                  strokeWidth={CHART_CONFIG.STROKE_WIDTH}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <IconCategory className="h-4 w-4 mr-2" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_CONFIG.COLORS[
                            index % CHART_CONFIG.COLORS.length
                          ],
                      }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(category.netSales)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category.itemsSold} items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <IconUsers className="h-4 w-4 mr-2" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.orders} orders
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(customer.totalSpend)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <IconStar className="h-4 w-4 mr-2" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.itemsSold} sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(product.netSales)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
