'use client';

import React, { useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconPackage, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';

// Mobile-optimized components
import { ResponsiveTable } from '@/components/ui/responsive-table';

// Shared utilities
import { MobileCardTitle, ProductIconWrapper, MobileCardSubtitle } from '@/components/ui/mobile-card-templates';
import { TruncatedText } from '@/lib/utils/text-utils';

import { formatCurrency } from '@/lib/utils';
import type { StockReconciliationItem } from '@/hooks/api/stock-management';
import { DISCREPANCY_REASONS } from '@/lib/constants/stock-reconciliation';
import { formatSignedUnits } from '@/lib/utils/stock-reconciliation';

interface ReconciliationItemsTableProps {
  items: StockReconciliationItem[];
}

export function ReconciliationItemsTable({
  items,
}: ReconciliationItemsTableProps) {
  // Helper function to get human-readable discrepancy reason
  const getDiscrepancyReasonLabel = useCallback((reason: string | null | undefined) => {
    if (!reason) return '-';
    const found = DISCREPANCY_REASONS.find(r => r.value === reason);
    return found ? found.label : reason;
  }, []);

  // Helper function to get discrepancy badge
  const getDiscrepancyBadge = useCallback((discrepancy: number) => {
    const variant = discrepancy === 0 ? 'secondary' : discrepancy > 0 ? 'default' : 'destructive';
    const icon = discrepancy === 0 ? <IconMinus className="w-3 h-3" /> : 
                 discrepancy > 0 ? <IconTrendingUp className="w-3 h-3" /> : 
                 <IconTrendingDown className="w-3 h-3" />;
    
    return (
      <Badge variant={variant} className="text-xs flex items-center gap-1">
        {icon}
        {discrepancy > 0 ? '+' : ''}{discrepancy}
      </Badge>
    );
  }, []);

  // Column configuration
  const columns = useMemo(() => [
    {
      key: 'product',
      label: 'Product',
      render: (item: StockReconciliationItem) => (
        <div>
          <div className="font-medium text-sm">{item.product.name}</div>
          <div className="text-muted-foreground text-xs">SKU: {item.product.sku}</div>
        </div>
      ),
      mobileOrder: 1,
    },
    {
      key: 'systemCount',
      label: 'System Count',
      render: (item: StockReconciliationItem) => (
        <span className="font-medium text-sm">{item.systemCount}</span>
      ),
      className: 'text-right',
      mobileOrder: 2,
    },
    {
      key: 'physicalCount',
      label: 'Physical Count',
      render: (item: StockReconciliationItem) => (
        <span className="font-medium text-sm">{item.physicalCount}</span>
      ),
      className: 'text-right',
      mobileOrder: 3,
    },
    {
      key: 'discrepancy',
      label: 'Discrepancy',
      render: (item: StockReconciliationItem) => getDiscrepancyBadge(item.discrepancy),
      className: 'text-right',
      mobileOrder: 4,
    },
    {
      key: 'impact',
      label: 'Impact',
      render: (item: StockReconciliationItem) => {
        if (item.estimatedImpact === null || item.estimatedImpact === undefined) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        const impact =
          typeof item.estimatedImpact === 'string'
            ? parseFloat(item.estimatedImpact)
            : Number(item.estimatedImpact);
        if (Number.isNaN(impact)) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <span
            className={`font-medium text-sm ${impact === 0 ? 'text-muted-foreground' : impact > 0 ? 'text-green-700' : 'text-red-700'}`}
          >
            {formatCurrency(impact)}
          </span>
        );
      },
      className: 'text-right',
      hideOnMobile: true,
      mobileOrder: 7,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (item: StockReconciliationItem) => (
        <span className="text-sm">{getDiscrepancyReasonLabel(item.discrepancyReason)}</span>
      ),
      hideOnMobile: true,
      mobileOrder: 8,
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (item: StockReconciliationItem) => (
        item.notes ? (
          <TruncatedText text={item.notes} maxLength={30} className="text-muted-foreground text-sm" />
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
      hideOnMobile: true,
      mobileOrder: 9,
    },
  ], [getDiscrepancyBadge, getDiscrepancyReasonLabel]);

  // Mobile card title and subtitle
  const mobileCardTitle = useCallback((item: StockReconciliationItem) => (
    <MobileCardTitle
      icon={
        <ProductIconWrapper>
          <IconPackage className="w-5 h-5" />
        </ProductIconWrapper>
      }
      title={item.product.name}
      subtitle={`SKU: ${item.product.sku}`}
    >
      <div className="flex items-center gap-2 mt-1">
        {getDiscrepancyBadge(item.discrepancy)}
        <span className="text-xs font-medium text-green-700">
          {formatSignedUnits(Math.max(0, item.discrepancy))}
        </span>
        <span className="text-xs font-medium text-red-700">
          {formatSignedUnits(-Math.max(0, -item.discrepancy))}
        </span>
        {item.estimatedImpact && (
          <span className="text-xs font-medium text-orange-600">
            Impact: {formatCurrency(item.estimatedImpact)}
          </span>
        )}
      </div>
    </MobileCardTitle>
  ), [getDiscrepancyBadge]);

  const mobileCardSubtitle = useCallback((item: StockReconciliationItem) => {
    const subtitleItems: Array<{ label: string; value: string | number }> = [
      { label: 'System', value: item.systemCount },
      { label: 'Physical', value: item.physicalCount },
    ];

    if (item.discrepancyReason) {
      subtitleItems.push({
        label: 'Reason',
        value: getDiscrepancyReasonLabel(item.discrepancyReason),
      });
    }

    return (
      <MobileCardSubtitle
        items={subtitleItems.map(item => ({
          label: item.label,
          value: item.value,
        }))}
      />
    );
  }, [getDiscrepancyReasonLabel]);

  if (!items || items.length === 0) {
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
          <div className="text-center py-8 text-muted-foreground">
            No items found for this reconciliation.
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <ResponsiveTable
          data={items}
          columns={columns}
          keyExtractor={(item) => item.id.toString()}
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          emptyMessage="No reconciliation items found"
        />
      </CardContent>
    </Card>
  );
}
