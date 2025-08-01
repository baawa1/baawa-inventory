'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconShield,
  IconArrowRight,
  IconActivity,
} from '@tabler/icons-react';
import { useActiveUsers, usePendingUsers } from '@/hooks/api/users';
import { useAdminActivity } from '@/hooks/api/admin';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface AdminOverviewProps {
  activeTab?: string;
}

export function AdminOverview({ activeTab: _activeTab }: AdminOverviewProps) {
  const { data: activeUsers = [] } = useActiveUsers();
  const { data: pendingUsers = [] } = usePendingUsers();
  const { data: activityData } = useAdminActivity();

  // Admin-specific metrics only
  const adminMetrics = [
    {
      title: 'Total Users',
      value: activeUsers.length,
      change: 0,
      trend: 'neutral' as const,
      icon: <IconUsers className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      title: 'Pending Approvals',
      value: pendingUsers.length,
      change: 0,
      trend: 'neutral' as const,
      icon: <IconUserCheck className="h-5 w-5" />,
      color: 'text-orange-600',
    },
    {
      title: 'System Status',
      value: 'Healthy',
      change: 0,
      trend: 'neutral' as const,
      icon: <IconShield className="h-5 w-5" />,
      color: 'text-green-600',
    },
  ];

  const recentActivity = activityData?.activities || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <IconUsers className="h-4 w-4 text-blue-600" />;
      case 'approval':
        return <IconUserCheck className="h-4 w-4 text-green-600" />;
      case 'deactivation':
        return <IconUserX className="h-4 w-4 text-red-600" />;
      default:
        return <IconActivity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'user':
        return (
          <Badge variant="outline" className="border-blue-200 text-blue-600">
            Registration
          </Badge>
        );
      case 'approval':
        return (
          <Badge variant="outline" className="border-green-200 text-green-600">
            Approval
          </Badge>
        );
      case 'deactivation':
        return (
          <Badge variant="outline" className="border-red-200 text-red-600">
            Deactivation
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-200 text-gray-600">
            System
          </Badge>
        );
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {adminMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={metric.color}>{metric.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-muted-foreground text-xs">
                {metric.change > 0 ? '+' : ''}
                {metric.change}% from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin?tab=pending">
              <Button variant="outline" className="w-full justify-start">
                <IconUserCheck className="mr-2 h-4 w-4" />
                Review Pending Users
                {pendingUsers.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingUsers.length}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin?tab=users">
              <Button variant="outline" className="w-full justify-start">
                <IconUsers className="mr-2 h-4 w-4" />
                Manage Users
                <IconArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-muted-foreground text-xs">
                        by {activity.user}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getActivityBadge(activity.type)}
                    <span className="text-muted-foreground text-xs">
                      {formatTime(activity.time)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground text-sm">
                  No recent activity
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
