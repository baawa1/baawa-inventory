"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconClipboardList,
  IconSettings,
  IconShield,
  IconChartLine,
  IconDatabase,
  IconActivity,
  IconFileAnalytics,
} from "@tabler/icons-react";

// Import admin components
import { AdminOverview } from "./AdminOverview";
import { UserManagement } from "./UserManagement";
import { PendingUsersManagement } from "./PendingUsersManagement";
import { DeactivatedUsersManagement } from "./DeactivatedUsersManagement";
import { BulkOperations } from "./BulkOperations";
import { SystemSettings } from "./SystemSettings";
import { AuditLogs } from "./AuditLogs";
import { BusinessReports } from "./BusinessReports";
import { SystemHealth } from "./SystemHealth";

// Import hooks
import {
  useActiveUsers,
  usePendingUsers,
  useDeactivatedUsers,
} from "@/hooks/api/users";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user counts for navigation badges
  const { data: activeUsers = [] } = useActiveUsers();
  const { data: pendingUsers = [] } = usePendingUsers();
  const { data: deactivatedUsers = [] } = useDeactivatedUsers();

  const navigationTabs = [
    {
      value: "overview",
      label: "Overview",
      icon: IconChartLine,
      component: AdminOverview,
    },
    {
      value: "users",
      label: "Active Users",
      icon: IconUsers,
      badge: activeUsers.length,
      component: UserManagement,
    },
    {
      value: "pending",
      label: "Pending Approvals",
      icon: IconUserCheck,
      badge: pendingUsers.length,
      badgeVariant: "destructive" as const,
      component: PendingUsersManagement,
    },
    {
      value: "deactivated",
      label: "Deactivated",
      icon: IconUserX,
      badge: deactivatedUsers.length,
      badgeVariant: "secondary" as const,
      component: DeactivatedUsersManagement,
    },
    {
      value: "bulk",
      label: "Bulk Operations",
      icon: IconDatabase,
      component: BulkOperations,
    },
    {
      value: "audit",
      label: "Audit Logs",
      icon: IconClipboardList,
      component: AuditLogs,
    },
    {
      value: "reports",
      label: "Reports",
      icon: IconFileAnalytics,
      component: BusinessReports,
    },
    {
      value: "system",
      label: "System Health",
      icon: IconActivity,
      component: SystemHealth,
    },
    {
      value: "settings",
      label: "Settings",
      icon: IconSettings,
      component: SystemSettings,
    },
  ];

  const activeTabData = navigationTabs.find((tab) => tab.value === activeTab);
  const ActiveComponent = activeTabData?.component || AdminOverview;

  return (
    <div data-testid="admin-dashboard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">
            Manage users, system settings, and monitor application health
          </p>
        </div>
        <Card className="px-4 py-2">
          <div className="flex items-center gap-2">
            <IconShield className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Admin Panel</span>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/50 dark:bg-blue-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {activeUsers.length}
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">
                users online
              </div>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((activeUsers.length / 20) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/50 dark:bg-orange-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconUserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {pendingUsers.length}
              </div>
              <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mb-1">
                awaiting review
              </div>
            </div>
            {pendingUsers.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-orange-600/80 dark:text-orange-400/80">
                  Requires attention
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deactivated Users Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200/50 dark:bg-gray-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconUserX className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              Deactivated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {deactivatedUsers.length}
              </div>
              <div className="text-xs text-gray-600/70 dark:text-gray-400/70 mb-1">
                inactive accounts
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              {deactivatedUsers.length === 0
                ? "All users active"
                : "Manage inactive users"}
            </div>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/50 dark:bg-green-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconDatabase className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Healthy
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center">
                <div className="text-xs text-green-600/70 dark:text-green-400/70">
                  API
                </div>
                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1 mt-1">
                  <div className="bg-green-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-green-600/70 dark:text-green-400/70">
                  DB
                </div>
                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1 mt-1">
                  <div className="bg-green-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-green-600/70 dark:text-green-400/70">
                  Cache
                </div>
                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1 mt-1">
                  <div className="bg-green-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto">
          {navigationTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center justify-center gap-1 text-xs min-h-[2.5rem] px-2 py-2"
              >
                <IconComponent className="h-3 w-3 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{tab.label}</span>
                <span className="sm:hidden text-[10px] truncate">
                  {tab.label.split(" ")[0]}
                </span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge
                    variant={tab.badgeVariant || "default"}
                    className="ml-1 h-4 px-1 text-xs flex-shrink-0"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Content */}
        {navigationTabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="space-y-4 mt-6"
          >
            <ActiveComponent />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
