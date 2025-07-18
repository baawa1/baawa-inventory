"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconClipboardList,
  IconSearch,
  IconDownload,
  IconFilter,
  IconUser,
  IconPackages,
  IconShoppingCart,
  IconSettings,
  IconEye,
  IconCalendar,
} from "@tabler/icons-react";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed" | "pending";
  category: "user" | "product" | "sale" | "system" | "security";
}

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7days");

  // Sample audit logs data - in real app, this would come from API
  const auditLogs: AuditLog[] = [
    {
      id: 1,
      action: "USER_LOGIN",
      entity: "User",
      entityId: "123",
      userId: "admin",
      userName: "Admin User",
      userEmail: "admin@example.com",
      details: "User logged in successfully",
      timestamp: "2024-01-15T10:30:00Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      category: "security",
    },
    {
      id: 2,
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: "P001",
      userId: "manager",
      userName: "Manager User",
      userEmail: "manager@example.com",
      details: "Created new product: Samsung Galaxy S23",
      timestamp: "2024-01-15T09:15:00Z",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      category: "product",
    },
    {
      id: 3,
      action: "USER_APPROVED",
      entity: "User",
      entityId: "456",
      userId: "admin",
      userName: "Admin User",
      userEmail: "admin@example.com",
      details: "Approved user registration for john.doe@example.com",
      timestamp: "2024-01-15T08:45:00Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      category: "user",
    },
    {
      id: 4,
      action: "SALE_COMPLETED",
      entity: "Sale",
      entityId: "S001",
      userId: "staff",
      userName: "Staff User",
      userEmail: "staff@example.com",
      details: "Completed sale transaction for ₦45,000",
      timestamp: "2024-01-15T08:00:00Z",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
      category: "sale",
    },
    {
      id: 5,
      action: "FAILED_LOGIN",
      entity: "User",
      entityId: "789",
      userId: "unknown",
      userName: "Unknown User",
      userEmail: "unknown@example.com",
      details: "Failed login attempt - invalid credentials",
      timestamp: "2024-01-15T07:30:00Z",
      ipAddress: "192.168.1.150",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "failed",
      category: "security",
    },
  ];

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || log.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || log.status === statusFilter;

      // Simple date filtering (in real app, this would be more sophisticated)
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let matchesDate = true;
      if (dateFilter === "today") {
        matchesDate = daysDiff === 0;
      } else if (dateFilter === "7days") {
        matchesDate = daysDiff <= 7;
      } else if (dateFilter === "30days") {
        matchesDate = daysDiff <= 30;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [auditLogs, searchTerm, categoryFilter, statusFilter, dateFilter]);

  const getActionIcon = (category: string) => {
    switch (category) {
      case "user":
        return <IconUser className="h-4 w-4 text-blue-600" />;
      case "product":
        return <IconPackages className="h-4 w-4 text-green-600" />;
      case "sale":
        return <IconShoppingCart className="h-4 w-4 text-purple-600" />;
      case "system":
        return <IconSettings className="h-4 w-4 text-gray-600" />;
      case "security":
        return <IconEye className="h-4 w-4 text-red-600" />;
      default:
        return <IconClipboardList className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            Success
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
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
      case "system":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-200">
            System
          </Badge>
        );
      case "security":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Security
          </Badge>
        );
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const exportLogs = () => {
    // In real app, this would generate and download CSV/Excel file
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,Action,User,Details,Status,Category\n" +
      filteredLogs
        .map(
          (log) =>
            `${log.timestamp},${log.action},${log.userName},${log.details},${log.status},${log.category}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track user actions and system changes for security and compliance
          </p>
        </div>
        <Button onClick={exportLogs}>
          <IconDownload className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, users, details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconClipboardList className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Logs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredLogs.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconUser className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">User Actions</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredLogs.filter((log) => log.category === "user").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconEye className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Security Events</p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    filteredLogs.filter((log) => log.category === "security")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconShoppingCart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Failed Actions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredLogs.filter((log) => log.status === "failed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <IconClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No audit logs found matching your criteria
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getActionIcon(log.category)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {log.action.replace(/_/g, " ")}
                          </h4>
                          {getStatusBadge(log.status)}
                          {getCategoryBadge(log.category)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <IconUser className="h-3 w-3" />
                            {log.userName} ({log.userEmail})
                          </span>
                          <span className="flex items-center gap-1">
                            <IconCalendar className="h-3 w-3" />
                            {formatDate(log.timestamp)}
                          </span>
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
