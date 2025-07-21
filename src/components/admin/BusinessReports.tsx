"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";

interface ReportMetric {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

export function BusinessReports() {
  const [reportPeriod, setReportPeriod] = useState("30days");
  const [reportType, setReportType] = useState("overview");

  // Admin-focused metrics - removed product/transaction specific metrics
  const metrics: ReportMetric[] = [
    {
      title: "Total Revenue",
      value: formatCurrency(2847500),
      change: 12.5,
      trend: "up",
      icon: <IconCurrencyNaira className="h-5 w-5" />,
      color: "text-green-600",
    },
    {
      title: "Active Users",
      value: 156,
      change: 8.2,
      trend: "up",
      icon: <IconUsers className="h-5 w-5" />,
      color: "text-blue-600",
    },
    {
      title: "New Registrations",
      value: 23,
      change: -3.1,
      trend: "down",
      icon: <IconUsers className="h-5 w-5" />,
      color: "text-purple-600",
    },
    {
      title: "System Health",
      value: "98.5%",
      change: 0.5,
      trend: "up",
      icon: <IconDatabase className="h-5 w-5" />,
      color: "text-orange-600",
    },
  ];

  // Admin-focused reports - removed product/sales specific reports
  const reports = [
    {
      id: 1,
      name: "User Activity Report",
      description: "User engagement, login patterns, and activity metrics",
      lastGenerated: "2024-01-15T09:30:00Z",
      type: "users",
      status: "ready",
    },
    {
      id: 2,
      name: "Security Audit Report",
      description: "Authentication logs, failed attempts, security events",
      lastGenerated: "2024-01-14T16:45:00Z",
      type: "security",
      status: "ready",
    },
    {
      id: 3,
      name: "System Performance Report",
      description: "Database performance, API response times, error rates",
      lastGenerated: "2024-01-14T12:20:00Z",
      type: "system",
      status: "ready",
    },
    {
      id: 4,
      name: "Financial Summary",
      description: "Overall revenue analysis and financial metrics",
      lastGenerated: "2024-01-13T18:00:00Z",
      type: "financial",
      status: "generating",
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
      case "ready":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            Ready
          </Badge>
        );
      case "generating":
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
            <IconCalendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Key Metrics - Beautiful Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/50 dark:bg-green-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
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
              <div className="text-xs text-green-600/70 dark:text-green-400/70 mb-1">
                +{metrics[0].change}% growth
              </div>
            </div>
            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-3">
              <div
                className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(metrics[0].change, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

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
                {metrics[1].value}
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">
                +{metrics[1].change}% growth
              </div>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(metrics[1].change, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* New Registrations Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/50 dark:bg-purple-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
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
              <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mb-1">
                {metrics[2].change > 0 ? "+" : ""}
                {metrics[2].change}% change
              </div>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-3">
              <div
                className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.abs(metrics[2].change), 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/50 dark:bg-orange-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
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
              <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mb-1">
                +{metrics[3].change}% improvement
              </div>
            </div>
            <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2 mt-3">
              <div
                className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all duration-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconClock className="h-3 w-3" />
                      Last generated:{" "}
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
                    disabled={report.status === "generating"}
                  >
                    <IconRefresh className="h-3 w-3 mr-1" />
                    {report.status === "generating"
                      ? "Generating..."
                      : "Regenerate"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => downloadReport(report.id)}
                    disabled={report.status !== "ready"}
                  >
                    <IconDownload className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IconUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">User Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  User activity, registrations, engagement metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <IconShield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Security Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Authentication logs, security events, audit trails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IconDatabase className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">System Reports</h3>
                <p className="text-sm text-muted-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="justify-start">
              <IconDownload className="h-4 w-4 mr-2" />
              Export Users (CSV)
            </Button>

            <Button variant="outline" className="justify-start">
              <IconDownload className="h-4 w-4 mr-2" />
              Export Audit Logs (CSV)
            </Button>

            <Button variant="outline" className="justify-start">
              <IconDownload className="h-4 w-4 mr-2" />
              Export Analytics (PDF)
            </Button>

            <Button variant="outline" className="justify-start">
              <IconDownload className="h-4 w-4 mr-2" />
              System Report (Excel)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
