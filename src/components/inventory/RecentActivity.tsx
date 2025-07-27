'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconPackages,
  IconAdjustments,
  IconTruck,
  IconShoppingCart,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { useRecentActivity } from '@/hooks/api/inventory';

// Legacy interface for backward compatibility
interface ActivityItem {
  id: number;
  type:
    | 'product_added'
    | 'stock_adjustment'
    | 'supplier_added'
    | 'sale_completed';
  description: string;
  timestamp: string;
  user: string;
  metadata?: Record<string, unknown>;
}

export function RecentActivity() {
  const { data, isLoading, error } = useRecentActivity();

  // Fallback data for when API is not ready yet
  const fallbackActivities: ActivityItem[] = [
    {
      id: 1,
      type: 'product_added',
      description: 'Added new product "Samsung Galaxy Watch"',
      timestamp: '2 minutes ago',
      user: 'John Doe',
      metadata: { productId: 123, sku: 'SGW-001' },
    },
    {
      id: 2,
      type: 'stock_adjustment',
      description:
        'Stock adjusted for "iPhone 14 Case" - Increased by 50 units',
      timestamp: '15 minutes ago',
      user: 'Jane Smith',
      metadata: { productId: 456, adjustment: 50, reason: 'New shipment' },
    },
    {
      id: 3,
      type: 'supplier_added',
      description: 'New supplier "Tech Accessories Ltd." added',
      timestamp: '1 hour ago',
      user: 'Admin User',
      metadata: { supplierId: 789 },
    },
    {
      id: 4,
      type: 'sale_completed',
      description: `Sale completed - 3 items sold for ${formatCurrency(150.0)}`,
      timestamp: '2 hours ago',
      user: 'Store Assistant',
      metadata: { saleId: 'TXN-1234567890', amount: 150.0 },
    },
    {
      id: 5,
      type: 'stock_adjustment',
      description:
        'Stock adjusted for "Wireless Earbuds" - Decreased by 2 units',
      timestamp: '3 hours ago',
      user: 'John Doe',
      metadata: { productId: 321, adjustment: -2, reason: 'Damage reported' },
    },
  ];

  // Convert API data to legacy format if needed, otherwise use fallback
  const activities = data
    ? data.map((item, index) => ({
        id: index + 1,
        type: item.type as ActivityItem['type'],
        description: item.description,
        timestamp: item.timestamp,
        user: item.user || 'System',
        metadata: item,
      }))
    : fallbackActivities;

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'product_added':
        return <IconPackages className="h-4 w-4 text-blue-600" />;
      case 'stock_adjustment':
        return <IconAdjustments className="h-4 w-4 text-orange-600" />;
      case 'supplier_added':
        return <IconTruck className="h-4 w-4 text-green-600" />;
      case 'sale_completed':
        return <IconShoppingCart className="h-4 w-4 text-purple-600" />;
      default:
        return <IconPackages className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'product_added':
        return (
          <Badge variant="outline" className="text-blue-600">
            Product
          </Badge>
        );
      case 'stock_adjustment':
        return (
          <Badge variant="outline" className="text-orange-600">
            Stock
          </Badge>
        );
      case 'supplier_added':
        return (
          <Badge variant="outline" className="text-green-600">
            Supplier
          </Badge>
        );
      case 'sale_completed':
        return (
          <Badge variant="outline" className="text-purple-600">
            Sale
          </Badge>
        );
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  if (error && !data) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Activity
            </CardTitle>
            <CardDescription>
              Failed to load recent activity. Using fallback data.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="mb-2 h-6 w-1/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center space-x-4"
                >
                  <div className="h-8 w-8 rounded bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and changes in your inventory system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map(activity => (
              <div
                key={activity.id}
                className="bg-card hover:bg-accent/50 flex items-start space-x-4 rounded-lg border p-3 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.description}
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <a
              href="/inventory/activity"
              className="text-primary text-sm hover:underline"
            >
              View all activity →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
