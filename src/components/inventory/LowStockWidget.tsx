"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingUp, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  category: { name: string } | null;
  brand: { name: string } | null;
}

interface LowStockWidgetProps {
  limit?: number;
}

export function LowStockWidget({ limit = 5 }: LowStockWidgetProps) {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    criticalStock: 0,
    lowStock: 0,
    totalValue: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/low-stock?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch low stock products");
      }

      const data = await response.json();
      setProducts(data.products || []);
      setMetrics({
        criticalStock: data.metrics?.criticalStock || 0,
        lowStock: data.metrics?.lowStock || 0,
        totalValue: data.metrics?.totalValue || 0,
      });
    } catch (err) {
      logger.error("Failed to fetch low stock products", {
        error: err instanceof Error ? err.message : String(err),
      });
      toast.error("Failed to load low stock data");
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0)
      return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= minStock)
      return { label: "Low Stock", variant: "secondary" as const };
    return { label: "Normal", variant: "default" as const };
  };

  const handleViewAll = () => {
    router.push("/inventory/low-stock");
  };

  const handleProductClick = (productId: number) => {
    router.push(`/inventory/products/${productId}/edit`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={fetchLowStockProducts} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Alerts
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAll}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-green-600">
              All Good!
            </h3>
            <p className="text-muted-foreground text-sm">
              No products are currently below their minimum stock levels.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.criticalStock}
                </div>
                <div className="text-xs text-muted-foreground">
                  Out of Stock
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.lowStock}
                </div>
                <div className="text-xs text-muted-foreground">Low Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₦{metrics.totalValue.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  At Risk Value
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-3">
              {products.map((product) => {
                const stockStatus = getStockStatus(
                  product.stock,
                  product.minStock
                );

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{product.name}</h4>
                        <Badge
                          variant={stockStatus.variant}
                          className="text-xs"
                        >
                          {stockStatus.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>SKU: {product.sku}</span>
                        <span>Stock: {product.stock}</span>
                        <span>Min: {product.minStock}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {product.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {product.category.name}
                          </span>
                        )}
                        {product.brand && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {product.brand.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.stock === 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {product.stock > 0 &&
                        product.stock <= product.minStock && (
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/inventory/low-stock")}
                className="flex-1"
              >
                View All Alerts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAll}
                className="flex-1"
              >
                View All Alerts
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
