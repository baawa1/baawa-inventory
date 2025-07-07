"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  IconArchive,
  IconArchiveOff,
  IconSearch,
  IconFilter,
  IconDots,
  IconEye,
  IconX,
  IconRefresh,
} from "@tabler/icons-react";

interface ArchivedProduct {
  id: number;
  name: string;
  sku: string;
  status: string;
  stock: number;
  price: number;
  cost: number;
  is_archived: boolean;
  archived_at: string;
  created_at: string;
  updated_at: string;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  supplier: { id: number; name: string } | null;
}

interface ArchivedProductsResponse {
  data: ArchivedProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface ArchivedProductListProps {
  user: {
    id: string;
    role: string;
  };
}

export function ArchivedProductList({ user }: ArchivedProductListProps) {
  const [products, setProducts] = useState<ArchivedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [sortBy, setSortBy] = useState("archived_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const canManageProducts = ["ADMIN", "MANAGER"].includes(user.role);

  // Fetch archived products
  const fetchArchivedProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (categoryFilter) params.append("category", categoryFilter);
      if (brandFilter) params.append("brand", brandFilter);

      const response = await fetch(`/api/products/archived?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch archived products");
      }

      const data: ArchivedProductsResponse = await response.json();
      setProducts(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch archived products"
      );
      console.error("Error fetching archived products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Unarchive product
  const handleUnarchive = async (productId: number, productName: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archived: false,
          reason: `Unarchived by ${user.role}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unarchive product");
      }

      toast.success(`Product "${productName}" has been unarchived`);
      fetchArchivedProducts(); // Refresh the list
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unarchive product";
      toast.error(message);
      console.error("Error unarchiving product:", err);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setBrandFilter("");
    setSortBy("archived_at");
    setSortOrder("desc");
  };

  // Effect to fetch products when filters change
  useEffect(() => {
    fetchArchivedProducts();
  }, [
    debouncedSearchTerm,
    categoryFilter,
    brandFilter,
    pagination.page,
    pagination.limit,
    sortBy,
    sortOrder,
  ]);

  // Effect to reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, categoryFilter, brandFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Archived Products
          </h1>
          <p className="text-muted-foreground">
            Manage and restore archived products
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchArchivedProducts}
          disabled={loading}
        >
          <IconRefresh className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {/* Categories would be fetched from API */}
              </SelectContent>
            </Select>

            {/* Brand Filter */}
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Brands</SelectItem>
                {/* Brands would be fetched from API */}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters}>
              <IconX className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Archived Products</CardTitle>
          <CardDescription>
            {pagination.total} archived products found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div>Loading archived products...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-destructive mb-2">{error}</div>
              <Button onClick={fetchArchivedProducts} variant="outline">
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <IconArchive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No archived products
              </h3>
              <p className="text-muted-foreground">
                No products have been archived yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Archived Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">
                            {product.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            No Category
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.brand ? (
                          <Badge variant="outline">{product.brand.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            No Brand
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock > 0 ? "default" : "destructive"
                          }
                        >
                          {product.stock} units
                        </Badge>
                      </TableCell>
                      <TableCell>₦{product.price.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(product.archived_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <IconEye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {canManageProducts && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <IconArchiveOff className="h-4 w-4 mr-2" />
                                    Unarchive Product
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Unarchive Product
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to unarchive "
                                      {product.name}"? This will make the
                                      product active and available again.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleUnarchive(
                                          product.id,
                                          product.name
                                        )
                                      }
                                    >
                                      Unarchive
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} products
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
