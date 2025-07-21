"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { IconCheck, IconX, IconSend } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  useSubmitStockReconciliation,
  useApproveStockReconciliation,
  useRejectStockReconciliation,
} from "@/hooks/api/stock-management";

interface ReconciliationActionsProps {
  reconciliationId: number;
  _status: string;
  _canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  onUpdate?: () => void;
}

export function ReconciliationActions({
  reconciliationId,
  _status,
  _canEdit,
  canSubmit,
  canApprove,
  onUpdate,
}: ReconciliationActionsProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const submitMutation = useSubmitStockReconciliation();
  const approveMutation = useApproveStockReconciliation();
  const rejectMutation = useRejectStockReconciliation();

  const handleSubmitForApproval = async () => {
    try {
      await submitMutation.mutateAsync(reconciliationId);
      toast.success("Reconciliation submitted for approval");
      onUpdate?.();
    } catch (_error) {
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
    } catch (_error) {
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
    } catch (_error) {
      toast.error("Failed to reject reconciliation");
    }
  };

  const actionLoading =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending;

  return (
    <div className="flex gap-2">
      {canSubmit && (
        <Button
          onClick={handleSubmitForApproval}
          disabled={actionLoading}
          className="flex items-center gap-2"
        >
          <IconSend className="h-4 w-4" />
          Submit for Approval
        </Button>
      )}

      {canApprove && (
        <>
          <Button
            onClick={() => setShowApprovalDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2"
            variant="default"
          >
            <IconCheck className="h-4 w-4" />
            Approve
          </Button>

          <Button
            onClick={() => setShowRejectionDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2"
            variant="destructive"
          >
            <IconX className="h-4 w-4" />
            Reject
          </Button>
        </>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reconciliation</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this reconciliation? This action
              cannot be undone.
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
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              Approve
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
              Please provide a reason for rejecting this reconciliation.
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
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectionDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              variant="destructive"
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
