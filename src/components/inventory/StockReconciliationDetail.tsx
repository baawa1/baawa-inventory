"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconCheck,
  IconX,
  IconEdit,
  IconSend,
  IconTrash,
  IconUser,
  IconCalendar,
  IconFileText,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface StockReconciliationItem {
  id: number;
  systemCount: number;
  physicalCount: number;
  discrepancy: number;
  discrepancyReason?: string;
  estimatedImpact?: number;
  notes?: string;
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
  };
}

interface StockReconciliation {
  id: number;
  title: string;
  description?: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  createdBy: User;
  approvedBy?: User;
  items: StockReconciliationItem[];
}

interface StockReconciliationDetailProps {
  reconciliationId: number;
  userRole: string;
  userId: number;
  onUpdate?: () => void;
}

const statusConfig = {
  DRAFT: { color: "secondary", label: "Draft" },
  PENDING: { color: "warning", label: "Pending" },
  APPROVED: { color: "success", label: "Approved" },
  REJECTED: { color: "destructive", label: "Rejected" },
} as const;

export function StockReconciliationDetail({
  reconciliationId,
  userRole,
  userId,
  onUpdate,
}: StockReconciliationDetailProps) {
  const [reconciliation, setReconciliation] =
    useState<StockReconciliation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const isAdmin = userRole === "ADMIN";

  const fetchReconciliation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}`
      );
      const data = await response.json();

      if (response.ok) {
        setReconciliation(data.reconciliation);
      } else {
        toast.error(data.error || "Failed to fetch reconciliation details");
      }
    } catch (error) {
      console.error("Error fetching reconciliation:", error);
      toast.error("Failed to fetch reconciliation details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, [reconciliationId]);

  const handleSubmitForApproval = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reconciliation submitted for approval");
        fetchReconciliation();
        onUpdate?.();
      } else {
        toast.error(data.error || "Failed to submit reconciliation");
      }
    } catch (error) {
      console.error("Error submitting reconciliation:", error);
      toast.error("Failed to submit reconciliation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: approvalNotes }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reconciliation approved successfully");
        setShowApprovalDialog(false);
        setApprovalNotes("");
        fetchReconciliation();
        onUpdate?.();
      } else {
        toast.error(data.error || "Failed to approve reconciliation");
      }
    } catch (error) {
      console.error("Error approving reconciliation:", error);
      toast.error("Failed to approve reconciliation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reconciliation rejected");
        setShowRejectionDialog(false);
        setRejectionReason("");
        fetchReconciliation();
        onUpdate?.();
      } else {
        toast.error(data.error || "Failed to reject reconciliation");
      }
    } catch (error) {
      console.error("Error rejecting reconciliation:", error);
      toast.error("Failed to reject reconciliation");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading reconciliation details...</div>
        </CardContent>
      </Card>
    );
  }

  if (!reconciliation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Reconciliation not found
          </div>
        </CardContent>
      </Card>
    );
  }

  const canEdit =
    reconciliation.status === "DRAFT" &&
    (isAdmin || reconciliation.createdBy.id === userId);
  const canSubmit =
    reconciliation.status === "DRAFT" &&
    (isAdmin || reconciliation.createdBy.id === userId);
  const canApprove = reconciliation.status === "PENDING" && isAdmin;

  const totalDiscrepancy = reconciliation.items.reduce(
    (total, item) => total + item.discrepancy,
    0
  );
  const totalImpact = reconciliation.items.reduce(
    (total, item) => total + (item.estimatedImpact || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{reconciliation.title}</CardTitle>
              {reconciliation.description && (
                <CardDescription className="mt-2">
                  {reconciliation.description}
                </CardDescription>
              )}
            </div>
            <Badge
              variant={statusConfig[reconciliation.status].color as any}
              className="text-sm"
            >
              {statusConfig[reconciliation.status].label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Creator Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <IconUser className="w-4 h-4 mr-2" />
                Created By
              </Label>
              <div>
                <div className="font-medium">
                  {reconciliation.createdBy.firstName}{" "}
                  {reconciliation.createdBy.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reconciliation.createdBy.email}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <IconCalendar className="w-4 h-4 mr-2" />
                Timeline
              </Label>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {new Date(reconciliation.createdAt).toLocaleString()}
                </div>
                {reconciliation.submittedAt && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Submitted:</span>{" "}
                    {new Date(reconciliation.submittedAt).toLocaleString()}
                  </div>
                )}
                {reconciliation.approvedAt && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {reconciliation.status === "APPROVED"
                        ? "Approved"
                        : "Rejected"}
                      :
                    </span>{" "}
                    {new Date(reconciliation.approvedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Summary</Label>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">Items:</span>{" "}
                  {reconciliation.items.length}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Total Discrepancy:
                  </span>{" "}
                  <span
                    className={
                      totalDiscrepancy === 0
                        ? "text-green-600"
                        : totalDiscrepancy > 0
                          ? "text-blue-600"
                          : "text-red-600"
                    }
                  >
                    {totalDiscrepancy > 0 ? "+" : ""}
                    {totalDiscrepancy}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Est. Impact:</span>{" "}
                  <span
                    className={
                      totalImpact === 0
                        ? "text-green-600"
                        : totalImpact > 0
                          ? "text-blue-600"
                          : "text-red-600"
                    }
                  >
                    {formatCurrency(totalImpact)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6 pt-6 border-t">
            {canEdit && (
              <Button variant="outline" asChild>
                <a
                  href={`/inventory/stock-reconciliations/${reconciliation.id}/edit`}
                >
                  <IconEdit className="w-4 h-4 mr-2" />
                  Edit
                </a>
              </Button>
            )}

            {canSubmit && (
              <Button
                onClick={handleSubmitForApproval}
                disabled={actionLoading}
              >
                <IconSend className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            )}

            {canApprove && (
              <>
                <Button
                  onClick={() => setShowApprovalDialog(true)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <IconCheck className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectionDialog(true)}
                  disabled={actionLoading}
                >
                  <IconX className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Items</CardTitle>
          <CardDescription>
            Detailed breakdown of inventory discrepancies
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">System Count</TableHead>
                  <TableHead className="text-center">Physical Count</TableHead>
                  <TableHead className="text-center">Discrepancy</TableHead>
                  <TableHead className="text-right">Est. Impact</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        {item.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.product.sku}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.systemCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.physicalCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          item.discrepancy === 0
                            ? "text-green-600"
                            : item.discrepancy > 0
                              ? "text-blue-600"
                              : "text-red-600"
                        }
                      >
                        {item.discrepancy > 0 ? "+" : ""}
                        {item.discrepancy}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          !item.estimatedImpact || item.estimatedImpact === 0
                            ? "text-green-600"
                            : item.estimatedImpact > 0
                              ? "text-blue-600"
                              : "text-red-600"
                        }
                      >
                        {formatCurrency(item.estimatedImpact || 0)}
                      </span>
                    </TableCell>
                    <TableCell>{item.discrepancyReason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {reconciliation.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <IconFileText className="w-5 h-5 mr-2" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm">
              {reconciliation.notes}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reconciliation</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this stock reconciliation? This
              will apply all discrepancies to the inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reconciliation</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this stock reconciliation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this reconciliation is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
