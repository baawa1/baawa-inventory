'use client';

import React, { useState } from 'react';
import { useProduct } from '@/hooks/api/products';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineLoading } from '@/components/ui/loading';
import {
  detailDialogContentClassName,
  DetailItem,
  DetailMetric,
  DetailSection,
} from '@/components/ui/detail-dialog';
import {
  IconPackage,
  IconTag,
  IconFileText,
  IconX,
  IconRefresh,
  IconEdit,
  IconPlus,
  IconRuler,
  IconCurrencyNaira,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PRODUCT_STATUS } from '@/lib/constants';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';
import Image from 'next/image';

interface ProductImage {
  url: string;
  alt?: string;
}

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
  onAddStock?: (_productId: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId: _productId,
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
  } = useProduct(_productId || 0);

  // Carousel and description state
  const [currentImage, setCurrentImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Get permissions using centralized hook
  const permissions = usePermissions();
  const { canViewCost } = permissions;

  const handleRefresh = () => {
    if (_productId) {
      refetch();
      toast.success('Product details refreshed');
    }
  };

  // Helper for images array - handle both legacy string array and new image object array
  const getImageUrls = (): string[] => {
    if (product?.images && product.images.length > 0) {
      // Check if it's the new format (array of objects)
      if (typeof product.images[0] === 'object' && 'url' in product.images[0]) {
        return (product.images as ProductImage[]).map(
          (img: ProductImage) => img.url
        );
      }
      // Legacy format (array of strings)
      return product.images as unknown as string[];
    }
    return product?.image ? [product.image] : [];
  };

  const images = getImageUrls();

  // Truncate description
  const DESCRIPTION_LIMIT = 200;
  const description = product?.description || '';
  const isLongDescription = description.length > DESCRIPTION_LIMIT;
  const displayedDescription =
    showFullDescription || !isLongDescription
      ? description
      : description.slice(0, DESCRIPTION_LIMIT) + '...';

  if (!open) return null;

  // Prefer prop for header and basic info, fallback to API data
  const headerName =
    productBasicInfo?.name || product?.name || 'Product Details';
  const headerCat = productBasicInfo?.category?.name || product?.category?.name;
  const headerBrand = productBasicInfo?.brand?.name || product?.brand?.name;
  const headerSKU = productBasicInfo?.sku || product?.sku || 'N/A';

  const hasNumericStock = typeof product?.stock === 'number';
  const hasNumericMinStock = typeof product?.minStock === 'number';
  const isLowStock =
    hasNumericStock &&
    hasNumericMinStock &&
    (product?.stock as number) <= (product?.minStock as number);

  const stockBadgeVariant = isLowStock ? 'destructive' : 'outline';
  const stockBadgeLabel = isLowStock
    ? 'Low Stock'
    : hasNumericStock
      ? 'In Stock'
      : 'Stock Unknown';

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className={detailDialogContentClassName}>
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {headerName}
              </DialogTitle>
              <DialogDescription>
                {[headerSKU, headerCat, headerBrand]
                  .filter(Boolean)
                  .join(' · ') || 'N/A'}
              </DialogDescription>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant={
                    product?.status === PRODUCT_STATUS.ACTIVE
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {product?.status === PRODUCT_STATUS.ACTIVE
                    ? 'Active'
                    : 'Inactive'}
                </Badge>
                <Badge
                  variant={stockBadgeVariant}
                >
                  {stockBadgeLabel}
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
                <IconRefresh className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <InlineLoading label="Loading product details..." />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <IconX className="text-destructive mx-auto mb-4 h-8 w-8" />
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
          <div className="grid gap-4 text-sm">
            <DetailSection title="Product Summary">
              <div className="grid gap-3 md:grid-cols-3">
                <DetailMetric label="Stock" value={product.stock || 0} />
                <DetailMetric label="Min Stock" value={product.minStock || 0} />
                <DetailMetric
                  label="Selling Price"
                  value={formatCurrency(product.price || 0)}
                  accentClassName="text-green-600"
                  valueClassName="break-words text-xl leading-snug sm:text-2xl"
                />
              </div>
            </DetailSection>

            {/* Image Carousel */}
            <DetailSection title="Media">
              <div className="flex flex-col-reverse items-center gap-4 md:flex-row md:items-start md:justify-center md:flex-row-reverse">
              <div className="bg-muted mb-2 flex h-48 w-48 items-center justify-center rounded-lg">
                {images.length > 0 ? (
                  <Image
                    src={images[currentImage]}
                    alt={headerName}
                    width={192}
                    height={192}
                    className="h-48 w-48 rounded-lg object-cover"
                    style={{ height: 'auto' }}
                  />
                ) : (
                  <IconPackage className="text-muted-foreground h-16 w-16" />
                )}
              </div>
              {images.length > 1 && (
                <div className="flex h-48 flex-col flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      onClick={() => setCurrentImage(idx)}
                      className={`h-12 w-12 rounded border ${idx === currentImage ? 'border-primary' : 'border-muted'} focus:outline-none`}
                      type="button"
                    >
                      <Image
                        src={img}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                        style={{ height: 'auto' }}
                      />
                    </button>
                  ))}
                </div>
              )}
              </div>
            </DetailSection>

            {/* Description with Show More */}
            {displayedDescription && (
              <DetailSection title="Description">
                <p className="text-sm whitespace-pre-line">
                  {displayedDescription}
                </p>
                {isLongDescription && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowFullDescription(v => !v)}
                    className="h-auto p-0"
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </Button>
                )}
              </DetailSection>
            )}

            {/* Info Sections */}
            <div className="grid gap-4 md:grid-cols-2">
              <DetailSection title="Basic Information">
                <div className="grid gap-3">
                  <DetailItem label="Product Name" value={headerName} />
                  <DetailItem
                    label="SKU"
                    value={<span className="font-mono">{headerSKU}</span>}
                  />
                  <DetailItem label="Category" value={headerCat || 'N/A'} />
                  <DetailItem label="Brand" value={headerBrand || 'N/A'} />
                  {product.supplier ? (
                    <DetailItem label="Supplier" value={product.supplier.name} />
                  ) : null}
                </div>
              </DetailSection>

              <DetailSection title="Pricing">
                <div className="grid gap-3">
                  {canViewCost ? (
                    <DetailItem
                      label="Cost Price"
                      value={formatCurrency(product.cost || 0)}
                    />
                  ) : null}
                  <DetailItem
                    label="Selling Price"
                    value={formatCurrency(product.price || 0)}
                  />
                </div>
              </DetailSection>

              <DetailSection title="Stock Information">
                <div className="grid gap-3">
                  <DetailItem label="Current Stock" value={product.stock || 0} />
                  <DetailItem
                    label="Minimum Stock Level"
                    value={product.minStock || 0}
                  />
                </div>
              </DetailSection>

              <DetailSection title="Additional Information">
                <div className="grid gap-3">
                  <DetailItem
                    label="Created Date"
                    value={
                      product.createdAt
                        ? formatDate(product.createdAt, { includeTime: false })
                        : 'N/A'
                    }
                  />
                  <DetailItem
                    label="Last Updated"
                    value={
                      product.updatedAt
                        ? formatDate(product.updatedAt, { includeTime: false })
                        : 'N/A'
                    }
                  />
                </div>
              </DetailSection>
            </div>

            {product.tags && product.tags.length > 0 ? (
              <DetailSection title="Product Tags">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {/* Actions */}
            <DetailSection title="Actions">
              <div className="flex flex-wrap items-center gap-4">
              <Button asChild>
                <Link href={`/inventory/products/${product.id}/edit`}>
                  <IconEdit className="mr-2 h-4 w-4" />
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
                <IconPlus className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
              </div>
            </DetailSection>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
