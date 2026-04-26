'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconPlus,
  IconSearch,
  IconScan,
  IconCamera,
  IconX,
  IconFilter,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/utils/image';
import type { CartItem } from '@/types/pos';
import { CACHE_DURATIONS } from '@/lib/constants';
import { queryKeys } from '@/lib/query-client';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  description?: string;
  images?: any[]; // Array of image objects or strings
  primaryImageUrl?: string | null;
  updatedAt?: string | Date | null;
}

interface ProductGridProps {
  onProductSelect: (_product: Omit<CartItem, 'quantity'>) => void;
  disabled?: boolean;
}

interface ProductFiltersPayload {
  categories?: string[];
  brands?: string[];
}

export function ProductGrid({
  onProductSelect,
  disabled = false,
}: ProductGridProps) {
  const { handleError } = usePOSErrorHandler();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [imageLoadErrors, setImageLoadErrors] = useState<
    Record<number, true>
  >({});
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const productFilters = useMemo(
    () => ({
      search: debouncedSearchTerm || '',
      category: selectedCategory,
      brand: selectedBrand,
      limit: 0,
    }),
    [debouncedSearchTerm, selectedCategory, selectedBrand]
  );

  const posProductsQueryKey = queryKeys.pos.products(productFilters);
  const { data, isLoading, error } = useQuery({
    queryKey: posProductsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', productFilters.limit.toString());

      let endpoint = '/api/pos/products';
      if (productFilters.search) {
        endpoint = '/api/pos/search-products';
        params.set('search', productFilters.search);
      } else {
        params.set('fields', 'pos');
        params.set('page', '1');
      }

      if (productFilters.category !== 'all') {
        params.set('category', productFilters.category);
      }

      if (productFilters.brand !== 'all') {
        params.set('brand', productFilters.brand);
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      return response.json();
    },
    staleTime: 30 * 1000,
    gcTime: CACHE_DURATIONS.PRODUCTS_LONG,
  });

  const { data: filterMetadata } = useQuery({
    queryKey: [...queryKeys.pos.all, 'product-filters'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '1');
      params.set('page', '1');
      params.set('fields', 'pos');
      params.set('includeFilters', 'true');

      const response = await fetch(`/api/pos/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product filters');
      }

      const payload = (await response.json()) as { filters?: ProductFiltersPayload };
      return payload.filters;
    },
    staleTime: CACHE_DURATIONS.PRODUCTS_LONG,
    gcTime: CACHE_DURATIONS.PRODUCTS_LONG,
  });

  const products = useMemo(() => {
    const payload = data as any;
    const rawProducts = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.products)
        ? payload.products
        : Array.isArray(payload?.data?.products)
          ? payload.data.products
        : Array.isArray(payload)
          ? payload
          : [];

    return rawProducts.map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      category: product.categoryName || product.category || 'Uncategorized',
      brand: product.brandName || product.brand || 'No Brand',
      description: product.description,
      images: product.images,
      primaryImageUrl: product.primaryImageUrl || null,
      updatedAt: product.updatedAt || null,
    })) as Product[];
  }, [data]);

  // Get unique categories and brands for filters
  const categories = useMemo(() => {
    if (Array.isArray(filterMetadata?.categories)) {
      return filterMetadata.categories;
    }

    return Array.from(
      new Set(products.map((p: Product) => p.category).filter(Boolean))
    ) as string[];
  }, [filterMetadata, products]);

  const brands = useMemo(() => {
    if (Array.isArray(filterMetadata?.brands)) {
      return filterMetadata.brands;
    }

    return Array.from(
      new Set(products.map((p: Product) => p.brand).filter(Boolean))
    ) as string[];
  }, [filterMetadata, products]);

  useEffect(() => {
    setImageLoadErrors({});
  }, [products]);

  const handleProductClick = (product: Product) => {
    if (disabled) return;

    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    onProductSelect({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      basePrice: product.price,
      stock: product.stock,
      category: product.category,
      brand: product.brand,
    });

  };

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const response = await fetch(
        `/api/pos/barcode-lookup?barcode=${encodeURIComponent(barcode.trim())}`
      );

      if (response.status === 404) {
        toast.error('Product not found');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to look up barcode');
      }

      const product = (await response.json()) as Product;
      handleProductClick(product);
    } catch (error) {
      const errorMessage = 'Error searching for product';
      toast.error(errorMessage);
      handleError(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (error) {
      const errorMessage = 'Unable to access camera';
      toast.error(errorMessage);
      handleError(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all';

  // Helper function to get the first/primary image from product images
  const getProductImage = (product: Product): string | null => {
    if (product.primaryImageUrl) {
      return product.primaryImageUrl;
    }

    if (
      !product.images ||
      !Array.isArray(product.images) ||
      product.images.length === 0
    ) {
      return null;
    }

    // Handle new format: array of objects with url property
    if (typeof product.images[0] === 'object' && product.images[0] !== null) {
      const imageObj = product.images[0] as any;
      if (imageObj.url) {
        return imageObj.url;
      }
    }

    // Handle legacy format: array of strings
    if (typeof product.images[0] === 'string') {
      return product.images[0] as string;
    }

    return null;
  };

  const getProductFallbackEmoji = (category?: string): string => {
    const normalizedCategory = category?.toLowerCase() || '';

    if (
      normalizedCategory.includes('wall clock') ||
      normalizedCategory.includes('clock')
    ) {
      return '🕰️';
    }

    if (normalizedCategory.includes('phone')) return '📱';
    if (normalizedCategory.includes('watch')) return '⌚';
    if (normalizedCategory.includes('laptop')) return '💻';
    if (normalizedCategory.includes('headphone')) return '🎧';
    if (normalizedCategory.includes('cable')) return '🔌';
    if (normalizedCategory.includes('charger')) return '🔋';
    if (
      normalizedCategory.includes('service') ||
      normalizedCategory.includes('cutting') ||
      normalizedCategory.includes('repair')
    ) {
      return '✂️';
    }
    if (
      normalizedCategory.includes('glass') ||
      normalizedCategory.includes('glasses') ||
      normalizedCategory.includes('sunglass') ||
      normalizedCategory.includes('spectacle')
    ) {
      return '👓';
    }
    if (
      normalizedCategory.includes('accessor') ||
      normalizedCategory.includes('box') ||
      normalizedCategory.includes('case')
    ) {
      return '📦';
    }

    return '📦';
  };

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">Error loading products</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search and Filter Controls */}
      <div className="bg-background mb-3 flex-shrink-0 space-y-3 sm:mb-4 sm:space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-10 pl-10"
              onKeyDown={e => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  // Try barcode search if it looks like a barcode
                  if (/^\d+$/.test(searchTerm.trim())) {
                    handleBarcodeSearch(searchTerm.trim());
                  }
                }
              }}
            />
          </div>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden">
                <IconFilter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader className="py-4">
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter products by category and brand
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 px-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand</label>
                  <Select
                    value={selectedBrand}
                    onValueChange={setSelectedBrand}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <IconX className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
                <div className="pt-2">
                  <p className="text-muted-foreground text-sm">
                    {isLoading
                      ? 'Loading...'
                      : `${products.length} products found`}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="icon"
            onClick={startCamera}
            disabled={isCameraOpen}
            className="hidden sm:flex"
          >
            <IconScan className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={startCamera}
            disabled={isCameraOpen}
            className="hidden sm:flex"
          >
            <IconCamera className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden flex-col gap-4 sm:flex sm:flex-row">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              <IconX className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Desktop Results Summary */}
        <div className="hidden items-center justify-between sm:flex">
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? 'Loading...'
              : `${products.length} products found`}
          </p>
        </div>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scan Barcode</h3>
              <Button variant="ghost" size="sm" onClick={stopCamera}>
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-48 w-full rounded bg-black"
            />
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Position the barcode in the camera view
            </p>
          </div>
        </div>
      )}

      {/* Product Grid - Scrollable */}
      <ScrollArea className="h-full min-h-0 flex-1 rounded-md border">
        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden pt-0 pb-2">
                <CardContent className="p-0">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-4">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="mb-2 h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            products.map((product: Product) => {
              const productImage = getProductImage(product);
              const normalizedProductImage = normalizeImageUrl(productImage);
              const resolvedProductImage = normalizedProductImage || '';
              const showImage =
                resolvedProductImage !== '' && !imageLoadErrors[product.id];

              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer overflow-hidden pt-0 pb-1 transition-all hover:scale-[1.02] hover:shadow-lg ${
                    disabled ? 'cursor-not-allowed opacity-50' : ''
                  } ${product.stock <= 0 ? 'opacity-60' : ''}`}
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[1/1] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="absolute inset-0">
                        {showImage ? (
                          <Image
                            src={resolvedProductImage}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            onError={() => {
                              setImageLoadErrors(currentErrors => ({
                                ...currentErrors,
                                [product.id]: true,
                              }));
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="mb-1 text-4xl">
                              {getProductFallbackEmoji(product.category)}
                            </div>
                          </div>
                        )}
                      </div>

                      {product.stock <= 0 && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        </div>
                      )}

                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {product.stock} left
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 p-3 sm:p-4">
                      <h3 className="line-clamp-2 text-sm leading-tight font-semibold sm:text-sm">
                        {product.name}
                      </h3>

                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>{product.sku}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary text-base font-bold sm:text-lg">
                          {formatCurrency(product.price)}
                        </span>
                        <Button
                          size="sm"
                          disabled={disabled || product.stock <= 0}
                          onClick={e => {
                            e.stopPropagation();
                            handleProductClick(product);
                          }}
                          className="h-8 px-3 sm:px-4"
                        >
                          <IconPlus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.brand && (
                          <Badge variant="outline" className="text-xs">
                            {product.brand}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
