"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
  type PurchaseOrder as APIPurchaseOrder,
} from "@/hooks/api/purchase-orders";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconTruck,
} from "@tabler/icons-react";
import type { FilterConfig } from "@/types/inventory";
import type { DashboardTableColumn } from "@/components/layouts/DashboardColumnCustomizer";
import { logger } from "@/lib/logger";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface PurchaseOrderListProps {
  user: User;
}

export default function PurchaseOrderList({ user }: PurchaseOrderListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] =
    useState<APIPurchaseOrder | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: "orderNumber",
        label: "Order #",
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: "supplierName",
        label: "Supplier",
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: "orderDate",
        label: "Order Date",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "expectedDeliveryDate",
        label: "Expected Delivery",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "totalAmount",
        label: "Total Amount",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        defaultVisible: false,
      },
    ],
    []
  );

  // Initialize visibleColumns with default values to prevent hydration mismatch
  const defaultVisibleColumns = useMemo(
    () => columns.filter((col) => col.defaultVisible).map((col) => col.key),
    [columns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns
  );

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const purchaseOrdersQuery = usePurchaseOrders({
    search: debouncedSearchTerm,
    status: filters.status === "all" ? undefined : filters.status,
    sortBy: "orderDate",
    sortOrder: "desc",
    page: pagination.page,
    limit: pagination.limit,
  });

  const deletePurchaseOrderMutation = useDeletePurchaseOrder();

  // Extract data from queries
  const purchaseOrders = purchaseOrdersQuery.data?.data || [];
  const loading = purchaseOrdersQuery.isLoading;
  const total = purchaseOrdersQuery.data?.totalCount || 0;

  // Update pagination state from API response
  const currentPagination = {
    page: purchaseOrdersQuery.data?.page || pagination.page,
    limit: purchaseOrdersQuery.data?.limit || pagination.limit,
    totalPages: Math.ceil(
      total / (purchaseOrdersQuery.data?.limit || pagination.limit)
    ),
    totalItems: total,
  };

  // Permission checks
  const canManagePurchaseOrders = ["ADMIN", "MANAGER"].includes(user.role);
  const canDeletePurchaseOrders = user.role === "ADMIN";

  // Filter configurations - memoized to prevent unnecessary re-renders
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "all", label: "All Statuses" },
          ...Object.entries(PURCHASE_ORDER_STATUS).map(([key, value]) => ({
            value,
            label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
          })),
        ],
        placeholder: "All Statuses",
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      if (prev[key as keyof typeof prev] === value) return prev; // Prevent unnecessary updates
      return { ...prev, [key]: value };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      status: "all",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  // Handle delete purchase order
  const handleDeletePurchaseOrder = useCallback(async () => {
    if (!purchaseOrderToDelete) return;

    try {
      await deletePurchaseOrderMutation.mutateAsync(purchaseOrderToDelete.id);
      toast.success("Purchase order deleted successfully");
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
    } catch (error) {
      logger.error("Failed to delete purchase order", {
        error,
        purchaseOrderId: purchaseOrderToDelete.id,
      });
      toast.error("Failed to delete purchase order");
    }
  }, [purchaseOrderToDelete, deletePurchaseOrderMutation]);

  const getStatusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "approved":
          return "bg-green-100 text-green-800";
        case "ordered":
          return "bg-blue-100 text-blue-800";
        case "shipped":
          return "bg-cyan-100 text-cyan-800";
        case "delivered":
          return "bg-emerald-100 text-emerald-800";
        case "cancelled":
          return "bg-red-100 text-red-800";
        case "draft":
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <Badge className={getStatusColor(status)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderCell = (purchaseOrder: APIPurchaseOrder, columnKey: string) => {
    switch (columnKey) {
      case "orderNumber":
        return <div className="font-medium ">{purchaseOrder.orderNumber}</div>;
      case "supplierName":
        return (
          <div className="font-medium ">
            {purchaseOrder.suppliers?.name || "N/A"}
          </div>
        );
      case "orderDate":
        return (
          <div className="">
            {format(new Date(purchaseOrder.orderDate), "MMM dd, yyyy")}
          </div>
        );
      case "expectedDeliveryDate":
        return (
          <div className="">
            {purchaseOrder.expectedDeliveryDate
              ? format(
                  new Date(purchaseOrder.expectedDeliveryDate),
                  "MMM dd, yyyy"
                )
              : "Not set"}
          </div>
        );
      case "totalAmount":
        return (
          <div className="font-medium ">
            {formatCurrency(parseFloat(purchaseOrder.totalAmount))}
          </div>
        );
      case "status":
        return getStatusBadge(purchaseOrder.status);
      case "createdAt":
        return (
          <div className="text-gray-500">
            {format(new Date(purchaseOrder.createdAt), "MMM dd, yyyy")}
          </div>
        );
      default:
        return null;
    }
  };

  const renderActions = (purchaseOrder: APIPurchaseOrder) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/inventory/purchase-orders/${purchaseOrder.id}`}>
            <IconEye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        {canManagePurchaseOrders && (
          <DropdownMenuItem asChild>
            <Link href={`/inventory/purchase-orders/${purchaseOrder.id}/edit`}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {canDeletePurchaseOrders && (
          <>
            <DropdownMenuTrigger asChild>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setPurchaseOrderToDelete(purchaseOrder);
                  setDeleteDialogOpen(true);
                }}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuTrigger>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <InventoryPageLayout
        title="Purchase Orders"
        description="Manage and track purchase orders from suppliers"
        actions={
          canManagePurchaseOrders ? (
            <Button asChild>
              <Link
                href="/inventory/purchase-orders/add"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                New Purchase Order
              </Link>
            </Button>
          ) : undefined
        }
        searchPlaceholder="Search purchase orders..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange("search", value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        tableTitle="Purchase Orders"
        totalCount={total}
        currentCount={purchaseOrders.length}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="purchase-orders-visible-columns"
        data={purchaseOrders}
        renderCell={renderCell}
        renderActions={renderActions}
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={loading}
        emptyStateIcon={<IconTruck className="size-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.status !== "all"
            ? "No purchase orders found matching your filters."
            : "No purchase orders found. Get started by creating your first purchase order."
        }
        emptyStateAction={
          canManagePurchaseOrders ? (
            <Button asChild>
              <Link href="/inventory/purchase-orders/add">
                <IconPlus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the purchase order{" "}
              <strong>{purchaseOrderToDelete?.orderNumber}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchaseOrder}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePurchaseOrderMutation.isPending}
            >
              {deletePurchaseOrderMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
