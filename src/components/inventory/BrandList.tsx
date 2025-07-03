"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrands, useDeleteBrand } from "@/hooks/api/brands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function BrandList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = searchTerm !== debouncedSearchTerm;

  // Build query filters
  const filters = {
    offset: (currentPage - 1) * 10,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc" as const,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(statusFilter !== "all" && {
      isActive: statusFilter === "active",
    }),
  };

  // Fetch brands with TanStack Query (only when authenticated)
  const {
    data: brandsData,
    isLoading,
    error,
    isError,
  } = useBrands(status === "authenticated" ? filters : {});

  // Delete mutation
  const deleteBrandMutation = useDeleteBrand();

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const brands = brandsData?.data || [];
  const totalPages = brandsData?.pagination?.pages || 1;
  const totalBrands = brandsData?.pagination?.total || 0;

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBrandMutation.mutateAsync(id);
      toast.success("Brand deleted successfully");
    } catch (error) {
      console.error("Error deleting brand:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete brand";
      toast.error(errorMessage);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-80 h-10 bg-gray-200 animate-pulse rounded-md" />
            <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-md" />
          </div>
          <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-80">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            )}
            <Input
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <Button asChild>
          <Link href="/inventory/brands/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Link>
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {brands?.length || 0} of {totalBrands} brands
      </div>

      {/* Brands Grid */}
      {(brands?.length || 0) === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "No brands found matching your criteria."
              : "No brands found. Create your first brand to get started."}
          </div>
          <Button asChild>
            <Link href="/inventory/brands/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(brands || []).map((brand) => (
            <Card key={brand.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    {brand.name}
                  </CardTitle>
                  <Badge variant={brand.isActive ? "default" : "secondary"}>
                    {brand.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/inventory/brands/${brand.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteBrandMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Brand</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{brand.name}"? This
                          action cannot be undone.
                          {brand.isActive && " This brand is currently active."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(brand.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {brand.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {brand.description}
                  </p>
                )}

                {brand.website && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      asChild
                    >
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit Website
                      </a>
                    </Button>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(brand.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
