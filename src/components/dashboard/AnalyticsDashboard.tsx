"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Tabs not needed in this component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  IconTrendingUp,
  IconPackages,
  IconShoppingCart,
  IconCurrencyNaira,
  IconChartLine,
  IconRefresh,
  IconEye,
  IconDiscount,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStats } from "@/hooks/api/transactions";
import { useActiveUsers } from "@/hooks/api/users";

interface AnalyticsDashboardProps {
  _user: any;
}

// Sample data for charts and leaderboards
const salesData = [
  { date: "Jul 1", sales: 472500, orders: 5, netSales: 450000 },
  { date: "Jul 2", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 3", sales: 315000, orders: 3, netSales: 300000 },
  { date: "Jul 4", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 5", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 6", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 7", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 8", sales: 525000, orders: 6, netSales: 500000 },
  { date: "Jul 9", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 10", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 11", sales: 630000, orders: 7, netSales: 600000 },
  { date: "Jul 12", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 13", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 14", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 15", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 16", sales: 0, orders: 0, netSales: 0 },
  { date: "Jul 17", sales: 420000, orders: 4, netSales: 400000 },
  { date: "Jul 18", sales: 0, orders: 0, netSales: 0 },
];

const topCustomers = [
  { id: 1, name: "Adebayo Dotaro", orders: 1, totalSpend: 104500 },
  { id: 2, name: "Google Storefront", orders: 1, totalSpend: 104500 },
  { id: 3, name: "Hafsat Idris", orders: 1, totalSpend: 19000 },
  { id: 4, name: "Ahmad Mohammed", orders: 1, totalSpend: 19000 },
];

const topCategories = [
  { id: 1, name: "Wristwatches", itemsSold: 4, netSales: 247000 },
  { id: 2, name: "Chain", itemsSold: 2, netSales: 209000 },
  { id: 3, name: "Electronics", itemsSold: 3, netSales: 156000 },
];

const topProducts = [
  {
    id: 1,
    name: "Patek Philippe PP301IG Gold Mens Watch",
    itemsSold: 2,
    netSales: 209000,
  },
  { id: 2, name: "Fossil Q0375 Rubber watch", itemsSold: 2, netSales: 38000 },
  { id: 3, name: "Apple Watch Series 9", itemsSold: 1, netSales: 85000 },
];

const categoryColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe"];

export function AnalyticsDashboard({ _user }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState("month");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch real-time data
  const { data: transactionStats, isLoading: _isLoadingStats } =
    useTransactionStats();
  const { data: _activeUsers = [], isLoading: _isLoadingUsers } =
    useActiveUsers();

  const refreshDashboard = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Performance metrics
  const performanceMetrics = [
    {
      title: "Total sales",
      value: formatCurrency(transactionStats?.totalSales || 0),
      change: -100,
      trend: "down",
      icon: <IconCurrencyNaira className="h-4 w-4" />,
    },
    {
      title: "Net sales",
      value: formatCurrency(transactionStats?.netSales || 0),
      change: -100,
      trend: "down",
      icon: <IconChartLine className="h-4 w-4" />,
    },
    {
      title: "Orders",
      value: transactionStats?.totalTransactions || 0,
      change: -100,
      trend: "down",
      icon: <IconShoppingCart className="h-4 w-4" />,
    },
    {
      title: "Average order value",
      value: formatCurrency(transactionStats?.averageOrderValue || 0),
      change: -100,
      trend: "down",
      icon: <IconTrendingUp className="h-4 w-4" />,
    },
    {
      title: "Products sold",
      value: transactionStats?.totalItems || 4,
      change: -50,
      trend: "down",
      icon: <IconPackages className="h-4 w-4" />,
    },
    {
      title: "Discounted orders",
      value: 0,
      change: 0,
      trend: "neutral",
      icon: <IconDiscount className="h-4 w-4" />,
    },
    {
      title: "Net discount amount",
      value: formatCurrency(0),
      change: 0,
      trend: "neutral",
      icon: <IconDiscount className="h-4 w-4" />,
    },
    {
      title: "Visitors",
      value: 999,
      change: 0,
      trend: "neutral",
      icon: <IconEye className="h-4 w-4" />,
    },
    {
      title: "Gross sales",
      value: formatCurrency(transactionStats?.totalSales || 0),
      change: -100,
      trend: "down",
      icon: <IconCurrencyNaira className="h-4 w-4" />,
    },
    {
      title: "Views",
      value: 1333,
      change: 0,
      trend: "neutral",
      icon: <IconEye className="h-4 w-4" />,
    },
  ];

  const getTrendBadge = (change: number, trend: string) => {
    if (trend === "neutral" || change === 0) return null;

    return (
      <Badge
        variant={trend === "up" ? "default" : "destructive"}
        className="text-xs"
      >
        {change > 0 ? "+" : ""}
        {change}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business analytics and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">
                Month to date (Jul 1 - 18, 2025)
              </SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            className="gap-2"
          >
            <IconRefresh className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {metric.icon}
                  {metric.title}
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  {getTrendBadge(metric.change, metric.trend)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Net sales</span>
              <Select defaultValue="day">
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By day</SelectItem>
                  <SelectItem value="week">By week</SelectItem>
                  <SelectItem value="month">By month</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      formatCurrency(value),
                      "Net Sales",
                    ]}
                  />
                  <Bar
                    dataKey="netSales"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Month to date (Jul 1 - 18, 2025)</span>
                <span className="font-semibold">₦0.00</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Previous year (Jul 1 - 18, 2024)</span>
                <span className="font-semibold">₦472,500.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Orders</span>
              <Select defaultValue="day">
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By day</SelectItem>
                  <SelectItem value="week">By week</SelectItem>
                  <SelectItem value="month">By month</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => [value, "Orders"]} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Month to date (Jul 1 - 18, 2025)</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Previous year (Jul 1 - 18, 2024)</span>
                <span className="font-semibold">5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards Section */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Customers */}
            <div>
              <h3 className="font-medium mb-4">Top Customers - Total Spend</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="text-blue-600 hover:underline cursor-pointer">
                        {customer.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.orders}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.totalSpend)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Top Categories */}
            <div>
              <h3 className="font-medium mb-4">Top Categories - Items Sold</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Items Sold</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-blue-600 hover:underline cursor-pointer">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {category.itemsSold}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(category.netSales)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Top Products */}
            <div>
              <h3 className="font-medium mb-4">Top Products - Items Sold</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Items Sold</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-blue-600 hover:underline cursor-pointer">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.itemsSold}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.netSales)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${percent ? (percent * 100).toFixed(0) : "0"}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="netSales"
                  >
                    {topCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={categoryColors[index % categoryColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">
                  Total Active Products
                </span>
                <span className="text-lg font-bold text-blue-600">1,247</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">
                  Monthly Revenue Target
                </span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(2000000)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium">
                  Customer Retention Rate
                </span>
                <span className="text-lg font-bold text-purple-600">76%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium">
                  Average Session Duration
                </span>
                <span className="text-lg font-bold text-orange-600">
                  4m 32s
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium">
                  Cart Abandonment Rate
                </span>
                <span className="text-lg font-bold text-red-600">23%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
