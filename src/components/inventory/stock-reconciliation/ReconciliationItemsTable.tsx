"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconPackage } from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import type { StockReconciliationItem } from "@/hooks/api/stock-management";
import { DISCREPANCY_REASONS } from "@/lib/constants/stock-reconciliation";

interface ReconciliationItemsTableProps {
  items: StockReconciliationItem[];
}

export function ReconciliationItemsTable({
  items,
}: ReconciliationItemsTableProps) {
  // Helper function to get human-readable discrepancy reason
  const getDiscrepancyReasonLabel = (reason: string | null | undefined) => {
    if (!reason) return "-";
    const found = DISCREPANCY_REASONS.find((r) => r.value === reason);
    return found ? found.label : reason;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconPackage className="h-5 w-5" />
          Reconciliation Items
        </CardTitle>
        <CardDescription>
          Products and their physical vs system count discrepancies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">System Count</TableHead>
                <TableHead className="text-right">Physical Count</TableHead>
                <TableHead className="text-right">Discrepancy</TableHead>
                <TableHead className="text-right">Impact</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.product.sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{item.systemCount}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{item.physicalCount}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        item.discrepancy === 0
                          ? "secondary"
                          : item.discrepancy > 0
                            ? "default"
                            : "destructive"
                      }
                    >
                      {item.discrepancy > 0 ? "+" : ""}
                      {item.discrepancy}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.estimatedImpact ? (
                      <span className="font-medium">
                        {formatCurrency(item.estimatedImpact)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getDiscrepancyReasonLabel(item.discrepancyReason)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.notes ? (
                      <span className="text-sm text-muted-foreground">
                        {item.notes}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
