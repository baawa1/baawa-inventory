"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconUsers,
  IconTrash,
  IconUserCheck,
  IconUserX,
  IconMail,
  IconDatabase,
  IconCloudUpload,
  IconDownload,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconSettings,
  IconFileText,
  IconBrandTabler,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/useAdminGuard";

interface BulkOperation {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "users" | "data" | "system" | "maintenance";
  risk: "low" | "medium" | "high";
  estimatedTime: string;
  requiresConfirmation: boolean;
}

interface OperationStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  message: string;
  startTime?: Date;
  endTime?: Date;
}

export function BulkOperations() {
  const { isAdmin } = useAdminGuard();
  const [selectedOperation, setSelectedOperation] =
    useState<BulkOperation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [operationParams, setOperationParams] = useState<
    Record<string, string>
  >({});
  const [runningOperations, setRunningOperations] = useState<OperationStatus[]>(
    []
  );

  const bulkOperations: BulkOperation[] = [
    // User Operations
    {
      id: "bulk-approve-users",
      title: "Bulk Approve Users",
      description: "Approve multiple pending users at once",
      icon: <IconUserCheck className="h-5 w-5" />,
      category: "users",
      risk: "medium",
      estimatedTime: "2-5 minutes",
      requiresConfirmation: true,
    },
    {
      id: "bulk-reject-users",
      title: "Bulk Reject Users",
      description: "Reject multiple pending users with reason",
      icon: <IconUserX className="h-5 w-5" />,
      category: "users",
      risk: "high",
      estimatedTime: "2-5 minutes",
      requiresConfirmation: true,
    },
    {
      id: "bulk-deactivate-users",
      title: "Bulk Deactivate Users",
      description: "Deactivate multiple user accounts",
      icon: <IconUsers className="h-5 w-5" />,
      category: "users",
      risk: "high",
      estimatedTime: "1-3 minutes",
      requiresConfirmation: true,
    },
    {
      id: "send-notification-emails",
      title: "Send Notification Emails",
      description: "Send bulk emails to selected user groups",
      icon: <IconMail className="h-5 w-5" />,
      category: "users",
      risk: "low",
      estimatedTime: "5-10 minutes",
      requiresConfirmation: true,
    },

    // Data Operations
    {
      id: "cleanup-expired-sessions",
      title: "Cleanup Expired Sessions",
      description: "Remove expired user sessions from database",
      icon: <IconTrash className="h-5 w-5" />,
      category: "data",
      risk: "low",
      estimatedTime: "1-2 minutes",
      requiresConfirmation: false,
    },
    {
      id: "cleanup-audit-logs",
      title: "Cleanup Old Audit Logs",
      description: "Archive or delete audit logs older than specified date",
      icon: <IconFileText className="h-5 w-5" />,
      category: "data",
      risk: "medium",
      estimatedTime: "5-15 minutes",
      requiresConfirmation: true,
    },
    {
      id: "export-user-data",
      title: "Export User Data",
      description: "Generate comprehensive user data export",
      icon: <IconDownload className="h-5 w-5" />,
      category: "data",
      risk: "low",
      estimatedTime: "3-10 minutes",
      requiresConfirmation: false,
    },

    // System Operations
    {
      id: "refresh-system-cache",
      title: "Refresh System Cache",
      description: "Clear and rebuild application cache",
      icon: <IconRefresh className="h-5 w-5" />,
      category: "system",
      risk: "low",
      estimatedTime: "30 seconds",
      requiresConfirmation: false,
    },
    {
      id: "database-optimization",
      title: "Database Optimization",
      description: "Optimize database indexes and clean up fragmentation",
      icon: <IconDatabase className="h-5 w-5" />,
      category: "system",
      risk: "medium",
      estimatedTime: "10-30 minutes",
      requiresConfirmation: true,
    },
    {
      id: "backup-database",
      title: "Create Database Backup",
      description: "Generate full database backup",
      icon: <IconCloudUpload className="h-5 w-5" />,
      category: "maintenance",
      risk: "low",
      estimatedTime: "5-20 minutes",
      requiresConfirmation: false,
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "users":
        return "bg-blue-100 text-blue-700";
      case "data":
        return "bg-purple-100 text-purple-700";
      case "system":
        return "bg-orange-100 text-orange-700";
      case "maintenance":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <IconClock className="h-4 w-4 text-yellow-600" />;
      case "running":
        return <IconRefresh className="h-4 w-4 text-blue-600 animate-spin" />;
      case "completed":
        return <IconCheck className="h-4 w-4 text-green-600" />;
      case "failed":
        return <IconX className="h-4 w-4 text-red-600" />;
      default:
        return <IconClock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleOperationClick = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    setOperationParams({});
    setIsDialogOpen(true);
  };

  const handleOperationConfirm = () => {
    if (!selectedOperation) return;

    if (selectedOperation.requiresConfirmation) {
      setIsConfirmDialogOpen(true);
    } else {
      executeOperation();
    }
  };

  const executeOperation = async () => {
    if (!selectedOperation) return;

    const operationStatus: OperationStatus = {
      id: selectedOperation.id + "-" + Date.now(),
      status: "running",
      progress: 0,
      message: "Starting operation...",
      startTime: new Date(),
    };

    setRunningOperations((prev) => [...prev, operationStatus]);
    setIsDialogOpen(false);
    setIsConfirmDialogOpen(false);

    try {
      // Simulate operation execution
      await simulateOperation(operationStatus.id);

      setRunningOperations((prev) =>
        prev.map((op) =>
          op.id === operationStatus.id
            ? {
                ...op,
                status: "completed",
                progress: 100,
                message: "Operation completed successfully",
                endTime: new Date(),
              }
            : op
        )
      );

      toast.success(`${selectedOperation.title} completed successfully`);
    } catch (error) {
      setRunningOperations((prev) =>
        prev.map((op) =>
          op.id === operationStatus.id
            ? {
                ...op,
                status: "failed",
                message:
                  error instanceof Error ? error.message : "Operation failed",
                endTime: new Date(),
              }
            : op
        )
      );

      toast.error(`${selectedOperation.title} failed`);
    }

    setSelectedOperation(null);
  };

  const simulateOperation = async (operationId: string) => {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setRunningOperations((prev) =>
        prev.map((op) =>
          op.id === operationId
            ? {
                ...op,
                progress: (i / steps) * 100,
                message: `Processing step ${i} of ${steps}...`,
              }
            : op
        )
      );
    }
  };

  const removeOperation = (operationId: string) => {
    setRunningOperations((prev) => prev.filter((op) => op.id !== operationId));
  };

  if (!isAdmin) {
    return null;
  }

  const categoryOperations = {
    users: bulkOperations.filter((op) => op.category === "users"),
    data: bulkOperations.filter((op) => op.category === "data"),
    system: bulkOperations.filter((op) => op.category === "system"),
    maintenance: bulkOperations.filter((op) => op.category === "maintenance"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bulk Operations</h2>
        <p className="text-muted-foreground">
          Perform mass data operations and system maintenance tasks
        </p>
      </div>

      {/* Running Operations */}
      {runningOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5" />
              Running Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {runningOperations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(operation.status)}
                    <div>
                      <p className="font-medium">{operation.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {operation.startTime?.toLocaleTimeString()}
                        {operation.endTime &&
                          ` - ${operation.endTime.toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {operation.status === "running" && (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${operation.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(operation.progress)}%
                        </span>
                      </div>
                    )}
                    {(operation.status === "completed" ||
                      operation.status === "failed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeOperation(operation.id)}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Categories */}
      {Object.entries(categoryOperations).map(([category, operations]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 capitalize">
              <IconBrandTabler className="h-5 w-5" />
              {category} Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOperationClick(operation)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getCategoryColor(operation.category)}`}
                      >
                        {operation.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{operation.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {operation.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={getRiskColor(operation.risk)}
                      >
                        {operation.risk} risk
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {operation.estimatedTime}
                      </Badge>
                    </div>
                    {operation.requiresConfirmation && (
                      <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Operation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOperation?.title}</DialogTitle>
            <DialogDescription>
              {selectedOperation?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedOperation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Risk Level:</span>
                <Badge className={getRiskColor(selectedOperation.risk)}>
                  {selectedOperation.risk}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Estimated Time:</span>
                <span>{selectedOperation.estimatedTime}</span>
              </div>

              {/* Operation-specific parameters */}
              {selectedOperation.id === "bulk-reject-users" && (
                <div>
                  <label className="text-sm font-medium">
                    Rejection Reason
                  </label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={operationParams.reason || ""}
                    onChange={(e) =>
                      setOperationParams((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {selectedOperation.id === "cleanup-audit-logs" && (
                <div>
                  <label className="text-sm font-medium">Days to Keep</label>
                  <Input
                    type="number"
                    placeholder="90"
                    value={operationParams.daysToKeep || ""}
                    onChange={(e) =>
                      setOperationParams((prev) => ({
                        ...prev,
                        daysToKeep: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {selectedOperation.id === "send-notification-emails" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Target Group</label>
                    <Select
                      value={operationParams.targetGroup || ""}
                      onValueChange={(value) =>
                        setOperationParams((prev) => ({
                          ...prev,
                          targetGroup: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="admins">Admins Only</SelectItem>
                        <SelectItem value="managers">Managers Only</SelectItem>
                        <SelectItem value="staff">Staff Only</SelectItem>
                        <SelectItem value="pending">Pending Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      placeholder="Enter notification message..."
                      value={operationParams.message || ""}
                      onChange={(e) =>
                        setOperationParams((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOperationConfirm}>
              {selectedOperation?.requiresConfirmation ? "Continue" : "Execute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirm Operation
            </AlertDialogTitle>
            <AlertDialogDescription>
              This operation cannot be undone. Are you sure you want to proceed
              with "{selectedOperation?.title}"?
              {selectedOperation?.risk === "high" && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <strong>High Risk Operation:</strong> This action may have
                  significant impact on the system.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeOperation}>
              Yes, Execute Operation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
