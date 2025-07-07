"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from "@/hooks/useDebounce";
import {
  IconSearch,
  IconBarcode,
  IconPlus,
  IconPackage,
  IconTag,
  IconCurrency,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  description?: string;
  barcode?: string;
  status: string;
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"text" | "barcode">("text");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedSearchTerm.trim()) {
        setProducts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search: debouncedSearchTerm,
          status: "active",
          limit: "20",
        });

        const response = await fetch(`/api/products?${params}`);

        if (!response.ok) {
          throw new Error("Failed to search products");
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error searching products:", err);
        setError("Failed to search products");
        toast.error("Failed to search products");
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedSearchTerm]);

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/pos/barcode-lookup?barcode=${encodeURIComponent(barcode)}`
      );

      if (!response.ok) {
        throw new Error("Product not found");
      }

      const product = await response.json();

      if (product.stock <= 0) {
        toast.error("Product is out of stock");
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
      setSearchTerm("");
    } catch (err) {
      console.error("Error scanning barcode:", err);
      toast.error("Product not found or barcode invalid");
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Product is out of stock");
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
    setSearchTerm("");
    setProducts([]);
  };

  // Handle Enter key for barcode mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchMode === "barcode") {
      handleBarcodeScan(searchTerm);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={searchMode === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchMode("text")}
          disabled={disabled}
        >
          <IconSearch className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          variant={searchMode === "barcode" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchMode("barcode")}
          disabled={disabled}
        >
          <IconBarcode className="h-4 w-4 mr-2" />
          Barcode
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          placeholder={
            searchMode === "text"
              ? "Search products by name, SKU, or category..."
              : "Scan or enter barcode..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          className="pl-10"
        />
        {searchMode === "text" ? (
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        ) : (
          <IconBarcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchMode === "text" && products.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="outline">{product.sku}</Badge>
                      {product.stock <= 5 && (
                        <Badge variant="destructive">Low Stock</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                      <span className="flex items-center gap-1 font-semibold text-lg">
                        <IconCurrency className="h-4 w-4" />₦
                        {product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleProductSelect(product)}
                    disabled={disabled || product.stock <= 0}
                  >
                    <IconPlus className="h-4 w-4 mr-1" />
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
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">
            {searchMode === "text"
              ? "Searching products..."
              : "Looking up barcode..."}
          </p>
        </div>
      )}

      {/* No Results */}
      {searchMode === "text" &&
        debouncedSearchTerm &&
        !loading &&
        products.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconSearch className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No products found for "{debouncedSearchTerm}"</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        )}
    </div>
  );
}
