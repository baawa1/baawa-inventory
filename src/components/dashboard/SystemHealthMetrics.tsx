'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconActivity,
  IconDatabase,
  IconServer,
  IconWifi,
  IconShield,
  IconClock,
  IconRefresh,
  IconAlertTriangle,
} from '@tabler/icons-react';

export function SystemHealthMetrics() {
  const systemMetrics = [
    {
      name: 'Database',
      status: 'healthy',
      uptime: '99.9%',
      lastCheck: '1 min ago',
      icon: <IconDatabase className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'API Server',
      status: 'healthy',
      uptime: '99.8%',
      lastCheck: '30 sec ago',
      icon: <IconServer className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Network',
      status: 'healthy',
      uptime: '100%',
      lastCheck: '15 sec ago',
      icon: <IconWifi className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Security',
      status: 'warning',
      uptime: '99.5%',
      lastCheck: '5 min ago',
      icon: <IconShield className="h-4 w-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const performanceMetrics = [
    { label: 'CPU Usage', value: '45%', status: 'normal' },
    { label: 'Memory Usage', value: '62%', status: 'normal' },
    { label: 'Disk Usage', value: '78%', status: 'warning' },
    { label: 'Network I/O', value: '23%', status: 'normal' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-green-100 text-xs text-green-700">Healthy</Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-100 text-xs text-yellow-700">
            Warning
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="text-xs">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  const getPerformanceColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* System Health Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            System Health
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <IconRefresh className="h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${metric.bgColor} ${metric.color}`}
                  >
                    {metric.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{metric.name}</h4>
                    <p className="text-muted-foreground text-xs">
                      Uptime: {metric.uptime}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(metric.status)}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {metric.lastCheck}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconServer className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span
                    className={`text-sm font-semibold ${getPerformanceColor(metric.status)}`}
                  >
                    {metric.value}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full ${
                      metric.status === 'normal'
                        ? 'bg-green-500'
                        : metric.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: metric.value }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <IconClock className="h-4 w-4" />
              View Logs
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <IconAlertTriangle className="h-4 w-4" />
              Check Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
