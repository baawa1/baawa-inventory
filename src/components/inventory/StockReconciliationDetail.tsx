"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  useStockReconciliation,
  type StockReconciliationItem,
} from "@/hooks/api/stock-management";
import { ReconciliationHeader } from "./stock-reconciliation/ReconciliationHeader";
import { ReconciliationItemsTable } from "./stock-reconciliation/ReconciliationItemsTable";
import { ReconciliationActions } from "./stock-reconciliation/ReconciliationActions";

interface StockReconciliationDetailProps {
  reconciliationId: number;
  userRole: string;
  userId: number;
  onUpdate?: () => void;
}

export function StockReconciliationDetail({
  reconciliationId,
  userRole,
  userId,
  onUpdate,
}: StockReconciliationDetailProps) {
  const isAdmin = userRole === "ADMIN";

  // TanStack Query hooks
  const {
    data: reconciliationData,
    isLoading,
    error,
  } = useStockReconciliation(reconciliationId.toString());

  const reconciliation = reconciliationData?.data;

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

  const totalDiscrepancy = reconciliation.items.reduce(
    (total: number, item: StockReconciliationItem) => total + item.discrepancy,
    0
  );
  const totalImpact = reconciliation.items.reduce(
    (total: number, item: StockReconciliationItem) => {
      // Handle different types that might come from the database
      let impact = 0;
      if (item.estimatedImpact !== null && item.estimatedImpact !== undefined) {
        // Convert to number if it's a string, or use as is if it's already a number
        impact =
          typeof item.estimatedImpact === "string"
            ? parseFloat(item.estimatedImpact)
            : Number(item.estimatedImpact);

        // Check if the conversion resulted in a valid number
        if (isNaN(impact)) {
          impact = 0;
        }
      }
      return total + impact;
    },
    0
  );

  return (
    <>
      <ReconciliationHeader
        reconciliation={reconciliation}
        totalDiscrepancy={totalDiscrepancy}
        totalImpact={totalImpact}
      />

      <ReconciliationItemsTable items={reconciliation.items} />

      {(canSubmit || canApprove) && (
        <ReconciliationActions
          reconciliationId={reconciliationId}
          _status={reconciliation.status}
          _canEdit={canEdit}
          canSubmit={canSubmit}
          canApprove={canApprove}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
