'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

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
}

interface ProductGridProps {
  onProductSelect: (_product: Omit<Product, 'quantity'>) => void;
  disabled?: boolean;
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch all products at once
  const { data, isLoading, error } = useQuery({
    queryKey: ['pos-all-products'],
    queryFn: async () => {
      const response = await fetch(`/api/pos/products?limit=0`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Extract products from API response - memoized to prevent unnecessary re-renders
  const products = useMemo(() => data?.data || [], [data?.data]);

  // Get unique categories and brands for filters
  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p: Product) => p.category).filter(Boolean))
    ) as string[];
  }, [products]);

  const brands = useMemo(() => {
    return Array.from(
      new Set(products.map((p: Product) => p.brand).filter(Boolean))
    ) as string[];
  }, [products]);

  // Filter products by search term, category, and brand
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product: Product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      const matchesBrand =
        selectedBrand === 'all' || product.brand === selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand]);

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
      stock: product.stock,
      category: product.category,
      brand: product.brand,
    });

    toast.success(`${product.name} added to cart`);
  };

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const product = filteredProducts.find(
        (p: Product) => p.barcode === barcode.trim()
      );
      if (product) {
        handleProductClick(product);
      } else {
        toast.error('Product not found');
      }
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
    searchTerm || selectedCategory !== 'all' || selectedBrand !== 'all';

  // Helper function to get the first/primary image from product images
  const getProductImage = (product: Product): string | null => {
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
      <div className="bg-background mb-4 flex-shrink-0 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              placeholder="Search products by name, SKU, or barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={e => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  // Try barcode search if it looks like a barcode
                  if (/^\d+$/.test(searchTerm.trim())) {
                    handleBarcodeSearch(searchTerm.trim());
                  }
                }
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={startCamera}
            disabled={isCameraOpen}
          >
            <IconScan className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={startCamera}
            disabled={isCameraOpen}
          >
            <IconCamera className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
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

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? 'Loading...'
              : `${filteredProducts.length} products found`}
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
        <div className="grid grid-cols-1 gap-4 p-4 pr-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-4">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="mb-2 h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            filteredProducts.map((product: Product) => (
              <Card
                key={product.id}
                className={`cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg ${
                  disabled ? 'cursor-not-allowed opacity-50' : ''
                } ${product.stock <= 0 ? 'opacity-60' : ''}`}
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-0">
                  {/* Product Image Background */}
                  <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {getProductImage(product) ? (
                      <Image
                        src={getProductImage(product)!}
                        alt={product.name}
                        fill
                        className="object-cover"
                        onError={() => {
                          // Fallback to gradient background if image fails to load
                          const imgElement = document.querySelector(
                            `[alt="${product.name}"]`
                          ) as HTMLImageElement;
                          if (imgElement) {
                            imgElement.style.display = 'none';
                            const fallbackElement =
                              imgElement.nextElementSibling as HTMLElement;
                            if (fallbackElement) {
                              fallbackElement.classList.remove('hidden');
                            }
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${getProductImage(product) ? 'hidden' : ''}`}
                    >
                      <div className="mb-1 text-2xl">
                        {product.category?.toLowerCase().includes('phone')
                          ? '📱'
                          : product.category?.toLowerCase().includes('watch')
                            ? '⌚'
                            : product.category?.toLowerCase().includes('laptop')
                              ? '💻'
                              : product.category
                                    ?.toLowerCase()
                                    .includes('headphone')
                                ? '🎧'
                                : product.category
                                      ?.toLowerCase()
                                      .includes('cable')
                                  ? '🔌'
                                  : product.category
                                        ?.toLowerCase()
                                        .includes('charger')
                                    ? '🔋'
                                    : '📦'}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 p-2 text-center text-white">
                      {product.stock <= 0 && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                      <div className="mt-1 text-xs font-medium opacity-90">
                        {product.name.substring(0, 25)}
                        {product.name.length > 25 ? '...' : ''}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.stock} left
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-sm leading-tight font-semibold">
                      {product.name}
                    </h3>

                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>{product.sku}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-primary text-lg font-bold">
                        {formatCurrency(product.price)}
                      </span>
                      <Button
                        size="sm"
                        disabled={disabled || product.stock <= 0}
                        onClick={e => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
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
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
