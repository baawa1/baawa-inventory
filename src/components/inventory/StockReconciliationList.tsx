"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconSearch,
  IconPlus,
  IconDots,
  IconEdit,
  IconEye,
  IconCheck,
  IconX,
  IconTrash,
  IconSend,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  useStockReconciliations,
  useSubmitStockReconciliation,
  useApproveStockReconciliation,
  useRejectStockReconciliation,
  useDeleteStockReconciliation,
  type StockReconciliationFilters,
} from "@/hooks/api/stock-management";

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

interface StockReconciliationListProps {
  userRole: string;
  userId: number;
}

const statusConfig = {
  DRAFT: { color: "secondary", label: "Draft" },
  PENDING: { color: "warning", label: "Pending" },
  APPROVED: { color: "success", label: "Approved" },
  REJECTED: { color: "destructive", label: "Rejected" },
} as const;

export function StockReconciliationList({
  userRole,
  userId,
}: StockReconciliationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createdByFilter, setCreatedByFilter] = useState<string>("all");

  const isAdmin = userRole === "ADMIN";

  // TanStack Query hooks
  const filters: StockReconciliationFilters = {
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  const {
    data: reconciliationData,
    isLoading,
    error,
    refetch: refetchReconciliations,
  } = useStockReconciliations(filters);

  const submitReconciliation = useSubmitStockReconciliation();
  const approveReconciliation = useApproveStockReconciliation();
  const rejectReconciliation = useRejectStockReconciliation();
  const deleteReconciliation = useDeleteStockReconciliation();

  const reconciliations = reconciliationData?.data || [];

  const handleSubmitForApproval = async (reconciliationId: number) => {
    try {
      await submitReconciliation.mutateAsync(reconciliationId);
      toast.success("Reconciliation submitted for approval");
    } catch (error) {
      console.error("Error submitting reconciliation:", error);
      toast.error("Failed to submit reconciliation");
    }
  };

  const handleApprove = async (reconciliationId: number) => {
    try {
      await approveReconciliation.mutateAsync({ id: reconciliationId });
      toast.success("Reconciliation approved successfully");
    } catch (error) {
      console.error("Error approving reconciliation:", error);
      toast.error("Failed to approve reconciliation");
    }
  };

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

  const handleDelete = async (reconciliationId: number) => {
    if (!confirm("Are you sure you want to delete this reconciliation?"))
      return;

    try {
      await deleteReconciliation.mutateAsync(reconciliationId.toString());
      toast.success("Reconciliation deleted successfully");
    } catch (error) {
      console.error("Error deleting reconciliation:", error);
      toast.error("Failed to delete reconciliation");
    }
  };

  const filteredReconciliations = reconciliations.filter(
    (reconciliation: any) => {
      const matchesSearch =
        searchTerm === "" ||
        reconciliation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reconciliation.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        `${reconciliation.createdBy.firstName} ${reconciliation.createdBy.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    }
  );

  const calculateTotalDiscrepancy = (reconciliation: StockReconciliation) => {
    return reconciliation.items.reduce(
      (total, item) => total + item.discrepancy,
      0
    );
  };

  const calculateTotalImpact = (reconciliation: StockReconciliation) => {
    return reconciliation.items.reduce(
      (total, item) => total + (item.estimatedImpact || 0),
      0
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stock Reconciliations</CardTitle>
            <CardDescription>
              Manage inventory reconciliations and approval workflows
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search reconciliations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by creator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Creators</SelectItem>
              <SelectItem value={userId.toString()}>
                My Reconciliations
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Discrepancy</TableHead>
                <TableHead>Est. Impact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading reconciliations...
                  </TableCell>
                </TableRow>
              ) : filteredReconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No reconciliations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReconciliations.map((reconciliation: any) => {
                  const totalDiscrepancy =
                    calculateTotalDiscrepancy(reconciliation);
                  const totalImpact = calculateTotalImpact(reconciliation);
                  const canEdit =
                    reconciliation.status === "DRAFT" &&
                    (isAdmin || reconciliation.createdBy.id === userId);
                  const canSubmit =
                    reconciliation.status === "DRAFT" &&
                    (isAdmin || reconciliation.createdBy.id === userId);
                  const canApprove =
                    reconciliation.status === "PENDING" && isAdmin;
                  const canDelete =
                    (reconciliation.status === "DRAFT" ||
                      reconciliation.status === "REJECTED") &&
                    (isAdmin || reconciliation.createdBy.id === userId);

                  return (
                    <TableRow key={reconciliation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {reconciliation.title}
                          </div>
                          {reconciliation.description && (
                            <div className="text-sm text-muted-foreground">
                              {reconciliation.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusConfig[
                              reconciliation.status as keyof typeof statusConfig
                            ]?.color as any
                          }
                        >
                          {
                            statusConfig[
                              reconciliation.status as keyof typeof statusConfig
                            ]?.label
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {reconciliation.createdBy.firstName}{" "}
                            {reconciliation.createdBy.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reconciliation.createdBy.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{reconciliation.items.length}</TableCell>
                      <TableCell>
                        <span
                          className={
                            totalDiscrepancy === 0
                              ? "text-green-600"
                              : totalDiscrepancy > 0
                                ? "text-blue-600"
                                : "text-red-600"
                          }
                        >
                          {totalDiscrepancy > 0 ? "+" : ""}
                          {totalDiscrepancy}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            totalImpact === 0
                              ? "text-green-600"
                              : totalImpact > 0
                                ? "text-blue-600"
                                : "text-red-600"
                          }
                        >
                          {formatCurrency(totalImpact)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(
                          reconciliation.createdAt
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                                onClick={() =>
                                  handleSubmitForApproval(reconciliation.id)
                                }
                                disabled={submitReconciliation.isPending}
                              >
                                <IconSend className="mr-2 h-4 w-4" />
                                Submit for Approval
                              </DropdownMenuItem>
                            )}

                            {canApprove && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleApprove(reconciliation.id)
                                  }
                                  disabled={approveReconciliation.isPending}
                                  className="text-green-600"
                                >
                                  <IconCheck className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReject(reconciliation.id)
                                  }
                                  disabled={rejectReconciliation.isPending}
                                  className="text-red-600"
                                >
                                  <IconX className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}

                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDelete(reconciliation.id)
                                  }
                                  disabled={deleteReconciliation.isPending}
                                  className="text-red-600"
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
