"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Progress component placeholder - using div with background for now
// import { Progress } from "@/components/ui/progress";
import {
  IconAlertTriangle,
  IconPackage,
  IconArrowRight,
  IconTrendingDown,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";

interface LowStockAlertsProps {
  expanded?: boolean;
}

// Mock data - in production, this would come from API
const lowStockItems = [
  {
    id: 1,
    name: "Apple Watch Series 9",
    sku: "AW-S9-45-GPS",
    currentStock: 2,
    minStock: 10,
    maxStock: 50,
    price: 85000,
    category: "Electronics",
    supplier: "Tech Distributors Ltd",
    lastRestocked: "2024-01-10",
    status: "critical", // critical, low, reorder
  },
  {
    id: 2,
    name: "Wireless Earbuds Pro",
    sku: "WE-PRO-BLK",
    currentStock: 5,
    minStock: 15,
    maxStock: 100,
    price: 25000,
    category: "Electronics",
    supplier: "Audio Solutions",
    lastRestocked: "2024-01-08",
    status: "low",
  },
  {
    id: 3,
    name: "Leather Handbag Premium",
    sku: "LH-PREM-BRN",
    currentStock: 0,
    minStock: 5,
    maxStock: 25,
    price: 45000,
    category: "Bags",
    supplier: "Fashion House",
    lastRestocked: "2024-01-05",
    status: "critical",
  },
  {
    id: 4,
    name: "Smart Fitness Tracker",
    sku: "SFT-V2-BLK",
    currentStock: 3,
    minStock: 12,
    maxStock: 60,
    price: 35000,
    category: "Electronics",
    supplier: "Health Tech Co",
    lastRestocked: "2024-01-12",
    status: "low",
  },
  {
    id: 5,
    name: "Designer Sunglasses",
    sku: "DS-AVT-BLK",
    currentStock: 1,
    minStock: 8,
    maxStock: 40,
    price: 55000,
    category: "Accessories",
    supplier: "Style Imports",
    lastRestocked: "2024-01-06",
    status: "critical",
  },
];

export function LowStockAlerts({ expanded = false }: LowStockAlertsProps) {
  const criticalItems = lowStockItems.filter(
    (item) => item.status === "critical"
  ).length;
  const lowStockCount = lowStockItems.filter(
    (item) => item.status === "low"
  ).length;
  const displayItems = expanded ? lowStockItems : lowStockItems.slice(0, 5);

  const getStatusColor = (status: string, currentStock: number) => {
    if (currentStock === 0) return "text-red-600";
    if (status === "critical") return "text-red-600";
    if (status === "low") return "text-yellow-600";
    return "text-gray-600";
  };

  const getStatusBadge = (status: string, currentStock: number) => {
    if (currentStock === 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Out of Stock
        </Badge>
      );
    }
    if (status === "critical") {
      return (
        <Badge variant="destructive" className="text-xs">
          Critical
        </Badge>
      );
    }
    if (status === "low") {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 text-xs">
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Reorder
      </Badge>
    );
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
          Low Stock Alerts
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            {criticalItems} Critical
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
            {lowStockCount} Low
          </Badge>
          {!expanded && (
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <IconArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg ${
                item.currentStock === 0
                  ? "border-red-200 bg-red-50"
                  : item.status === "critical"
                    ? "border-red-200 bg-red-50"
                    : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IconPackage
                      className={`h-4 w-4 ${getStatusColor(item.status, item.currentStock)}`}
                    />
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    {getStatusBadge(item.status, item.currentStock)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">SKU: {item.sku}</p>
                      <p className="text-muted-foreground">
                        Category: {item.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Price: {formatCurrency(item.price)}
                      </p>
                      <p className="text-muted-foreground">
                        Supplier: {item.supplier}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">
                        Stock Level: {item.currentStock} / {item.maxStock}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Min: {item.minStock}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${getStockPercentage(item.currentStock, item.maxStock)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Last restocked:{" "}
                      {new Date(item.lastRestocked).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <Button size="sm" variant="outline" className="text-xs">
                    Reorder
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {displayItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <IconPackage className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p>All products are well stocked!</p>
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total items requiring attention: {lowStockItems.length}
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <IconTrendingDown className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
