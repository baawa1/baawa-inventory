'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  IconUser,
  IconCalendar,
  IconFileText,
  IconNotes,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import type { StockReconciliationItem } from '@/hooks/api/stock-management';

interface ReconciliationHeaderProps {
  reconciliation: {
    id: number;
    title: string;
    description?: string;
    status: string;
    createdAt: string;
    submittedAt?: string;
    approvedAt?: string;
    notes?: string;
    createdBy: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    approvedBy?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    items: StockReconciliationItem[];
  };
  totalDiscrepancy: number;
  totalImpact: number;
}

const statusConfig = {
  DRAFT: {
    color: 'secondary',
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  PENDING: {
    color: 'secondary',
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  APPROVED: {
    color: 'default',
    label: 'Approved',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  REJECTED: {
    color: 'destructive',
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
} as const;

export function ReconciliationHeader({
  reconciliation,
  totalDiscrepancy,
  totalImpact,
}: ReconciliationHeaderProps) {
  const currentStatus = reconciliation.status as keyof typeof statusConfig;
  const statusInfo = statusConfig[currentStatus];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{reconciliation.title}</CardTitle>
            {reconciliation.description && (
              <CardDescription className="mt-2">
                {reconciliation.description}
              </CardDescription>
            )}
          </div>
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">
              {reconciliation.items.length}
            </div>
            <div className="text-muted-foreground text-sm">Items</div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{totalDiscrepancy}</div>
            <div className="text-muted-foreground text-sm">
              Total Discrepancy
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">
              {formatCurrency(totalImpact)}
            </div>
            <div className="text-muted-foreground text-sm">
              Estimated Impact
            </div>
          </div>
        </div>

        <Separator />

        {/* Reconciliation Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <IconUser className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Created By</p>
              <p className="text-muted-foreground text-sm">
                {reconciliation.createdBy.firstName}{' '}
                {reconciliation.createdBy.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconCalendar className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-muted-foreground text-sm">
                {new Date(reconciliation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {reconciliation.submittedAt && (
            <div className="flex items-center gap-2">
              <IconFileText className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-muted-foreground text-sm">
                  {new Date(reconciliation.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {reconciliation.approvedAt && reconciliation.approvedBy && (
            <div className="flex items-center gap-2">
              <IconUser className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Approved By</p>
                <p className="text-muted-foreground text-sm">
                  {reconciliation.approvedBy.firstName}{' '}
                  {reconciliation.approvedBy.lastName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {reconciliation.notes && (
          <>
            <Separator />
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <IconNotes className="text-muted-foreground h-4 w-4" />
                <p className="text-sm font-medium">Notes</p>
              </div>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {reconciliation.notes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
