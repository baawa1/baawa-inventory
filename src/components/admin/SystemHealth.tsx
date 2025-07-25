"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconActivity,
  IconDatabase,
  IconServer,
  IconCloud,
  IconShield,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconCpu,
  IconWifi,
  IconClock,
} from "@tabler/icons-react";

interface SystemMetric {
  name: string;
  value: number;
  status: "healthy" | "warning" | "critical";
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
}

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  uptime: string;
  lastCheck: string;
  responseTime: number;
}

export function SystemHealth() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sample system metrics - in real app, this would come from monitoring APIs
  const systemMetrics: SystemMetric[] = [
    {
      name: "CPU Usage",
      value: 45,
      status: "healthy",
      unit: "%",
      threshold: { warning: 70, critical: 90 },
    },
    {
      name: "Memory Usage",
      value: 68,
      status: "healthy",
      unit: "%",
      threshold: { warning: 80, critical: 95 },
    },
    {
      name: "Disk Usage",
      value: 34,
      status: "healthy",
      unit: "%",
      threshold: { warning: 85, critical: 95 },
    },
    {
      name: "Network Latency",
      value: 23,
      status: "healthy",
      unit: "ms",
      threshold: { warning: 100, critical: 200 },
    },
  ];

  const services: ServiceStatus[] = [
    {
      name: "Database",
      status: "online",
      uptime: "99.9%",
      lastCheck: "1 min ago",
      responseTime: 12,
    },
    {
      name: "API Server",
      status: "online",
      uptime: "99.8%",
      lastCheck: "1 min ago",
      responseTime: 45,
    },
    {
      name: "Email Service",
      status: "online",
      uptime: "98.7%",
      lastCheck: "2 min ago",
      responseTime: 156,
    },
    {
      name: "File Storage",
      status: "degraded",
      uptime: "97.2%",
      lastCheck: "5 min ago",
      responseTime: 234,
    },
    {
      name: "Background Jobs",
      status: "online",
      uptime: "99.5%",
      lastCheck: "1 min ago",
      responseTime: 89,
    },
  ];

  const recentEvents = [
    {
      id: 1,
      type: "info",
      message: "Database backup completed successfully",
      timestamp: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      type: "warning",
      message: "High memory usage detected on server-2",
      timestamp: "2024-01-15T09:45:00Z",
    },
    {
      id: 3,
      type: "success",
      message: "System update deployed successfully",
      timestamp: "2024-01-15T08:20:00Z",
    },
    {
      id: 4,
      type: "error",
      message: "Temporary connection issue with external API",
      timestamp: "2024-01-15T07:15:00Z",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "healthy":
        return <IconCheck className="h-4 w-4 text-green-600" />;
      case "warning":
      case "degraded":
        return <IconAlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
      case "offline":
        return <IconX className="h-4 w-4 text-red-600" />;
      default:
        return <IconActivity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
      case "healthy":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            Healthy
          </Badge>
        );
      case "warning":
      case "degraded":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            Warning
          </Badge>
        );
      case "critical":
      case "offline":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getMetricStatus = (
    metric: SystemMetric
  ): "healthy" | "warning" | "critical" => {
    if (metric.value >= metric.threshold.critical) return "critical";
    if (metric.value >= metric.threshold.warning) return "warning";
    return "healthy";
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "success":
        return <IconCheck className="h-4 w-4 text-green-600" />;
      case "warning":
        return <IconAlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <IconX className="h-4 w-4 text-red-600" />;
      default:
        return <IconActivity className="h-4 w-4 text-blue-600" />;
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">
            Monitor system performance and service status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <IconRefresh
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview - Beautiful Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Status Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/50 dark:bg-green-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconServer className="h-5 w-5 text-green-600 dark:text-green-400" />
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
            <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-3">
              All systems operational
            </div>
          </CardContent>
        </Card>

        {/* Uptime Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/50 dark:bg-blue-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                99.9%
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">
                last 30 days
              </div>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: "99.9%",
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/50 dark:bg-purple-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconShield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  Secure
                </span>
              </div>
            </div>
            <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-3">
              No security threats detected
            </div>
          </CardContent>
        </Card>

        {/* Connectivity Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/50 dark:bg-orange-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconWifi className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              Connectivity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  Stable
                </span>
              </div>
            </div>
            <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-3">
              Network performance optimal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCpu className="h-5 w-5" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemMetrics.map((metric, index) => {
              const status = getMetricStatus(metric);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm">
                        {metric.value}
                        {metric.unit}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status === "critical" ? "bg-red-500" : status === "warning" ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0{metric.unit}</span>
                    <span>100{metric.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCloud className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Uptime: {service.uptime} • Response:{" "}
                      {service.responseTime}ms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(service.status)}
                  <span className="text-xs text-muted-foreground">
                    {service.lastCheck}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
              >
                {getEventIcon(event.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconDatabase className="h-4 w-4 text-blue-600" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Query Time</span>
                <span className="font-medium">12ms avg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Connections</span>
                <span className="font-medium">45/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache Hit Rate</span>
                <span className="font-medium text-green-600">98.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconDatabase className="h-4 w-4 text-green-600" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span className="font-medium">6.8 GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available</span>
                <span className="font-medium">3.2 GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache</span>
                <span className="font-medium">2.1 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconServer className="h-4 w-4 text-orange-600" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span className="font-medium">340 GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available</span>
                <span className="font-medium">660 GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Backup Size</span>
                <span className="font-medium">125 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
