"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconPackages,
  IconAdjustments,
  IconTruck,
  IconShoppingCart,
} from "@tabler/icons-react";

interface ActivityItem {
  id: number;
  type:
    | "product_added"
    | "stock_adjustment"
    | "supplier_added"
    | "sale_completed";
  description: string;
  timestamp: string;
  user: string;
  metadata?: any;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for recent activities - in real implementation, fetch from API
    setActivities([
      {
        id: 1,
        type: "product_added",
        description: 'Added new product "Samsung Galaxy Watch"',
        timestamp: "2 minutes ago",
        user: "John Doe",
        metadata: { productId: 123, sku: "SGW-001" },
      },
      {
        id: 2,
        type: "stock_adjustment",
        description:
          'Stock adjusted for "iPhone 14 Case" - Increased by 50 units',
        timestamp: "15 minutes ago",
        user: "Jane Smith",
        metadata: { productId: 456, adjustment: 50, reason: "New shipment" },
      },
      {
        id: 3,
        type: "supplier_added",
        description: 'New supplier "Tech Accessories Ltd." added',
        timestamp: "1 hour ago",
        user: "Admin User",
        metadata: { supplierId: 789 },
      },
      {
        id: 4,
        type: "sale_completed",
        description: "Sale completed - 3 items sold for $150.00",
        timestamp: "2 hours ago",
        user: "Store Assistant",
        metadata: { saleId: "TXN-1234567890", amount: 150.0 },
      },
      {
        id: 5,
        type: "stock_adjustment",
        description:
          'Stock adjusted for "Wireless Earbuds" - Decreased by 2 units',
        timestamp: "3 hours ago",
        user: "John Doe",
        metadata: { productId: 321, adjustment: -2, reason: "Damage reported" },
      },
    ]);
    setLoading(false);
  }, []);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "product_added":
        return <IconPackages className="h-4 w-4 text-blue-600" />;
      case "stock_adjustment":
        return <IconAdjustments className="h-4 w-4 text-orange-600" />;
      case "supplier_added":
        return <IconTruck className="h-4 w-4 text-green-600" />;
      case "sale_completed":
        return <IconShoppingCart className="h-4 w-4 text-purple-600" />;
      default:
        return <IconPackages className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: ActivityItem["type"]) => {
    switch (type) {
      case "product_added":
        return (
          <Badge variant="outline" className="text-blue-600">
            Product
          </Badge>
        );
      case "stock_adjustment":
        return (
          <Badge variant="outline" className="text-orange-600">
            Stock
          </Badge>
        );
      case "supplier_added":
        return (
          <Badge variant="outline" className="text-green-600">
            Supplier
          </Badge>
        );
      case "sale_completed":
        return (
          <Badge variant="outline" className="text-purple-600">
            Sale
          </Badge>
        );
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 animate-pulse"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and changes in your inventory system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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
              className="text-sm text-primary hover:underline"
            >
              View all activity →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
