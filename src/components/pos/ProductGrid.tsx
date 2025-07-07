"use client";

import React, { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconPlus,
  IconSearch,
  IconScan,
  IconCamera,
  IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
}

interface ProductGridProps {
  onProductSelect: (product: Omit<Product, "quantity">) => void;
  disabled?: boolean;
}

export function ProductGrid({
  onProductSelect,
  disabled = false,
}: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch all products at once
  const { data, isLoading, error } = useQuery({
    queryKey: ["pos-all-products"],
    queryFn: async () => {
      const response = await fetch(`/api/pos/products?limit=0`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Get unique categories and brands for filters
  const categories = useMemo(() => {
    return Array.from(
      new Set((data || []).map((p: Product) => p.category).filter(Boolean))
    ) as string[];
  }, [data]);

  const brands = useMemo(() => {
    return Array.from(
      new Set((data || []).map((p: Product) => p.brand).filter(Boolean))
    ) as string[];
  }, [data]);

  // Filter products by search term, category, and brand
  const filteredProducts = useMemo(() => {
    if (!data) return [];

    return data.filter((product: Product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesBrand =
        selectedBrand === "all" || product.brand === selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [data, searchTerm, selectedCategory, selectedBrand]);

  const handleProductClick = (product: Product) => {
    if (disabled) return;

    if (product.stock <= 0) {
      toast.error("Product is out of stock");
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
        toast.error("Product not found");
      }
    } catch (error) {
      toast.error("Error searching for product");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (error) {
      toast.error("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
  };

  const hasActiveFilters =
    searchTerm || selectedCategory !== "all" || selectedBrand !== "all";

  if (error) {
    return (
      <div className="text-center py-8">
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
    <div className="h-full flex flex-col">
      {/* Search and Filter Controls */}
      <div className="space-y-4 mb-4 flex-shrink-0">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => {
                if (e.key === "Enter" && searchTerm.trim()) {
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
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
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
              {brands.map((brand) => (
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
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${filteredProducts.length} products found`}
          </p>
        </div>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scan Barcode</h3>
              <Button variant="ghost" size="sm" onClick={stopCamera}>
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-48 bg-black rounded"
            />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Position the barcode in the camera view
            </p>
          </div>
        </div>
      )}

      {/* Product Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            filteredProducts.map((product: Product) => (
              <Card
                key={product.id}
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                } ${product.stock <= 0 ? "opacity-60" : ""}`}
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-0">
                  {/* Product Image Background */}
                  <div
                    className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                    style={{
                      backgroundImage: `url(https://via.placeholder.com/300x200/e5e7eb/6b7280?text=${encodeURIComponent(product.name.substring(0, 20))})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 text-white text-center p-2">
                      <div className="text-2xl mb-1">📦</div>
                      {product.stock <= 0 && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.stock} left
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{product.sku}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg text-primary">
                        ₦{product.price.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        disabled={disabled || product.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                      >
                        <IconPlus className="h-3 w-3 mr-1" />
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
      </div>
    </div>
  );
}
