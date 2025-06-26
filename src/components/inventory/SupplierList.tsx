"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconPhone,
  IconMail,
  IconFilter,
  IconTruck,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    purchaseOrders: number;
  };
}

interface SupplierListResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SupplierList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });

  const limit = 10;

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // Permission checks
  const user = session?.user;
  const canManageSuppliers =
    user && ["ADMIN", "MANAGER"].includes(user.role || "");
  const canDeleteSuppliers = user && user.role === "ADMIN";

  // Fetch suppliers data
  const fetchSuppliers = useCallback(async () => {
    // Don't fetch if session is still loading or not authenticated
    if (status === "loading" || status === "unauthenticated") {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      if (filters.isActive) {
        params.append("isActive", filters.isActive);
      }

      const response = await fetch(`/api/suppliers?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      const data: SupplierListResponse = await response.json();
      setSuppliers(data.suppliers || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Failed to load suppliers. Please try again.");
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [status, currentPage, debouncedSearchTerm, filters.isActive]);

  // Delete supplier
  const handleDelete = async (supplierId: number) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete supplier");
      }

      toast.success("Supplier deleted successfully");
      fetchSuppliers(); // Refresh list
    } catch (err) {
      console.error("Error deleting supplier:", err);
      toast.error("Failed to delete supplier");
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for the API
    const apiValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: apiValue }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      isActive: "",
    });
    setCurrentPage(1);
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handle loading and authentication states
  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">
                Please log in to access suppliers.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchSuppliers}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header Section */}
            <PageHeader
              title="Suppliers"
              description="Manage your suppliers and vendor relationships"
              action={
                canManageSuppliers
                  ? {
                      label: "Add Supplier",
                      href: "/inventory/suppliers/add",
                      icon: <IconPlus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />

            {/* Filters Section */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconFilter className="h-5 w-5" />
                    Filters & Search
                  </CardTitle>
                  <CardDescription>
                    Filter and search through your suppliers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-start gap-4">
                    {/* Search */}
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search suppliers..."
                        value={filters.search}
                        onChange={(e) =>
                          handleFilterChange("search", e.target.value)
                        }
                        className="pl-9 pr-8"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        </div>
                      )}
                    </div>

                    {/* Status Filter */}
                    <Select
                      value={filters.isActive === "" ? "all" : filters.isActive}
                      onValueChange={(value) =>
                        handleFilterChange("isActive", value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suppliers Table */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">
                        Loading suppliers...
                      </div>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <IconTruck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-muted-foreground mb-4">
                        {filters.search || filters.isActive
                          ? "No suppliers found matching your criteria."
                          : "No suppliers found. Add your first supplier to get started."}
                      </p>
                      {!filters.search &&
                        !filters.isActive &&
                        canManageSuppliers && (
                          <Link href="/inventory/suppliers/add">
                            <Button>
                              <IconPlus className="h-4 w-4 mr-2" />
                              Add First Supplier
                            </Button>
                          </Link>
                        )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Contact Info</TableHead>
                          <TableHead>Products</TableHead>
                          <TableHead>Purchase Orders</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">
                              {supplier.name}
                            </TableCell>
                            <TableCell>
                              {supplier.contactPerson || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {supplier.email && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <IconMail className="h-3 w-3 mr-1" />
                                    {supplier.email}
                                  </div>
                                )}
                                {supplier.phone && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <IconPhone className="h-3 w-3 mr-1" />
                                    {supplier.phone}
                                  </div>
                                )}
                                {!supplier.email && !supplier.phone && "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {supplier._count?.products || 0}
                            </TableCell>
                            <TableCell>
                              {supplier._count?.purchaseOrders || 0}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  supplier.isActive ? "default" : "secondary"
                                }
                              >
                                {supplier.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/inventory/suppliers/${supplier.id}`}
                                >
                                  <Button variant="ghost" size="sm">
                                    <IconEye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {canManageSuppliers && (
                                  <Link
                                    href={`/inventory/suppliers/${supplier.id}/edit`}
                                  >
                                    <Button variant="ghost" size="sm">
                                      <IconEdit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {canDeleteSuppliers && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <IconTrash className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Supplier
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "
                                          {supplier.name}
                                          "? This action cannot be undone and
                                          will affect all related products and
                                          purchase orders.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDelete(supplier.id)
                                          }
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {suppliers.length} of {total} suppliers (Page{" "}
                        {currentPage} of {totalPages})
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
