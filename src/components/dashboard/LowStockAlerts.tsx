'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  IconAlertTriangle,
  IconPackage,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { useAnalytics } from '@/hooks/api/useAnalytics';

interface LowStockAlertsProps {
  expanded?: boolean;
}

export function LowStockAlerts({ expanded = false }: LowStockAlertsProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Fetch real low stock data from analytics
  const { data: analyticsData, isLoading } = useAnalytics();
  const lowStockItems = analyticsData?.lowStockItems || [];

  const criticalItems = lowStockItems.filter(
    item => item.status === 'critical'
  ).length;
  const lowStockCount = lowStockItems.filter(
    item => item.status === 'low'
  ).length;
  const displayItems = isExpanded ? lowStockItems : lowStockItems.slice(0, 5);

  const getStatusColor = (status: string, currentStock: number) => {
    if (currentStock === 0) return 'text-red-600';
    if (status === 'critical') return 'text-red-600';
    if (status === 'low') return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status: string, currentStock: number) => {
    if (currentStock === 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Out of Stock
        </Badge>
      );
    }
    if (status === 'critical') {
      return (
        <Badge variant="destructive" className="text-xs">
          Critical
        </Badge>
      );
    }
    if (status === 'low') {
      return (
        <Badge variant="secondary" className="text-xs">
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        Normal
      </Badge>
    );
  };

  const getStockPercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Low Stock Alerts
          </CardTitle>
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Low Stock Alerts
          </CardTitle>
          <IconPackage className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <IconPackage className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No low stock items found
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <IconAlertTriangle className="h-4 w-4 text-red-600" />
          <CardTitle className="text-sm font-medium">
            Low Stock Alerts
          </CardTitle>
          <div className="flex items-center space-x-1">
            {criticalItems > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalItems} Critical
              </Badge>
            )}
            {lowStockCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {lowStockCount} Low
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? (
            <IconChevronUp className="h-4 w-4" />
          ) : (
            <IconChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayItems.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {item.sku} • {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex items-center space-x-2">
                    {getStatusBadge(item.status, item.currentStock)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        // Navigate to product detail or inventory management
                        window.open(`/inventory/products/${item.id}`, '_blank');
                      }}
                    >
                      <IconExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Stock Level</span>
                    <span
                      className={getStatusColor(item.status, item.currentStock)}
                    >
                      {item.currentStock} / {item.maxStock}
                    </span>
                  </div>
                  <Progress
                    value={getStockPercentage(item.currentStock, item.maxStock)}
                    className="h-1"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Min: {item.minStock}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {lowStockItems.length > 5 && (
          <div className="mt-4 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Navigate to full inventory management
                window.open('/inventory', '_blank');
              }}
            >
              View All Inventory
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
