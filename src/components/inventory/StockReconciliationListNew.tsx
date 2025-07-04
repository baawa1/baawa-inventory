"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useStockReconciliations,
  useSubmitStockReconciliation,
  useApproveStockReconciliation,
  useRejectStockReconciliation,
  useDeleteStockReconciliation,
  type StockReconciliationFilters,
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
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconEye,
  IconCheck,
  IconX,
  IconTrash,
  IconSend,
  IconClipboard,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { ColumnConfig, FilterConfig } from "@/types/inventory";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface StockReconciliation {
  id: number;
  title: string;
  description?: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  createdBy: User;
  approvedBy?: User;
  items: {
    id: number;
    systemCount: number;
    physicalCount: number;
    discrepancy: number;
    discrepancyReason?: string;
    estimatedImpact?: number;
    product: {
      id: number;
      name: string;
      sku: string;
    };
  }[];
}

interface UserProps {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  image?: string;
}

interface StockReconciliationListProps {
  userRole: string;
  userId: number;
  user: UserProps;
}

export function StockReconciliationList({
  userRole,
  userId,
  user,
}: StockReconciliationListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reconciliationToDelete, setReconciliationToDelete] =
    useState<StockReconciliation | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "title",
    "status",
    "itemCount",
    "totalDiscrepancy",
    "createdBy",
    "createdAt",
  ]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    createdBy: "",
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  const isAdmin = userRole === "ADMIN";

  // TanStack Query hooks for data fetching
  const stockFilters: StockReconciliationFilters = {
    search: debouncedSearchTerm,
    status: filters.status !== "all" ? filters.status : undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  const reconciliationsQuery = useStockReconciliations(stockFilters);
  const submitReconciliation = useSubmitStockReconciliation();
  const approveReconciliation = useApproveStockReconciliation();
  const rejectReconciliation = useRejectStockReconciliation();
  const deleteReconciliation = useDeleteStockReconciliation();

  // Extract data from queries
  const reconciliations = reconciliationsQuery.data?.data || [];
  const loading = reconciliationsQuery.isLoading;

  // Update pagination when data changes
  React.useEffect(() => {
    const totalItems = reconciliations.length;
    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages: Math.ceil(totalItems / prev.limit),
    }));
  }, [reconciliations.length]);

  // Permission checks
  const canManageReconciliations = ["ADMIN", "MANAGER"].includes(userRole);
  const canApproveReconciliations = userRole === "ADMIN";

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "DRAFT", label: "Draft" },
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
      status: "",
      createdBy: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  };

  // Handle submit for approval
  const handleSubmitForApproval = async (reconciliationId: number) => {
    try {
      await submitReconciliation.mutateAsync(reconciliationId);
      toast.success("Reconciliation submitted for approval");
    } catch (error) {
      console.error("Error submitting reconciliation:", error);
      toast.error("Failed to submit reconciliation");
    }
  };

  // Handle approve
  const handleApprove = async (reconciliationId: number) => {
    try {
      await approveReconciliation.mutateAsync({ id: reconciliationId });
      toast.success("Reconciliation approved successfully");
    } catch (error) {
      console.error("Error approving reconciliation:", error);
      toast.error("Failed to approve reconciliation");
    }
  };

  // Handle reject
  const handleReject = async (reconciliationId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await rejectReconciliation.mutateAsync({ id: reconciliationId, reason });
      toast.success("Reconciliation rejected");
    } catch (error) {
      console.error("Error rejecting reconciliation:", error);
      toast.error("Failed to reject reconciliation");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!reconciliationToDelete) return;

    try {
      await deleteReconciliation.mutateAsync(
        reconciliationToDelete.id.toString()
      );
      toast.success("Reconciliation deleted successfully");
      setDeleteDialogOpen(false);
      setReconciliationToDelete(null);
    } catch (error) {
      console.error("Error deleting reconciliation:", error);
      toast.error("Failed to delete reconciliation");
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate total discrepancy
  const calculateTotalDiscrepancy = (reconciliation: StockReconciliation) => {
    return reconciliation.items.reduce(
      (total, item) => total + Math.abs(item.discrepancy),
      0
    );
  };

  // Column configuration
  const columns: ColumnConfig[] = [
    { key: "title", label: "Title", sortable: true },
    { key: "status", label: "Status" },
    { key: "itemCount", label: "Items" },
    { key: "totalDiscrepancy", label: "Total Discrepancy" },
    { key: "createdBy", label: "Created By" },
    { key: "createdAt", label: "Created" },
  ];

  // Add actions column if user has permissions
  if (canManageReconciliations || canApproveReconciliations) {
    columns.push({ key: "actions", label: "Actions" });
  }

  // Render cell function
  const renderCell = (
    reconciliation: StockReconciliation,
    columnKey: string
  ) => {
    switch (columnKey) {
      case "title":
        return (
          <div>
            <div className="font-medium">{reconciliation.title}</div>
            {reconciliation.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {reconciliation.description}
              </div>
            )}
          </div>
        );
      case "status":
        return getStatusBadge(reconciliation.status);
      case "itemCount":
        return (
          <div className="text-center">
            <span className="font-mono">{reconciliation.items.length}</span>
          </div>
        );
      case "totalDiscrepancy":
        const totalDiscrepancy = calculateTotalDiscrepancy(reconciliation);
        return (
          <div className="text-center">
            <span
              className={`font-mono ${totalDiscrepancy > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {totalDiscrepancy}
            </span>
          </div>
        );
      case "createdBy":
        return (
          <div className="text-sm">
            <div>{`${reconciliation.createdBy.firstName} ${reconciliation.createdBy.lastName}`}</div>
            <div className="text-gray-500">
              {reconciliation.createdBy.email}
            </div>
          </div>
        );
      case "createdAt":
        return (
          <div className="text-sm">
            {new Date(reconciliation.createdAt).toLocaleDateString()}
          </div>
        );
      default:
        return null;
    }
  };

  // Render actions
  const renderActions = (reconciliation: StockReconciliation) => {
    const isOwner = reconciliation.createdBy.id === userId;
    const canEdit = reconciliation.status === "DRAFT" && (isOwner || isAdmin);
    const canSubmit = reconciliation.status === "DRAFT" && (isOwner || isAdmin);
    const canApprove = reconciliation.status === "PENDING" && isAdmin;
    const canDelete = reconciliation.status === "DRAFT" && (isOwner || isAdmin);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/inventory/stock-reconciliations/${reconciliation.id}`}
            >
              <IconEye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem asChild>
              <Link
                href={`/inventory/stock-reconciliations/${reconciliation.id}/edit`}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          )}

          {canSubmit && (
            <DropdownMenuItem
              onClick={() => handleSubmitForApproval(reconciliation.id)}
            >
              <IconSend className="mr-2 h-4 w-4" />
              Submit for Approval
            </DropdownMenuItem>
          )}

          {canApprove && (
            <>
              <DropdownMenuItem
                className="text-green-600"
                onClick={() => handleApprove(reconciliation.id)}
              >
                <IconCheck className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleReject(reconciliation.id)}
              >
                <IconX className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}

          {canDelete && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                setReconciliationToDelete(reconciliation);
                setDeleteDialogOpen(true);
              }}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Stock Reconciliations"
        description="Compare physical stock counts with system records and resolve discrepancies"
        actions={
          canManageReconciliations ? (
            <Button asChild>
              <Link
                href="/inventory/stock-reconciliations/add"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                New Reconciliation
              </Link>
            </Button>
          ) : undefined
        }
        // Filters
        searchPlaceholder="Search reconciliations..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange("search", value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Stock Reconciliations"
        totalCount={reconciliations.length}
        currentCount={reconciliations.length}
        showingText={`Showing ${reconciliations.length} reconciliations`}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="stock-reconciliations-visible-columns"
        data={reconciliations}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={reconciliationsQuery.isFetching && !loading}
        error={reconciliationsQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconClipboard className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.status
            ? "No stock reconciliations found matching your filters."
            : "No stock reconciliations found. Create your first reconciliation to get started."
        }
        emptyStateAction={
          canManageReconciliations ? (
            <Button asChild>
              <Link href="/inventory/stock-reconciliations/add">
                <IconPlus className="h-4 w-4 mr-2" />
                New Reconciliation
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              Delete Stock Reconciliation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the reconciliation "
              {reconciliationToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
