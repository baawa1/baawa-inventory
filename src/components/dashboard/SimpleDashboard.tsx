"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconPackages,
  IconShoppingCart,
  IconCurrencyNaira,
  IconChartLine,
  IconCalendar,
  IconRefresh,
  IconAlertTriangle,
  IconChartBar,
  IconDatabase,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { useTransactionStats } from "@/hooks/api/transactions";
import { useActiveUsers } from "@/hooks/api/users";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

interface SimpleDashboardProps {
  user: any;
}

export function SimpleDashboard({ user }: SimpleDashboardProps) {
  const [dateRange, setDateRange] = useState("30days");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch real-time data
  const { data: transactionStats, isLoading: isLoadingStats } =
    useTransactionStats();
  const { data: activeUsers = [], isLoading: isLoadingUsers } =
    useActiveUsers();

  const refreshDashboard = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const _getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "7days":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { dateFrom: sevenDaysAgo.toISOString().split("T")[0] };
      case "30days":
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        return { dateFrom: thirtyDaysAgo.toISOString().split("T")[0] };
      case "90days":
        const ninetyDaysAgo = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        return { dateFrom: ninetyDaysAgo.toISOString().split("T")[0] };
      default:
        return {};
    }
  };

  // KPI Data
  const kpiData = [
    {
      title: "Total Revenue",
      value: formatCurrency(transactionStats?.totalSales || 0),
      change: transactionStats?.salesChange || 0,
      trend: (transactionStats?.salesChange || 0) >= 0 ? "up" : "down",
      icon: <IconCurrencyNaira className="h-5 w-5" />,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Transactions",
      value: transactionStats?.totalTransactions || 0,
      change: transactionStats?.transactionsChange || 0,
      trend: (transactionStats?.transactionsChange || 0) >= 0 ? "up" : "down",
      icon: <IconShoppingCart className="h-5 w-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Users",
      value: activeUsers.length,
      change: 8.2,
      trend: "up",
      icon: <IconUsers className="h-5 w-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Average Order Value",
      value: formatCurrency(transactionStats?.averageOrderValue || 0),
      change: transactionStats?.averageOrderValueChange || 0,
      trend:
        (transactionStats?.averageOrderValueChange || 0) >= 0 ? "up" : "down",
      icon: <IconPackages className="h-5 w-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName}! Here&apos;s what&apos;s happening in
            your business.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
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

          <Button size="sm" className="gap-2">
            <IconCalendar className="h-4 w-4" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats || isLoadingUsers
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-24 mb-2 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                </CardContent>
              </Card>
            ))
          : kpiData.map((kpi, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${kpi.bgColor} ${kpi.color}`}
                      >
                        {kpi.icon}
                      </div>
                      {kpi.title}
                    </span>
                    {kpi.trend === "up" ? (
                      <IconTrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconTrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={kpi.trend === "up" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {kpi.change > 0 ? "+" : ""}
                        {kpi.change.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        vs last period
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <IconChartLine className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <IconChartBar className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <IconShoppingCart className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <IconPackages className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <IconDatabase className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard user={user} />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartLine className="h-5 w-5" />
                  Sales Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Today&apos;s Sales
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(125000)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Orders Today</span>
                    <span className="text-lg font-bold">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monthly Target</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(2000000)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Out of Stock</span>
                    <Badge variant="destructive">5 items</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Low Stock</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      12 items
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Pending Users</span>
                    <Badge variant="secondary">3 users</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCurrencyNaira className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(transactionStats?.totalSales || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Total Transactions
                    </span>
                    <span className="text-lg font-bold">
                      {transactionStats?.totalTransactions || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Average Order Value
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(transactionStats?.averageOrderValue || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cash</span>
                    <Badge variant="secondary">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">POS</span>
                    <Badge variant="secondary">35%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transfer</span>
                    <Badge variant="secondary">20%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPackages className="h-5 w-5" />
                  Inventory Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Products</span>
                    <span className="text-lg font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">In Stock</span>
                    <span className="text-lg font-bold text-green-600">
                      1,215
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Low Stock</span>
                    <span className="text-lg font-bold text-yellow-600">
                      27
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Out of Stock</span>
                    <span className="text-lg font-bold text-red-600">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      action: "Product Added",
                      item: "iPhone 15 Pro",
                      time: "5 min ago",
                    },
                    {
                      action: "Stock Updated",
                      item: "Samsung Galaxy",
                      time: "12 min ago",
                    },
                    {
                      action: "Low Stock Alert",
                      item: "AirPods Pro",
                      time: "25 min ago",
                    },
                    {
                      action: "Sale Completed",
                      item: "MacBook Air",
                      time: "1 hour ago",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 border-l-2 border-blue-200 pl-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.item}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconDatabase className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <Badge className="bg-green-100 text-green-700">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Server</span>
                    <Badge className="bg-green-100 text-green-700">
                      Online
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage</span>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      78% Full
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime</span>
                    <Badge className="bg-green-100 text-green-700">99.9%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <IconUsers className="h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <IconPackages className="h-4 w-4" />
                    Check Inventory
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <IconChartLine className="h-4 w-4" />
                    View Reports
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <IconDatabase className="h-4 w-4" />
                    System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
