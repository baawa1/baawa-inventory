"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

interface StockAdjustmentListProps {}

export function StockAdjustmentList({}: StockAdjustmentListProps) {
  const { data: session } = useSession();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const itemsPerPage = 10;

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (filterType) {
        params.append("type", filterType);
      }

      if (filterStatus) {
        params.append("status", filterStatus);
      }

      const response = await fetch(`/api/stock-adjustments?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stock adjustments");
      }

      const result = await response.json();
      setAdjustments(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching stock adjustments:", error);
      toast.error("Failed to load stock adjustments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, [currentPage, searchTerm, filterType, filterStatus]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setFilterStatus(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleApprove = async (adjustmentId: number) => {
    try {
      const response = await fetch(
        `/api/stock-adjustments/${adjustmentId}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve adjustment");
      }

      toast.success("Stock adjustment approved successfully");
      fetchAdjustments();
    } catch (error) {
      console.error("Error approving adjustment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve adjustment"
      );
    }
  };

  const handleReject = async (adjustmentId: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      const response = await fetch(
        `/api/stock-adjustments/${adjustmentId}/approve`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject adjustment");
      }

      toast.success("Stock adjustment rejected successfully");
      setRejectionReason("");
      fetchAdjustments();
    } catch (error) {
      console.error("Error rejecting adjustment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject adjustment"
      );
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case "INCREASE":
      case "RETURN":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "DECREASE":
      case "DAMAGE":
      case "TRANSFER":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "RECOUNT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getQuantityDisplay = (adjustment: StockAdjustment) => {
    const { adjustment_type, quantity, old_quantity, new_quantity } =
      adjustment;

    if (adjustment_type === "RECOUNT") {
      const diff = new_quantity - old_quantity;
      return `${diff > 0 ? "+" : ""}${diff}`;
    }

    return quantity > 0 ? `+${quantity}` : `${quantity}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustments</CardTitle>
          <CardDescription>Loading adjustments...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stock Adjustments</CardTitle>
              <CardDescription>
                Track and manage inventory stock adjustments with detailed
                reasons
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/inventory/stock-adjustments/add">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Adjustment
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by product name, SKU, or reason..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterType || "all"}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INCREASE">Increase</SelectItem>
                <SelectItem value="DECREASE">Decrease</SelectItem>
                <SelectItem value="RECOUNT">Recount</SelectItem>
                <SelectItem value="DAMAGE">Damage</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus || "all"}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Adjustments Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantity Change</TableHead>
                  <TableHead>Previous Stock</TableHead>
                  <TableHead>New Stock</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No stock adjustments found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {adjustment.product?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {adjustment.product?.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getAdjustmentTypeColor(
                            adjustment.adjustment_type
                          )}
                        >
                          {adjustment.adjustment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(adjustment.status)}>
                          {adjustment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-mono font-medium ${
                            adjustment.adjustment_type === "INCREASE" ||
                            adjustment.adjustment_type === "RETURN"
                              ? "text-green-600"
                              : adjustment.adjustment_type === "DECREASE" ||
                                  adjustment.adjustment_type === "DAMAGE" ||
                                  adjustment.adjustment_type === "TRANSFER"
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {getQuantityDisplay(adjustment)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {adjustment.old_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">
                          {adjustment.new_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="truncate" title={adjustment.reason}>
                            {adjustment.reason}
                          </div>
                          {adjustment.reference_number && (
                            <div className="text-sm text-gray-500">
                              Ref: {adjustment.reference_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {adjustment.user
                              ? `${adjustment.user.first_name} ${adjustment.user.last_name}`
                              : "Unknown User"}
                          </div>
                          <div className="text-gray-500">
                            {adjustment.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(adjustment.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Edit button - only for pending adjustments by the user or admin */}
                          {adjustment.status === "PENDING" &&
                            (adjustment.user?.id ===
                              parseInt(session?.user?.id || "0") ||
                              session?.user?.role === "ADMIN") && (
                              <Link
                                href={`/inventory/stock-adjustments/${adjustment.id}/edit`}
                              >
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}

                          {/* Admin approval/rejection actions */}
                          {session?.user?.role === "ADMIN" &&
                            adjustment.status === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(adjustment.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Reject Stock Adjustment
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Please provide a reason for rejecting
                                        this stock adjustment for{" "}
                                        {adjustment.product?.name}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="space-y-2">
                                      <Label htmlFor="rejection-reason">
                                        Rejection Reason
                                      </Label>
                                      <Textarea
                                        id="rejection-reason"
                                        placeholder="Explain why this adjustment is being rejected..."
                                        value={rejectionReason}
                                        onChange={(e) =>
                                          setRejectionReason(e.target.value)
                                        }
                                      />
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        onClick={() => setRejectionReason("")}
                                      >
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleReject(adjustment.id)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Reject Adjustment
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
