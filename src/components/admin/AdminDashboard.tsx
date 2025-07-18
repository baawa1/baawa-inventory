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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconUsers className="h-4 w-4 text-blue-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconUserCheck className="h-4 w-4 text-orange-600" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconUserX className="h-4 w-4 text-gray-600" />
              Deactivated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {deactivatedUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconDatabase className="h-4 w-4 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-green-600">Healthy</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {navigationTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1 text-xs"
              >
                <IconComponent className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge
                    variant={tab.badgeVariant || "default"}
                    className="ml-1 h-4 px-1 text-xs"
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
