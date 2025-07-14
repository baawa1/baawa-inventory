"use client";

import React, { useState } from "react";
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
import {
  IconPackage,
  IconTag,
  IconCurrencyDollar,
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
  product?: {
    name: string;
    sku: string;
    category?: { name: string };
    brand?: { name: string };
  };
  open: boolean;
  onCloseAction: () => void;
  onAddStock?: (productId: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  product: productBasicInfo,
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

  // Carousel and description state
  const [currentImage, setCurrentImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleRefresh = () => {
    if (productId) {
      refetch();
      toast.success("Product details refreshed");
    }
  };

  // Helper for images array
  const images: string[] =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
        ? [product.image]
        : [];

  // Truncate description
  const DESCRIPTION_LIMIT = 200;
  const description = product?.description || "";
  const isLongDescription = description.length > DESCRIPTION_LIMIT;
  const displayedDescription =
    showFullDescription || !isLongDescription
      ? description
      : description.slice(0, DESCRIPTION_LIMIT) + "...";

  if (!open) return null;

  // Prefer prop for header and basic info, fallback to API data
  const headerName =
    productBasicInfo?.name || product?.name || "Product Details";
  const headerCat = productBasicInfo?.category?.name || product?.category?.name;
  const headerBrand = productBasicInfo?.brand?.name || product?.brand?.name;
  const headerSKU = productBasicInfo?.sku || product?.sku || "N/A";

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-4xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {headerName}
              </DialogTitle>
              <DialogDescription>
                {[headerSKU, headerCat, headerBrand]
                  .filter(Boolean)
                  .join(" · ") || "N/A"}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    product?.status === "active" ? "default" : "secondary"
                  }
                >
                  {product?.status === "active" ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant={
                    product?.stock &&
                    product?.minStock &&
                    product?.stock <= product?.minStock
                      ? "destructive"
                      : "outline"
                  }
                >
                  {product?.stock &&
                  product?.minStock &&
                  product?.stock <= product?.minStock
                    ? "Low Stock"
                    : "In Stock"}
                </Badge>
              </div>
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
            {/* Image Carousel */}
            <div className="flex flex-row-reverse items-start justify-center gap-4">
              <div className="w-48 h-48 mb-2 flex items-center justify-center bg-muted rounded-lg">
                {images.length > 0 ? (
                  <Image
                    src={images[currentImage]}
                    alt={headerName}
                    width={192}
                    height={192}
                    className="rounded-lg object-cover w-48 h-48"
                  />
                ) : (
                  <IconPackage className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              {images.length > 1 && (
                <div className="flex flex-col flex-wrap h-48 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={img}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-12 h-12 rounded border ${idx === currentImage ? "border-primary" : "border-muted"} focus:outline-none`}
                      type="button"
                    >
                      <Image
                        src={img}
                        alt=""
                        width={48}
                        height={48}
                        className="object-cover rounded w-12 h-12"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description with Show More */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <p className="text-sm whitespace-pre-line">
                {displayedDescription}
              </p>
              {isLongDescription && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowFullDescription((v) => !v)}
                  className="p-0 h-auto"
                >
                  {showFullDescription ? "Show Less" : "Show More"}
                </Button>
              )}
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconPackage className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Product Name
                    </label>
                    <p className="text-sm">{headerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      SKU
                    </label>
                    <p className="text-sm font-mono">{headerSKU}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Category
                    </label>
                    <p className="text-sm">{headerCat || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Brand
                    </label>
                    <p className="text-sm">{headerBrand || "N/A"}</p>
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
                </CardContent>
              </Card>

              {/* Pricing Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                </CardContent>
              </Card>

              {/* Stock Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTag className="h-5 w-5" />
                    Stock Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                    <p className="text-sm">{product.minStock || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Maximum Stock Level
                    </label>
                    <p className="text-sm">{product.maxStock || 0}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconFileText className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created Date
                    </label>
                    <p className="text-sm">
                      {product.createdAt
                        ? formatDate(product.createdAt, { includeTime: false })
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </label>
                    <p className="text-sm">
                      {product.updatedAt
                        ? formatDate(product.updatedAt, { includeTime: false })
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
                </CardContent>
              </Card>
            </div>

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
