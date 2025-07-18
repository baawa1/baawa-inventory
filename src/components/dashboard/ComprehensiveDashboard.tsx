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
  IconActivity,
  IconArrowRight,
  IconCalendar,
  IconRefresh,
  IconAlertTriangle,
  IconChartBar,
  IconPieChart,
  IconDatabase,
} from "@tabler/icons-react";

// Import custom components
import { DashboardKPICards } from "./DashboardKPICards";
import { SalesChart } from "./SalesChart";
import { InventoryChart } from "./InventoryChart";
import { RecentTransactionsTable } from "./RecentTransactionsTable";
import { LowStockAlerts } from "./LowStockAlerts";
import { UserActivityChart } from "./UserActivityChart";
import { SystemHealthMetrics } from "./SystemHealthMetrics";
import { QuickActionCards } from "./QuickActionCards";
import { PerformanceMetrics } from "./PerformanceMetrics";

// Import hooks for real-time data
import { useTransactionStats } from "@/hooks/api/transactions";
import { useActiveUsers } from "@/hooks/api/users";
import { formatCurrency } from "@/lib/utils";

interface ComprehensiveDashboardProps {
  user: any;
}

export function ComprehensiveDashboard({ user }: ComprehensiveDashboardProps) {
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

  const getDateRangeFilter = () => {
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
      <DashboardKPICards
        transactionStats={transactionStats}
        activeUsersCount={activeUsers.length}
        isLoading={isLoadingStats || isLoadingUsers}
        dateRange={getDateRangeFilter()}
      />

      {/* Quick Actions */}
      <QuickActionCards userRole={user.role} />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <IconChartLine className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <IconShoppingCart className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <IconPackages className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <IconChartBar className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <IconDatabase className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <SalesChart dateRange={getDateRangeFilter()} />

            {/* User Activity Chart */}
            <UserActivityChart dateRange={getDateRangeFilter()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <RecentTransactionsTable limit={10} />
            </div>

            {/* Low Stock Alerts */}
            <LowStockAlerts />
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
                  <IconPieChart className="h-5 w-5" />
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

          <RecentTransactionsTable limit={20} showFilters={true} />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryChart />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5" />
                  Inventory Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Out of Stock</span>
                    <Badge variant="destructive">12 items</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Low Stock</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      23 items
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Reorder Soon</span>
                    <Badge variant="secondary">8 items</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <LowStockAlerts expanded={true} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceMetrics />

            <Card>
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Customers</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Repeat Customers</span>
                    <span className="font-semibold">423</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Retention</span>
                    <span className="font-semibold text-green-600">34%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Product {i}</p>
                      <p className="text-sm text-muted-foreground">SKU-00{i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(15000 * (6 - i))}
                      </p>
                      <p className="text-sm text-green-600">+{(6 - i) * 5}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <SystemHealthMetrics />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Size</span>
                    <span className="font-semibold">156 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Sessions</span>
                    <span className="font-semibold">{activeUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Calls Today</span>
                    <span className="font-semibold">12,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-semibold text-green-600">0.02%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      action: "User login",
                      user: "john@example.com",
                      time: "2 min ago",
                    },
                    {
                      action: "Product added",
                      user: "admin",
                      time: "5 min ago",
                    },
                    {
                      action: "Sale completed",
                      user: "staff",
                      time: "8 min ago",
                    },
                    {
                      action: "Inventory updated",
                      user: "manager",
                      time: "12 min ago",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 border-l-2 border-blue-200 pl-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user}
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
      </Tabs>
    </div>
  );
}
