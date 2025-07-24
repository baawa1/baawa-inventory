"use client";

import React, { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useFinancialTransactions } from "@/hooks/api/finance";
import {
  useDeleteTransaction,
  useApproveTransaction,
  useRejectTransaction,
} from "@/hooks/api/finance";
import { formatCurrency } from "@/lib/utils";
import { AppUser } from "@/types/user";

// UI Components
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";

// Icons
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface IncomeListProps {
  user: AppUser;
}

export function IncomeList({ user: _user }: IncomeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("transactionDate");
  const [_sortOrder, _setSortOrder] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Filters for income transactions only
  const filters = useMemo(
    () => ({
      type: "INCOME" as const,
      search: debouncedSearch || undefined,
      status:
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as
              | "PENDING"
              | "COMPLETED"
              | "CANCELLED"
              | "APPROVED"
              | "REJECTED"),
      page,
      limit: 10,
      sortBy,
      sortOrder: _sortOrder,
    }),
    [debouncedSearch, statusFilter, page, sortBy, _sortOrder]
  );

  const { data, isLoading, error } = useFinancialTransactions(filters);
  const deleteTransaction = useDeleteTransaction();
  const approveTransaction = useApproveTransaction();
  const rejectTransaction = useRejectTransaction();

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this income transaction?")) {
      try {
        await deleteTransaction.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveTransaction.mutateAsync(id);
    } catch (error) {
      console.error("Error approving transaction:", error);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      try {
        await rejectTransaction.mutateAsync({ id, reason });
      } catch (error) {
        console.error("Error rejecting transaction:", error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "secondary",
      COMPLETED: "default",
      CANCELLED: "destructive",
      APPROVED: "default",
      REJECTED: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive">
                Failed to load income transactions
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { transactions = [], total = 0 } = data || {};
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Income Transactions"
          description="View and manage all income transactions"
        />
        <Button asChild>
          <Link href="/finance/income/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Income
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transactionDate">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Income Transactions</CardTitle>
          <CardDescription>
            {total} income transaction{total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No income transactions found
              </p>
              <Button asChild className="mt-4">
                <Link href="/finance/income/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Income
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Income Source</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.transactionNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          {transaction.incomeDetails?.payerName && (
                            <p className="text-sm text-muted-foreground">
                              From: {transaction.incomeDetails.payerName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.incomeDetails?.incomeSource || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        +{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          transaction.transactionDate
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/finance/income/${transaction.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/finance/income/${transaction.id}/edit`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {transaction.status === "PENDING" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(transaction.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(transaction.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(transaction.id)}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
