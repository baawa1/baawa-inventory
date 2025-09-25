'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useMemo } from 'react';
import {
  useStockReconciliation,
  type StockReconciliationItem,
} from '@/hooks/api/stock-management';
import { ReconciliationHeader } from './stock-reconciliation/ReconciliationHeader';
import { ReconciliationItemsTable } from './stock-reconciliation/ReconciliationItemsTable';
import { ReconciliationActions } from './stock-reconciliation/ReconciliationActions';
import { calculateDiscrepancyMetrics } from '@/lib/utils/stock-reconciliation';

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
  const isAdmin = userRole === 'ADMIN';

  // TanStack Query hooks
  const {
    data: reconciliationData,
    isLoading,
    error,
  } = useStockReconciliation(reconciliationId.toString());

  const reconciliation = reconciliationData?.data;

  const discrepancyMetrics = useMemo(() => {
    const items = reconciliation?.items ?? [];
    const inputs = items.map((item: StockReconciliationItem) => {
      let impact = 0;
      if (item.estimatedImpact !== null && item.estimatedImpact !== undefined) {
        impact =
          typeof item.estimatedImpact === 'string'
            ? parseFloat(item.estimatedImpact)
            : Number(item.estimatedImpact);

        if (Number.isNaN(impact)) {
          impact = 0;
        }
      }

      return {
        discrepancy: Number(item.discrepancy || 0),
        impact,
      };
    });

    return calculateDiscrepancyMetrics(inputs);
  }, [reconciliation?.items]);

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
          <div className="text-destructive text-center">
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
          <div className="text-muted-foreground text-center">
            Reconciliation not found
          </div>
        </CardContent>
      </Card>
    );
  }

  const canEdit =
    reconciliation.status === 'DRAFT' &&
    (isAdmin || reconciliation.createdBy.id === userId);
  const canSubmit =
    reconciliation.status === 'DRAFT' &&
    (isAdmin || reconciliation.createdBy.id === userId);
  const canApprove = reconciliation.status === 'PENDING' && isAdmin;

  return (
    <>
      <ReconciliationHeader
        reconciliation={reconciliation}
        metrics={discrepancyMetrics}
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
