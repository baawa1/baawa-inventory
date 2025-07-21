"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconUser, IconCalendar, IconFileText } from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import type { StockReconciliationItem } from "@/hooks/api/stock-management";

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
  DRAFT: { color: "secondary", label: "Draft" },
  PENDING: { color: "warning", label: "Pending" },
  APPROVED: { color: "success", label: "Approved" },
  REJECTED: { color: "destructive", label: "Rejected" },
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
          <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <IconUser className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Created By</p>
              <p className="text-sm text-muted-foreground">
                {reconciliation.createdBy.firstName}{" "}
                {reconciliation.createdBy.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(reconciliation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {reconciliation.submittedAt && (
            <div className="flex items-center gap-2">
              <IconFileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(reconciliation.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {reconciliation.approvedAt && reconciliation.approvedBy && (
            <div className="flex items-center gap-2">
              <IconUser className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Approved By</p>
                <p className="text-sm text-muted-foreground">
                  {reconciliation.approvedBy.firstName}{" "}
                  {reconciliation.approvedBy.lastName}
                </p>
              </div>
            </div>
          )}
        </div>

        {reconciliation.notes && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Notes</p>
            <p className="text-sm text-muted-foreground">
              {reconciliation.notes}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{reconciliation.items.length}</p>
            <p className="text-sm text-muted-foreground">Items</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totalDiscrepancy}</p>
            <p className="text-sm text-muted-foreground">Total Discrepancy</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{formatCurrency(totalImpact)}</p>
            <p className="text-sm text-muted-foreground">Estimated Impact</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
