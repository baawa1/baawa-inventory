'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconUsers,
  IconUserCheck,
  IconShield,
  IconSettings,
} from '@tabler/icons-react';

// Import admin components
import { AdminOverview } from './AdminOverview';
import { UserManagement } from './UserManagement';
import { SystemSettings } from './SystemSettings';

// Import hooks
import { useActiveUsers, usePendingUsers } from '@/hooks/api/users';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user counts for navigation badges
  const { data: activeUsers = [] } = useActiveUsers();
  const { data: pendingUsers = [] } = usePendingUsers();

  const navigationTabs = [
    {
      value: 'overview',
      label: 'Overview',
      icon: IconShield,
      component: AdminOverview,
    },
    {
      value: 'users',
      label: 'User Management',
      icon: IconUsers,
      badge: activeUsers.length,
      component: UserManagement,
    },
    {
      value: 'pending',
      label: 'Pending Approvals',
      icon: IconUserCheck,
      badge: pendingUsers.length,
      badgeVariant: 'destructive' as const,
      component: UserManagement,
    },
    {
      value: 'settings',
      label: 'System Settings',
      icon: IconSettings,
      component: SystemSettings,
    },
  ];

  const activeTabData = navigationTabs.find(tab => tab.value === activeTab);
  const ActiveComponent = activeTabData?.component || AdminOverview;

  return (
    <div data-testid="admin-dashboard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">
            Manage users, approve registrations, and configure system settings
          </p>
        </div>
        <Card className="px-4 py-2">
          <div className="flex items-center gap-2">
            <IconShield className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Admin Panel</span>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-4">
          {navigationTabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex min-h-[2.5rem] items-center justify-center gap-2 px-3 py-2"
              >
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge
                    variant={tab.badgeVariant || 'default'}
                    className="ml-1 h-5 flex-shrink-0 px-1.5 text-xs"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Content */}
        {navigationTabs.map(tab => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="mt-6 space-y-4"
          >
            <ActiveComponent activeTab={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
