"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useStockAdjustments,
  useApproveStockAdjustment,
  useRejectStockAdjustment,
  type StockAdjustmentFilters,
} from "@/hooks/api/stock-management";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconEye,
  IconCheck,
  IconX,
  IconAdjustments,
  IconAlertTriangle,
  IconDownload,
} from "@tabler/icons-react";
import type { ColumnConfig, FilterConfig } from "@/types/inventory";

interface StockAdjustment {
  id: number;
  adjustment_type:
    | "INCREASE"
    | "DECREASE"
    | "RECOUNT"
    | "DAMAGE"
    | "TRANSFER"
    | "RETURN";
  quantity: number;
  old_quantity: number;
  new_quantity: number;
  reason: string;
  notes?: string;
  reference_number?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  product?: {
    id: number;
    name: string;
    sku: string;
    category: string;
  };
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  approver?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  image?: string;
}

interface StockAdjustmentListProps {
  user: User;
}

export function StockAdjustmentList({ user }: StockAdjustmentListProps) {
  const { data: session } = useSession();
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [adjustmentToReject, setAdjustmentToReject] =
    useState<StockAdjustment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "product",
    "type",
    "quantity",
    "reason",
    "status",
    "user",
    "created_at",
  ]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const stockFilters: StockAdjustmentFilters = {
    search: debouncedSearchTerm,
    type: filters.type,
    status: filters.status,
    page: pagination.page,
    limit: pagination.limit,
  };

  const adjustmentsQuery = useStockAdjustments(stockFilters);
  const approveAdjustment = useApproveStockAdjustment();
  const rejectAdjustment = useRejectStockAdjustment();

  // Extract data from queries
  const adjustments = adjustmentsQuery.data?.data || [];
  const loading = adjustmentsQuery.isLoading;
  const total = adjustmentsQuery.data?.pagination?.totalPages || 0;

  // Update pagination when data changes
  React.useEffect(() => {
    const totalItems = adjustmentsQuery.data?.pagination?.totalPages || 0;
    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages: Math.ceil(totalItems / prev.limit),
    }));
  }, [adjustmentsQuery.data]);

  // Permission checks
  const canManageAdjustments = ["ADMIN", "MANAGER"].includes(user.role);
  const canApproveAdjustments = user.role === "ADMIN";

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { value: "INCREASE", label: "Increase" },
        { value: "DECREASE", label: "Decrease" },
        { value: "RECOUNT", label: "Recount" },
        { value: "DAMAGE", label: "Damage" },
        { value: "TRANSFER", label: "Transfer" },
        { value: "RETURN", label: "Return" },
      ],
      placeholder: "All Types",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
      ],
      placeholder: "All Status",
    },
  ];

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      type: "",
      status: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  };

  // Handle approve adjustment
  const handleApprove = async (adjustmentId: number) => {
    try {
      await approveAdjustment.mutateAsync(adjustmentId.toString());
      toast.success("Stock adjustment approved successfully");
    } catch (error) {
      console.error("Error approving adjustment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve adjustment"
      );
    }
  };

  // Handle reject adjustment
  const handleReject = async () => {
    if (!adjustmentToReject || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectAdjustment.mutateAsync({
        id: adjustmentToReject.id.toString(),
        rejectionReason,
      });
      toast.success("Stock adjustment rejected successfully");
      setRejectionReason("");
      setRejectionDialogOpen(false);
      setAdjustmentToReject(null);
    } catch (error) {
      console.error("Error rejecting adjustment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject adjustment"
      );
    }
  };

  // Get adjustment type badge color
  const getAdjustmentTypeBadge = (type: string) => {
    switch (type) {
      case "INCREASE":
      case "RETURN":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {type}
          </Badge>
        );
      case "DECREASE":
      case "DAMAGE":
      case "TRANSFER":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            {type}
          </Badge>
        );
      case "RECOUNT":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {type}
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get quantity display with color
  const getQuantityDisplay = (adjustment: StockAdjustment) => {
    const { adjustment_type, quantity, old_quantity, new_quantity } =
      adjustment;

    if (adjustment_type === "RECOUNT") {
      const diff = new_quantity - old_quantity;
      return (
        <span
          className={`font-mono font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-blue-600"}`}
        >
          {diff > 0 ? "+" : ""}
          {diff}
        </span>
      );
    }

    return (
      <span
        className={`font-mono font-medium ${quantity > 0 ? "text-green-600" : "text-red-600"}`}
      >
        {quantity > 0 ? "+" : ""}
        {quantity}
      </span>
    );
  };

  // Column configuration
  const columns: ColumnConfig[] = [
    { key: "product", label: "Product", sortable: true },
    { key: "type", label: "Type" },
    { key: "quantity", label: "Quantity Change" },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status" },
    { key: "user", label: "User" },
    { key: "created_at", label: "Date" },
  ];

  // Add actions column if user has permissions
  if (canManageAdjustments || canApproveAdjustments) {
    columns.push({ key: "actions", label: "Actions" });
  }

  // Render cell function
  const renderCell = (adjustment: StockAdjustment, columnKey: string) => {
    switch (columnKey) {
      case "product":
        return (
          <div>
            <div className="font-medium">{adjustment.product?.name}</div>
            <div className="text-sm text-gray-500">
              SKU: {adjustment.product?.sku}
            </div>
          </div>
        );
      case "type":
        return getAdjustmentTypeBadge(adjustment.adjustment_type);
      case "quantity":
        return getQuantityDisplay(adjustment);
      case "reason":
        return (
          <div className="max-w-xs">
            <div className="truncate" title={adjustment.reason}>
              {adjustment.reason}
            </div>
            {adjustment.reference_number && (
              <div className="text-sm text-gray-500">
                Ref: {adjustment.reference_number}
              </div>
            )}
          </div>
        );
      case "status":
        return getStatusBadge(adjustment.status);
      case "user":
        return (
          <div className="text-sm">
            <div>
              {adjustment.user
                ? `${adjustment.user.first_name} ${adjustment.user.last_name}`
                : "Unknown User"}
            </div>
            <div className="text-gray-500">{adjustment.user?.email}</div>
          </div>
        );
      case "created_at":
        return (
          <div className="text-sm">
            {new Date(adjustment.created_at).toLocaleDateString()}
          </div>
        );
      default:
        return null;
    }
  };

  // Render actions
  const renderActions = (adjustment: StockAdjustment) => {
    if (!canManageAdjustments && !canApproveAdjustments) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <IconEye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          {/* Edit button - only for pending adjustments by the user or admin */}
          {adjustment.status === "PENDING" &&
            (adjustment.user?.id === parseInt(session?.user?.id || "0") ||
              session?.user?.role === "ADMIN") && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/inventory/stock-adjustments/${adjustment.id}/edit`}
                >
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
            )}

          {/* Admin approval actions */}
          {canApproveAdjustments && adjustment.status === "PENDING" && (
            <>
              <DropdownMenuItem
                className="text-green-600"
                onClick={() => handleApprove(adjustment.id)}
              >
                <IconCheck className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setAdjustmentToReject(adjustment);
                  setRejectionDialogOpen(true);
                }}
              >
                <IconX className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Stock Adjustments"
        description="Track and manage inventory stock adjustments with detailed reasons"
        actions={
          <>
            <Button variant="outline" size="sm">
              <IconDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canManageAdjustments && (
              <Button asChild>
                <Link
                  href="/inventory/stock-adjustments/add"
                  className="flex items-center gap-2"
                >
                  <IconPlus className="h-4 w-4" />
                  New Adjustment
                </Link>
              </Button>
            )}
          </>
        }
        // Filters
        searchPlaceholder="Search by product name, SKU, or reason..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange("search", value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Stock Adjustments"
        totalCount={total}
        currentCount={adjustments.length}
        showingText={`Showing ${adjustments.length} of ${total} adjustments`}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="stock-adjustments-visible-columns"
        data={adjustments}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={adjustmentsQuery.isFetching && !loading}
        error={adjustmentsQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconAdjustments className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.type || filters.status
            ? "No stock adjustments found matching your filters."
            : "No stock adjustments found. Create your first adjustment to get started."
        }
        emptyStateAction={
          canManageAdjustments ? (
            <Button asChild>
              <Link href="/inventory/stock-adjustments/add">
                <IconPlus className="h-4 w-4 mr-2" />
                New Adjustment
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Rejection Confirmation Dialog */}
      <AlertDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              Reject Stock Adjustment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this stock adjustment for{" "}
              {adjustmentToReject?.product?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this adjustment is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Adjustment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
