"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useFinancialTransactions,
  useDeleteTransaction,
} from "@/hooks/api/useFinancialTransactions";
import { useFinancialCategories } from "@/hooks/api/useFinancialCategories";
import { AppUser } from "@/types/user";
import { TransactionDetailModal } from "./TransactionDetailModal";

interface TransactionListProps {
  user: AppUser;
}

export function TransactionList({ user: _user }: TransactionListProps) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    categoryId: 0,
    status: "",
    page: 1,
    limit: 10,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: transactionsData, isLoading } =
    useFinancialTransactions(filters);
  const { data: categories = [] } = useFinancialCategories();
  const deleteTransaction = useDeleteTransaction();

  const transactions = transactionsData?.transactions || [];
  const total = transactionsData?.total || 0;

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction.mutateAsync(id);
        toast.success("Transaction deleted successfully");
      } catch (error) {
        toast.error("Failed to delete transaction");
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "transactionNumber",
      header: "Transaction #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.getValue("transactionNumber")}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant={type === "INCOME" ? "default" : "secondary"}>
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const currency = row.original.currency || "NGN";
        return (
          <span className="font-medium">
            {currency} {amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        return category?.name || "N/A";
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <span className="max-w-[200px] truncate" title={description}>
            {description}
          </span>
        );
      },
    },
    {
      accessorKey: "transactionDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("transactionDate") as string;
        return format(new Date(date), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors = {
          PENDING: "bg-yellow-100 text-yellow-800",
          COMPLETED: "bg-green-100 text-green-800",
          CANCELLED: "bg-red-100 text-red-800",
          APPROVED: "bg-blue-100 text-blue-800",
          REJECTED: "bg-gray-100 text-gray-800",
        };
        return (
          <Badge
            className={
              statusColors[status as keyof typeof statusColors] ||
              "bg-gray-100 text-gray-800"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTransaction(transaction);
                setIsDetailModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/finance/transactions/${transaction.id}/edit`)
              }
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(transaction.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Transactions</h1>
          <p className="text-muted-foreground">
            Manage income and expense transactions
          </p>
        </div>
        <Button onClick={() => router.push("/finance/transactions/add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value, page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.categoryId.toString()}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    categoryId: parseInt(value) || 0,
                    page: 1,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value, page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Showing {transactions.length} of {total} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions}
            isLoading={isLoading}
            pagination={{
              page: filters.page,
              limit: filters.limit,
              total,
              onPageChange: (page) => setFilters({ ...filters, page }),
            }}
          />
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}
