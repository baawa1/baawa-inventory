"use client";

import { useState } from "react";
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
import {
  useStockReconciliation,
  useSubmitStockReconciliation,
  useApproveStockReconciliation,
  useRejectStockReconciliation,
  type User,
  type StockReconciliation,
  type StockReconciliationItem,
} from "@/hooks/api/stock-management";

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
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const isAdmin = userRole === "ADMIN";

  // TanStack Query hooks
  const {
    data: reconciliationData,
    isLoading,
    error,
  } = useStockReconciliation(reconciliationId);

  const submitMutation = useSubmitStockReconciliation();
  const approveMutation = useApproveStockReconciliation();
  const rejectMutation = useRejectStockReconciliation();

  const reconciliation = reconciliationData?.reconciliation;

  const handleSubmitForApproval = async () => {
    try {
      await submitMutation.mutateAsync(reconciliationId);
      toast.success("Reconciliation submitted for approval");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to submit reconciliation");
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: reconciliationId,
        notes: approvalNotes,
      });
      toast.success("Reconciliation approved successfully");
      setShowApprovalDialog(false);
      setApprovalNotes("");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to approve reconciliation");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: reconciliationId,
        reason: rejectionReason,
      });
      toast.success("Reconciliation rejected");
      setShowRejectionDialog(false);
      setRejectionReason("");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to reject reconciliation");
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load reconciliation details
          </div>
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

  const actionLoading =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending;

  const totalDiscrepancy = reconciliation.items.reduce(
    (total: number, item: StockReconciliationItem) => total + item.discrepancy,
    0
  );
  const totalImpact = reconciliation.items.reduce(
    (total: number, item: StockReconciliationItem) =>
      total + (item.estimatedImpact || 0),
    0
  );

  const currentStatus = reconciliation.status as keyof typeof statusConfig;
  const statusInfo = statusConfig[currentStatus];

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
            <Badge variant={statusInfo?.color as any} className="text-sm">
              {statusInfo?.label}
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
                {reconciliation.items.map((item: StockReconciliationItem) => (
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
