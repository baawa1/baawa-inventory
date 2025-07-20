"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconUsers,
  IconPackages,
  IconShoppingCart,
  IconCurrencyNaira,
  IconChartLine,
  IconAlertTriangle,
  IconArrowRight,
  IconActivity,
  IconDatabase,
} from "@tabler/icons-react";
import { useActiveUsers, usePendingUsers } from "@/hooks/api/users";
import { formatCurrency } from "@/lib/utils";

export function AdminOverview() {
  const { data: activeUsers = [] } = useActiveUsers();
  const { data: pendingUsers = [] } = usePendingUsers();

  // Sample data - in real app, these would come from API endpoints
  const systemMetrics = {
    totalUsers: activeUsers.length + pendingUsers.length,
    newUsersToday: 3,
    totalProducts: 1247,
    lowStockItems: 23,
    totalSales: 156780,
    salesGrowth: 12.5,
    activeOrders: 42,
    systemUptime: "99.9%",
  };

  const recentActivity = [
    {
      id: 1,
      action: "New user registration",
      user: "john.doe@example.com",
      time: "2 minutes ago",
      type: "user",
    },
    {
      id: 2,
      action: "Product added",
      user: "manager@example.com",
      time: "15 minutes ago",
      type: "product",
    },
    {
      id: 3,
      action: "Order completed",
      user: "staff@example.com",
      time: "32 minutes ago",
      type: "sale",
    },
    {
      id: 4,
      action: "User approved",
      user: "admin@example.com",
      time: "1 hour ago",
      type: "approval",
    },
    {
      id: 5,
      action: "Low stock alert",
      user: "System",
      time: "2 hours ago",
      type: "alert",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <IconUsers className="h-4 w-4 text-blue-600" />;
      case "product":
        return <IconPackages className="h-4 w-4 text-green-600" />;
      case "sale":
        return <IconShoppingCart className="h-4 w-4 text-purple-600" />;
      case "approval":
        return <IconActivity className="h-4 w-4 text-orange-600" />;
      case "alert":
        return <IconAlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <IconActivity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "user":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            User
          </Badge>
        );
      case "product":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Product
          </Badge>
        );
      case "sale":
        return (
          <Badge
            variant="outline"
            className="text-purple-600 border-purple-200"
          >
            Sale
          </Badge>
        );
      case "approval":
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-200"
          >
            Approval
          </Badge>
        );
      case "alert":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Alert
          </Badge>
        );
      default:
        return <Badge variant="outline">System</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid - Beautiful Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/50 dark:bg-blue-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {systemMetrics.totalUsers}
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">
                +{systemMetrics.newUsersToday} new today
              </div>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((systemMetrics.newUsersToday / 10) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Total Products Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/50 dark:bg-green-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconPackages className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {systemMetrics.totalProducts}
              </div>
              <div className="text-xs text-green-600/70 dark:text-green-400/70 mb-1">
                {systemMetrics.lowStockItems} low stock
              </div>
            </div>
            {systemMetrics.lowStockItems > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600/80 dark:text-green-400/80">
                  Requires attention
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Sales Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/50 dark:bg-purple-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconCurrencyNaira className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Monthly Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(systemMetrics.totalSales)}
              </div>
              <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mb-1">
                +{systemMetrics.salesGrowth}% growth
              </div>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-3">
              <div
                className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(systemMetrics.salesGrowth, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* System Uptime Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/50 dark:bg-emerald-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconActivity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {systemMetrics.systemUptime}
                </span>
              </div>
            </div>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-3">
              Last 30 days
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center">
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  API
                </div>
                <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-1 mt-1">
                  <div className="bg-emerald-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  DB
                </div>
                <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-1 mt-1">
                  <div className="bg-emerald-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  Cache
                </div>
                <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-1 mt-1">
                  <div className="bg-emerald-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartLine className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <IconUsers className="h-4 w-4" />
                Review Pending Users
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{pendingUsers.length}</Badge>
                <IconArrowRight className="h-4 w-4" />
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4" />
                Check Low Stock Items
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{systemMetrics.lowStockItems}</Badge>
                <IconArrowRight className="h-4 w-4" />
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <IconShoppingCart className="h-4 w-4" />
                View Recent Orders
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{systemMetrics.activeOrders}</Badge>
                <IconArrowRight className="h-4 w-4" />
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <IconDatabase className="h-4 w-4" />
                System Health Check
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  Healthy
                </Badge>
                <IconArrowRight className="h-4 w-4" />
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconActivity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {activity.action}
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.user}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
