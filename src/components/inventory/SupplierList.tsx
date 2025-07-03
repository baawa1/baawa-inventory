"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useSuppliers,
  useDeleteSupplier,
  useUpdateSupplier,
} from "@/hooks/api/suppliers";
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
  IconX,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import SupplierDetailModal from "./SupplierDetailModal";
import { EditSupplierModal } from "./EditSupplierModal";
import { Supplier } from "./supplier/types";

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
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );

  const limit = 10;

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const suppliersQuery = useSuppliers({
    search: debouncedSearchTerm,
    status: filters.isActive,
    sortBy: "name",
    sortOrder: "asc",
  });

  const deleteSupplierMutation = useDeleteSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  // Extract data from queries
  const suppliers = suppliersQuery.data?.data || [];
  const loading = suppliersQuery.isLoading;
  const error = suppliersQuery.error?.message || null;
  const totalPages = suppliersQuery.data?.pagination?.totalPages || 1;
  const total = suppliersQuery.data?.pagination?.totalSuppliers || 0;

  // Permission checks
  const user = session?.user;
  const canManageSuppliers =
    user && ["ADMIN", "MANAGER"].includes(user.role || "");
  const canDeactivateSuppliers = user && user.role === "ADMIN";

  // Modal handlers
  const handleViewSupplier = (supplierId: string) => {
    setSelectedSupplierId(parseInt(supplierId));
    setDetailModalOpen(true);
  };

  const handleEditSupplier = (supplierId: string | number) => {
    setSelectedSupplierId(
      typeof supplierId === "string" ? parseInt(supplierId) : supplierId
    );
    setEditModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedSupplierId(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedSupplierId(null);
  };

  const handleSupplierUpdated = () => {
    // Refresh the suppliers data from server
    suppliersQuery.refetch();
    handleCloseEditModal();
  };

  // Handle delete with TanStack Query mutation
  const handleDeactivate = async (supplierId: number) => {
    try {
      await deleteSupplierMutation.mutateAsync(supplierId);
      toast.success("Supplier deleted successfully");
    } catch (err) {
      console.error("Error deleting supplier:", err);
      toast.error("Failed to delete supplier");
    }
  };

  // Handle reactivate with TanStack Query mutation
  const handleReactivate = async (supplierId: number) => {
    try {
      await updateSupplierMutation.mutateAsync({
        id: supplierId,
        data: { isActive: true },
      });
      toast.success("Supplier reactivated successfully");
    } catch (err) {
      console.error("Error reactivating supplier:", err);
      toast.error("Failed to reactivate supplier");
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
              <Button onClick={() => suppliersQuery.refetch()}>
                Try Again
              </Button>
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
                            <TableCell>0</TableCell>
                            <TableCell>0</TableCell>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleViewSupplier(supplier.id.toString())
                                  }
                                >
                                  <IconEye className="h-4 w-4" />
                                </Button>
                                {canManageSuppliers && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleEditSupplier(supplier.id.toString())
                                    }
                                  >
                                    <IconEdit className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDeactivateSuppliers &&
                                  supplier.isActive && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <IconX className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Deactivate Supplier
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to deactivate
                                            "{supplier.name}
                                            "? This will mark the supplier as
                                            inactive and they won't appear in
                                            active supplier lists, but their
                                            data will be preserved for
                                            historical records.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeactivate(supplier.id)
                                            }
                                          >
                                            Deactivate
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                {canDeactivateSuppliers &&
                                  !supplier.isActive && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <IconRefresh className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Reactivate Supplier
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to reactivate
                                            "{supplier.name}
                                            "? This will mark the supplier as
                                            active and they will appear in
                                            active supplier lists again.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleReactivate(supplier.id)
                                            }
                                          >
                                            Reactivate
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

      {/* Modals */}
      <SupplierDetailModal
        supplierId={selectedSupplierId}
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        canEdit={canManageSuppliers}
        canDeactivate={canDeactivateSuppliers}
        onEdit={handleEditSupplier}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />
      <EditSupplierModal
        supplier={
          selectedSupplierId
            ? suppliers.find((s) => s.id === selectedSupplierId) || null
            : null
        }
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSupplierUpdated}
      />
    </>
  );
}
