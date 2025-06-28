"use client";

import { useState, useEffect } from "react";
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
  const [reconciliations, setReconciliations] = useState<StockReconciliation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createdByFilter, setCreatedByFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isAdmin = userRole === "ADMIN";

  const fetchReconciliations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (createdByFilter !== "all") {
        params.append("createdBy", createdByFilter);
      }

      const response = await fetch(
        `/api/stock-reconciliations?${params.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setReconciliations(data.reconciliations || []);
      } else {
        toast.error(data.error || "Failed to fetch reconciliations");
        setReconciliations([]);
      }
    } catch (error) {
      console.error("Error fetching reconciliations:", error);
      toast.error("Failed to fetch reconciliations");
      setReconciliations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, [statusFilter, createdByFilter]);

  const handleSubmitForApproval = async (reconciliationId: number) => {
    setActionLoading(reconciliationId);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reconciliation submitted for approval");
        fetchReconciliations();
      } else {
        toast.error(data.error || "Failed to submit reconciliation");
      }
    } catch (error) {
      console.error("Error submitting reconciliation:", error);
      toast.error("Failed to submit reconciliation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (reconciliationId: number) => {
    setActionLoading(reconciliationId);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: "Approved via list view" }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reconciliation approved successfully");
        fetchReconciliations();
      } else {
        toast.error(data.error || "Failed to approve reconciliation");
      }
    } catch (error) {
      console.error("Error approving reconciliation:", error);
      toast.error("Failed to approve reconciliation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reconciliationId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setActionLoading(reconciliationId);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason, notes: "Rejected via list view" }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reconciliation rejected");
        fetchReconciliations();
      } else {
        toast.error(data.error || "Failed to reject reconciliation");
      }
    } catch (error) {
      console.error("Error rejecting reconciliation:", error);
      toast.error("Failed to reject reconciliation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reconciliationId: number) => {
    if (!confirm("Are you sure you want to delete this reconciliation?"))
      return;

    setActionLoading(reconciliationId);
    try {
      const response = await fetch(
        `/api/stock-reconciliations/${reconciliationId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Reconciliation deleted successfully");
        fetchReconciliations();
      } else {
        toast.error(data.error || "Failed to delete reconciliation");
      }
    } catch (error) {
      console.error("Error deleting reconciliation:", error);
      toast.error("Failed to delete reconciliation");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReconciliations = reconciliations.filter((reconciliation) => {
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
  });

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
                filteredReconciliations.map((reconciliation) => {
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
                            statusConfig[reconciliation.status].color as any
                          }
                        >
                          {statusConfig[reconciliation.status].label}
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
                                disabled={actionLoading === reconciliation.id}
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
                                  disabled={actionLoading === reconciliation.id}
                                  className="text-green-600"
                                >
                                  <IconCheck className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReject(reconciliation.id)
                                  }
                                  disabled={actionLoading === reconciliation.id}
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
                                  disabled={actionLoading === reconciliation.id}
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
