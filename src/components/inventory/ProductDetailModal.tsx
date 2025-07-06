"use client";

import React from "react";
import { useProduct } from "@/hooks/api/products";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconPackage,
  IconBarcode,
  IconTag,
  IconCurrencyDollar,
  IconCalendar,
  IconTruck,
  IconBuilding,
  IconFileText,
  IconX,
  IconRefresh,
  IconEdit,
  IconPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface ProductDetailModalProps {
  productId: number | null;
  open: boolean;
  onCloseAction: () => void;
  onAddStock?: (productId: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  open,
  onCloseAction,
  onAddStock,
}) => {
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useProduct(productId || 0);

  const handleRefresh = () => {
    if (productId) {
      refetch();
      toast.success("Product details refreshed");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Product Details
              </DialogTitle>
              <DialogDescription>
                View detailed information about this product
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <IconRefresh className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <IconRefresh className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                Loading product details...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <IconX className="h-8 w-8 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">
                Failed to load product details
              </p>
              <Button onClick={handleRefresh} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {product && (
          <div className="space-y-6">
            {/* Product Header */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={100}
                    height={100}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                    <IconPackage className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                    <p className="text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        product.status === "active" ? "default" : "secondary"
                      }
                    >
                      {product.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      variant={
                        product.stock <= product.min_stock
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {product.stock <= product.min_stock
                        ? "Low Stock"
                        : "In Stock"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Product Name
                    </label>
                    <p className="text-sm">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      SKU
                    </label>
                    <p className="text-sm font-mono">{product.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Category
                    </label>
                    <p className="text-sm">{product.category?.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Brand
                    </label>
                    <p className="text-sm">{product.brand?.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Supplier
                    </label>
                    <p className="text-sm">{product.supplier?.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Unit
                    </label>
                    <p className="text-sm">{product.unit || "N/A"}</p>
                  </div>
                </div>
                {product.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCurrencyDollar className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Cost Price
                    </label>
                    <p className="text-sm">
                      {formatCurrency(product.cost || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Selling Price
                    </label>
                    <p className="text-sm">
                      {formatCurrency(product.price || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTag className="h-5 w-5" />
                  Stock Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Current Stock
                    </label>
                    <p className="text-sm">{product.stock || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Minimum Stock Level
                    </label>
                    <p className="text-sm">{product.min_stock || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Maximum Stock Level
                    </label>
                    <p className="text-sm">{product.max_stock || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created Date
                    </label>
                    <p className="text-sm">
                      {product.created_at
                        ? formatDate(product.created_at, { includeTime: false })
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </label>
                    <p className="text-sm">
                      {product.updated_at
                        ? formatDate(product.updated_at, { includeTime: false })
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <br />
                    <Badge
                      variant={
                        product.status === "active" ? "default" : "secondary"
                      }
                    >
                      {product.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button asChild>
                <Link href={`/inventory/products/${product.id}/edit`}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit Product
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (onAddStock) {
                    onAddStock(product.id);
                  }
                }}
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
