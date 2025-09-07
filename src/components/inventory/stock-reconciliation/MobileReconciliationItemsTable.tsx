'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Mobile-optimized components
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Icons
import { 
  IconPackage, 
  IconTrendingUp, 
  IconTrendingDown,
  IconMinus,
  IconPackages,
} from '@tabler/icons-react';

import { formatCurrency } from '@/lib/utils';
import type { StockReconciliationItem } from '@/hooks/api/stock-management';
import { DISCREPANCY_REASONS } from '@/lib/constants/stock-reconciliation';

interface MobileReconciliationItemsTableProps {
  items: StockReconciliationItem[];
}

export function MobileReconciliationItemsTable({
  items,
}: MobileReconciliationItemsTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Helper function to get human-readable discrepancy reason
  const getDiscrepancyReasonLabel = (reason: string | null | undefined) => {
    if (!reason) return '-';
    const found = DISCREPANCY_REASONS.find(r => r.value === reason);
    return found ? found.label : reason;
  };

  // Column configuration with bold headers
  const columns = useMemo(
    () => [
      {
        key: 'product',
        label: 'Product',
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'systemCount',
        label: 'System Count',
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'physicalCount',
        label: 'Physical Count',
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'discrepancy',
        label: 'Discrepancy',
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'impact',
        label: 'Impact',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'reason',
        label: 'Reason',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'notes',
        label: 'Notes',
        defaultVisible: false,
        className: 'font-bold',
      },
    ],
    []
  );

  // Get discrepancy badge
  const getDiscrepancyBadge = (discrepancy: number) => {
    if (discrepancy === 0) {
      return <Badge variant="secondary" className="text-xs">0</Badge>;
    } else if (discrepancy > 0) {
      return <Badge className="bg-green-100 text-green-700 text-xs">+{discrepancy}</Badge>;
    } else {
      return <Badge variant="destructive" className="text-xs">{discrepancy}</Badge>;
    }
  };

  // Get discrepancy icon
  const getDiscrepancyIcon = (discrepancy: number) => {
    if (discrepancy > 0) {
      return <IconTrendingUp className="h-5 w-5 text-green-600" />;
    } else if (discrepancy < 0) {
      return <IconTrendingDown className="h-5 w-5 text-red-600" />;
    }
    return <IconMinus className="h-5 w-5 text-gray-400" />;
  };

  // Render cell function
  const renderCell = (item: StockReconciliationItem, columnKey: string) => {
    switch (columnKey) {
      case 'product':
        return (
          <div className="min-w-0">
            <div className="font-medium text-xs sm:text-sm truncate">
              {item.product.name}
            </div>
            <div className="text-muted-foreground text-xs truncate">
              SKU: {item.product.sku}
            </div>
          </div>
        );
      case 'systemCount':
        return (
          <span className="font-medium text-xs sm:text-sm">
            {item.systemCount}
          </span>
        );
      case 'physicalCount':
        return (
          <span className="font-medium text-xs sm:text-sm">
            {item.physicalCount}
          </span>
        );
      case 'discrepancy':
        return getDiscrepancyBadge(item.discrepancy);
      case 'impact':
        return item.estimatedImpact ? (
          <span className="font-medium text-xs sm:text-sm">
            {formatCurrency(item.estimatedImpact)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">-</span>
        );
      case 'reason':
        return (
          <span className="text-xs sm:text-sm">
            {getDiscrepancyReasonLabel(item.discrepancyReason)}
          </span>
        );
      case 'notes':
        return (
          <span className="text-xs sm:text-sm" title={item.notes || undefined}>
            {item.notes ? (
              item.notes.length > 30 
                ? `${item.notes.slice(0, 30)}...`
                : item.notes
            ) : '-'}
          </span>
        );
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  };

  // Mobile card title and subtitle
  const mobileCardTitle = (item: StockReconciliationItem) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
        {getDiscrepancyIcon(item.discrepancy)}
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {item.product.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (item: StockReconciliationItem) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconPackages className="h-3 w-3" />
      <span>SKU: {item.product.sku}</span>
      <span>•</span>
      <span>System: {item.systemCount}</span>
      <span>•</span>
      <span>Physical: {item.physicalCount}</span>
      <span>•</span>
      {getDiscrepancyBadge(item.discrepancy)}
    </div>
  );

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
        <MobileDashboardTable
          tableTitle="Reconciliation Items"
          totalCount={items.length}
          currentCount={items.length}
          columns={columns}
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
          columnCustomizerKey="reconciliation-items-visible-columns"
          data={items}
          renderCell={renderCell}
          // No pagination for this table
          pagination={{
            page: 1,
            limit: items.length,
            totalPages: 1,
            totalItems: items.length,
          }}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          isLoading={false}
          emptyStateIcon={
            <IconPackage className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          }
          emptyStateMessage="No items in this reconciliation"
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          keyExtractor={item => item.id}
        />
      </CardContent>
    </Card>
  );
}