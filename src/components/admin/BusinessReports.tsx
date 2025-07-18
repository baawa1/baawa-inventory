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
  IconTrendingUp,
  IconTrendingDown,
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

  const generateReport = (reportId: number) => {
    console.log("Generating report:", reportId);
    // Implementation for report generation
  };

  const downloadReport = (reportId: number) => {
    console.log("Downloading report:", reportId);
    // Implementation for report download
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <IconTrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <IconTrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <IconTrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-muted/30 ${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {getTrendIcon(metric.trend)}
                <span
                  className={`text-sm font-medium ${getTrendColor(
                    metric.trend
                  )}`}
                >
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}%
                </span>
                <span className="text-sm text-muted-foreground">
                  from last period
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
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
