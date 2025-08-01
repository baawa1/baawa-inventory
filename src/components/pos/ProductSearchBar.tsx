'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useDebounce } from '@/hooks/useDebounce';
import { BarcodeScanner } from './BarcodeScanner';
import {
  IconSearch,
  IconBarcode,
  IconPlus,
  IconPackage,
  IconTag,
  IconCurrency,
  IconCamera,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import {
  useProductSearch,
  useBarcodeLookupMutation,
  type POSProduct,
} from '@/hooks/api/pos';

interface ProductSearchBarProps {
  onProductSelect: (product: {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category?: string;
    brand?: string;
  }) => void;
  disabled?: boolean;
}

export function ProductSearchBar({
  onProductSelect,
  disabled = false,
}: ProductSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'barcode' | 'camera'>(
    'text'
  );
  const [showScanner, setShowScanner] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // TanStack Query hooks
  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useProductSearch(debouncedSearchTerm, searchMode === 'text');

  const barcodeMutation = useBarcodeLookupMutation();

  const products = searchData?.products || [];
  const loading = searchLoading || barcodeMutation.isPending;
  const error = searchError ? 'Failed to search products' : null;

  // Handle barcode scan (manual entry or camera)
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const product = await barcodeMutation.mutateAsync(barcode);

      if (product.stock <= 0) {
        toast.error('Product is out of stock');
        return;
      }

      onProductSelect({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        category: product.category?.name,
        brand: product.brand?.name,
      });

      toast.success(`Added ${product.name} to cart`);
      setSearchTerm('');
    } catch (_error) {
      toast.error('Product not found or barcode invalid');
    }
  };

  // Handle camera scan
  const handleCameraScan = (barcode: string) => {
    setShowScanner(false);
    handleBarcodeScan(barcode);
  };

  // Start camera scanning
  const startCameraScanning = () => {
    setShowScanner(true);
  };

  // Handle product selection
  const handleProductSelect = (product: POSProduct) => {
    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    onProductSelect({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      category: product.category?.name,
      brand: product.brand?.name,
    });

    toast.success(`Added ${product.name} to cart`);
    setSearchTerm('');
  };

  // Handle Enter key for barcode mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchMode === 'barcode') {
      handleBarcodeScan(searchTerm);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={searchMode === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchMode('text')}
          disabled={disabled}
        >
          <IconSearch className="mr-2 h-4 w-4" />
          Search
        </Button>
        <Button
          variant={searchMode === 'barcode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchMode('barcode')}
          disabled={disabled}
        >
          <IconBarcode className="mr-2 h-4 w-4" />
          Barcode
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={startCameraScanning}
          disabled={disabled}
        >
          <IconCamera className="mr-2 h-4 w-4" />
          Camera
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          placeholder={
            searchMode === 'text'
              ? 'Search products by name, SKU, or category...'
              : 'Scan or enter barcode...'
          }
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          className="pl-10"
        />
        {searchMode === 'text' ? (
          <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        ) : (
          <IconBarcode className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded bg-red-50 p-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchMode === 'text' && products.length > 0 && (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {products.map(product => (
            <Card
              key={product.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="outline">{product.sku}</Badge>
                      {product.stock <= 5 && (
                        <Badge variant="destructive">Low Stock</Badge>
                      )}
                    </div>

                    <div className="text-muted-foreground mb-2 flex items-center gap-4 text-sm">
                      {product.category && (
                        <span className="flex items-center gap-1">
                          <IconTag className="h-3 w-3" />
                          {product.category.name}
                        </span>
                      )}
                      {product.brand && (
                        <span className="flex items-center gap-1">
                          <IconPackage className="h-3 w-3" />
                          {product.brand.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <IconPackage className="h-3 w-3" />
                        {product.stock} in stock
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-lg font-semibold">
                        <IconCurrency className="h-4 w-4" />
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleProductSelect(product)}
                    disabled={disabled || product.stock <= 0}
                  >
                    <IconPlus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-4 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2 text-sm">
            {searchMode === 'text'
              ? 'Searching products...'
              : 'Looking up barcode...'}
          </p>
        </div>
      )}

      {/* No Results */}
      {searchMode === 'text' &&
        debouncedSearchTerm &&
        !loading &&
        products.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            <IconSearch className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No products found for "{debouncedSearchTerm}"</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        )}

      {/* Camera Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleCameraScan}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
}
