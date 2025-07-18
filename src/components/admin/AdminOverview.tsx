"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconTrendingUp,
  IconUsers,
  IconPackages,
  IconShoppingCart,
  IconCurrencyNaira,
  IconChartLine,
  IconAlertTriangle,
  IconArrowRight,
  IconCalendar,
  IconActivity,
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
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <IconUsers className="h-4 w-4" />
                Total Users
              </span>
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{systemMetrics.newUsersToday} new today
            </p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <IconPackages className="h-4 w-4" />
                Total Products
              </span>
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.lowStockItems} low stock items
            </p>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <IconCurrencyNaira className="h-4 w-4" />
                Monthly Sales
              </span>
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(systemMetrics.totalSales)}
            </div>
            <p className="text-xs text-green-600">
              +{systemMetrics.salesGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <IconActivity className="h-4 w-4" />
                System Uptime
              </span>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics.systemUptime}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
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
                <IconCalendar className="h-4 w-4" />
                Generate Monthly Report
              </span>
              <IconArrowRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <IconActivity className="h-4 w-4" />
                System Health Check
              </span>
              <IconArrowRight className="h-4 w-4" />
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
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getActivityBadge(activity.type)}
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconActivity className="h-4 w-4 text-green-600" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-green-600">
                Healthy
              </span>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked: 1 min ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconShoppingCart className="h-4 w-4 text-blue-600" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-blue-600">
              {systemMetrics.activeOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-yellow-600">2</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
