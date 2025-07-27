'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconFileAnalytics,
  IconDownload,
  IconCalendar,
  IconUsers,
  IconCurrencyNaira,
  IconFileText,
  IconClock,
  IconRefresh,
  IconDatabase,
  IconShield,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

interface ReportMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

export function BusinessReports() {
  const [reportPeriod, setReportPeriod] = useState('30days');
  const [reportType, setReportType] = useState('overview');

  // Admin-focused metrics - removed product/transaction specific metrics
  const metrics: ReportMetric[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(2847500),
      change: 12.5,
      trend: 'up',
      icon: <IconCurrencyNaira className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      title: 'Active Users',
      value: 156,
      change: 8.2,
      trend: 'up',
      icon: <IconUsers className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      title: 'New Registrations',
      value: 23,
      change: -3.1,
      trend: 'down',
      icon: <IconUsers className="h-5 w-5" />,
      color: 'text-purple-600',
    },
    {
      title: 'System Health',
      value: '98.5%',
      change: 0.5,
      trend: 'up',
      icon: <IconDatabase className="h-5 w-5" />,
      color: 'text-orange-600',
    },
  ];

  // Admin-focused reports - removed product/sales specific reports
  const reports = [
    {
      id: 1,
      name: 'User Activity Report',
      description: 'User engagement, login patterns, and activity metrics',
      lastGenerated: '2024-01-15T09:30:00Z',
      type: 'users',
      status: 'ready',
    },
    {
      id: 2,
      name: 'Security Audit Report',
      description: 'Authentication logs, failed attempts, security events',
      lastGenerated: '2024-01-14T16:45:00Z',
      type: 'security',
      status: 'ready',
    },
    {
      id: 3,
      name: 'System Performance Report',
      description: 'Database performance, API response times, error rates',
      lastGenerated: '2024-01-14T12:20:00Z',
      type: 'system',
      status: 'ready',
    },
    {
      id: 4,
      name: 'Financial Summary',
      description: 'Overall revenue analysis and financial metrics',
      lastGenerated: '2024-01-13T18:00:00Z',
      type: 'financial',
      status: 'generating',
    },
  ];

  const generateReport = (_reportId: number) => {
    // Debug logging removed for production
    // Implementation for report generation
  };

  const downloadReport = (_reportId: number) => {
    // Debug logging removed for production
    // Implementation for report download
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            Ready
          </Badge>
        );
      case 'generating':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-700">
            Generating
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Business Reports
          </h2>
          <p className="text-muted-foreground">
            Administrative reports and system analytics
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm">
            <IconCalendar className="mr-2 h-4 w-4" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Key Metrics - Beautiful Gradient Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 hover:shadow-lg dark:from-green-950 dark:to-green-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-green-200/50 dark:bg-green-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-green-700 dark:text-green-300">
              <div className="rounded-lg bg-green-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-green-800">
                <IconCurrencyNaira className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {metrics[0].value}
              </div>
              <div className="mb-1 text-xs text-green-600/70 dark:text-green-400/70">
                +{metrics[0].change}% growth
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-green-200 dark:bg-green-800">
              <div
                className="h-2 rounded-full bg-green-600 transition-all duration-500 dark:bg-green-400"
                style={{
                  width: `${Math.min(metrics[0].change, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 hover:shadow-lg dark:from-blue-950 dark:to-blue-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-blue-200/50 dark:bg-blue-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-blue-700 dark:text-blue-300">
              <div className="rounded-lg bg-blue-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-800">
                <IconUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {metrics[1].value}
              </div>
              <div className="mb-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                +{metrics[1].change}% growth
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
                style={{
                  width: `${Math.min(metrics[1].change, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* New Registrations Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-300 hover:shadow-lg dark:from-purple-950 dark:to-purple-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-purple-200/50 dark:bg-purple-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-purple-700 dark:text-purple-300">
              <div className="rounded-lg bg-purple-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-800">
                <IconUsers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              New Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {metrics[2].value}
              </div>
              <div className="mb-1 text-xs text-purple-600/70 dark:text-purple-400/70">
                {metrics[2].change > 0 ? '+' : ''}
                {metrics[2].change}% change
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-purple-200 dark:bg-purple-800">
              <div
                className="h-2 rounded-full bg-purple-600 transition-all duration-500 dark:bg-purple-400"
                style={{
                  width: `${Math.min(Math.abs(metrics[2].change), 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 transition-all duration-300 hover:shadow-lg dark:from-orange-950 dark:to-orange-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-orange-200/50 dark:bg-orange-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-orange-700 dark:text-orange-300">
              <div className="rounded-lg bg-orange-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-orange-800">
                <IconDatabase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {metrics[3].value}
              </div>
              <div className="mb-1 text-xs text-orange-600/70 dark:text-orange-400/70">
                +{metrics[3].change}% improvement
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-orange-200 dark:bg-orange-800">
              <div
                className="h-2 rounded-full bg-orange-600 transition-all duration-500 dark:bg-orange-400"
                style={{
                  width: `${Math.min(metrics[3].change * 20, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileAnalytics className="h-5 w-5" />
            Available Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reports.map(report => (
              <div key={report.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-muted-foreground text-sm">
                      {report.description}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <IconClock className="h-3 w-3" />
                      Last generated:{' '}
                      {new Date(report.lastGenerated).toLocaleDateString()}
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReport(report.id)}
                    disabled={report.status === 'generating'}
                  >
                    <IconRefresh className="mr-1 h-3 w-3" />
                    {report.status === 'generating'
                      ? 'Generating...'
                      : 'Regenerate'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => downloadReport(report.id)}
                    disabled={report.status !== 'ready'}
                  >
                    <IconDownload className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <IconUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">User Analytics</h3>
                <p className="text-muted-foreground text-sm">
                  User activity, registrations, engagement metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <IconShield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Security Reports</h3>
                <p className="text-muted-foreground text-sm">
                  Authentication logs, security events, audit trails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <IconDatabase className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">System Reports</h3>
                <p className="text-muted-foreground text-sm">
                  Performance metrics, error logs, system health
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Quick Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <IconDownload className="mr-2 h-4 w-4" />
              Export Users (CSV)
            </Button>

            <Button variant="outline" className="justify-start">
              <IconDownload className="mr-2 h-4 w-4" />
              Export Audit Logs (CSV)
            </Button>

            <Button variant="outline" className="justify-start">
              <IconDownload className="mr-2 h-4 w-4" />
              Export Analytics (PDF)
            </Button>

            <Button variant="outline" className="justify-start">
              <IconDownload className="mr-2 h-4 w-4" />
              System Report (Excel)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
