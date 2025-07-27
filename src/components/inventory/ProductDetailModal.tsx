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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-3xl">
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
                    product?.status === 'ACTIVE' ? 'default' : 'secondary'
                  }
                >
                  {product?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </Badge>
                <Badge
                  variant={
                    product?.stock &&
                    product?.minStock &&
                    product?.stock <= product?.minStock
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {product?.stock &&
                  product?.minStock &&
                  product?.stock <= product?.minStock
                    ? 'Low Stock'
                    : 'In Stock'}
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
            <div className="text-center">
              <IconRefresh className="mx-auto mb-4 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">
                Loading product details...
              </p>
            </div>
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
          <div className="space-y-6">
            {/* Image Carousel */}
            <div className="flex flex-row-reverse items-start justify-center gap-4">
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

            {/* Description with Show More */}
            {displayedDescription && (
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Description
                </label>
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
              </div>
            )}

            {/* Info Sections */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <label className="text-muted-foreground text-sm font-medium">
                      Product Name
                    </label>
                    <p className="text-sm">{headerName}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      SKU
                    </label>
                    <p className="font-mono text-sm">{headerSKU}</p>
                  </div>
                  {product.barcode && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Barcode
                      </label>
                      <p className="font-mono text-sm">{product.barcode}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Category
                    </label>
                    <p className="text-sm">{headerCat || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Brand
                    </label>
                    <p className="text-sm">{headerBrand || 'N/A'}</p>
                  </div>
                  {product.supplier && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Supplier
                      </label>
                      <p className="text-sm">{product.supplier?.name}</p>
                    </div>
                  )}
                  {/* <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Unit
                    </label>
                    <p className="text-sm">{product.unit || "N/A"}</p>
                  </div> */}
                </CardContent>
              </Card>

              {/* Pricing Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCurrencyNaira className="h-5 w-5" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Cost Price
                    </label>
                    <p className="text-sm">
                      {formatCurrency(product.cost || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Selling Price
                    </label>
                    <p className="text-sm">
                      {formatCurrency(product.price || 0)}
                    </p>
                  </div>
                  {product.salePrice && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Sale Price
                      </label>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(product.salePrice)}
                      </p>
                    </div>
                  )}
                  {product.saleStartDate && product.saleEndDate && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Sale Period
                      </label>
                      <p className="text-sm">
                        {formatDate(product.saleStartDate, {
                          includeTime: false,
                        })}{' '}
                        -{' '}
                        {formatDate(product.saleEndDate, {
                          includeTime: false,
                        })}
                      </p>
                    </div>
                  )}
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
                    <label className="text-muted-foreground text-sm font-medium">
                      Current Stock
                    </label>
                    <p className="text-sm">{product.stock || 0}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Minimum Stock Level
                    </label>
                    <p className="text-sm">{product.minStock || 0}</p>
                  </div>
                  {product.maxStock && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Maximum Stock Level
                      </label>
                      <p className="text-sm">{product.maxStock}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Specifications Card */}
              {(product.weight ||
                product.dimensions ||
                product.color ||
                product.size ||
                product.material ||
                (product.tags && product.tags.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconRuler className="h-5 w-5" />
                      Product Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {product.weight && (
                      <div>
                        <label className="text-muted-foreground text-sm font-medium">
                          Weight
                        </label>
                        <p className="text-sm">{product.weight} kg</p>
                      </div>
                    )}
                    {product.dimensions && (
                      <div>
                        <label className="text-muted-foreground text-sm font-medium">
                          Dimensions
                        </label>
                        <p className="text-sm">{product.dimensions}</p>
                      </div>
                    )}
                    {product.color && (
                      <div>
                        <label className="text-muted-foreground text-sm font-medium">
                          Color
                        </label>
                        <p className="text-sm">{product.color}</p>
                      </div>
                    )}
                    {product.size && (
                      <div>
                        <label className="text-muted-foreground text-sm font-medium">
                          Size
                        </label>
                        <p className="text-sm">{product.size}</p>
                      </div>
                    )}
                    {product.material && (
                      <div>
                        <label className="text-muted-foreground text-sm font-medium">
                          Material
                        </label>
                        <p className="text-sm">{product.material}</p>
                      </div>
                    )}
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <label className="text-muted-foreground text-sm font-medium">
                          Tags
                        </label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {product.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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
                    <label className="text-muted-foreground text-sm font-medium">
                      Created Date
                    </label>
                    <p className="text-sm">
                      {product.createdAt
                        ? formatDate(product.createdAt, { includeTime: false })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Last Updated
                    </label>
                    <p className="text-sm">
                      {product.updatedAt
                        ? formatDate(product.updatedAt, { includeTime: false })
                        : 'N/A'}
                    </p>
                  </div>
                  {product.isFeatured && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Featured
                      </label>
                      <br />
                      <Badge variant="default" className="bg-yellow-500">
                        Featured Product
                      </Badge>
                    </div>
                  )}
                  {product.hasVariants && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Variants
                      </label>
                      <br />
                      <Badge variant="outline">Has Variants</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
