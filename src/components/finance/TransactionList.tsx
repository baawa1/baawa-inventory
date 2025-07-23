"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { DashboardTableLayout } from "@/components/layouts/DashboardTableLayout";
import { DashboardTableColumn } from "@/components/layouts/DashboardColumnCustomizer";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
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
    type: "ALL",
    categoryId: 0,
    status: "ALL",
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
      } catch (_error) {
        toast.error("Failed to delete transaction");
      }
    }
  };

  const columns: DashboardTableColumn[] = [
    {
      key: "transactionNumber",
      label: "Transaction #",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
    },
    {
      key: "transactionDate",
      label: "Date",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
    },
  ];

  const renderCell = (transaction: any, columnKey: string) => {
    switch (columnKey) {
      case "transactionNumber":
        return (
          <span className="font-mono text-sm">
            {transaction.transactionNumber}
          </span>
        );
      case "type":
        return (
          <Badge
            variant={transaction.type === "INCOME" ? "default" : "secondary"}
          >
            {transaction.type}
          </Badge>
        );
      case "amount":
        const currency = transaction.currency || "NGN";
        return (
          <span className="font-medium">
            {currency} {transaction.amount.toLocaleString()}
          </span>
        );
      case "category":
        return transaction.category?.name || "N/A";
      case "description":
        return (
          <span
            className="max-w-[200px] truncate"
            title={transaction.description}
          >
            {transaction.description}
          </span>
        );
      case "transactionDate":
        return format(new Date(transaction.transactionDate), "MMM dd, yyyy");
      case "status":
        return (
          <Badge
            variant={
              transaction.status === "COMPLETED" ||
              transaction.status === "APPROVED"
                ? "default"
                : transaction.status === "PENDING"
                  ? "secondary"
                  : "destructive"
            }
          >
            {transaction.status}
          </Badge>
        );
      case "actions":
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
      default:
        return null;
    }
  };

  return (
    <>
      <DashboardTableLayout
        title="Financial Transactions"
        description="Manage income and expense transactions"
        actions={
          <Button onClick={() => router.push("/finance/transactions/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        }
        searchPlaceholder="Search transactions..."
        searchValue={filters.search}
        onSearchChange={(value) =>
          setFilters({ ...filters, search: value, page: 1 })
        }
        filters={[
          {
            key: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "All types", value: "ALL" },
              { label: "Income", value: "INCOME" },
              { label: "Expense", value: "EXPENSE" },
            ],
          },
          {
            key: "categoryId",
            label: "Category",
            type: "select",
            options: [
              { label: "All categories", value: "0" },
              ...categories.map((category) => ({
                label: category.name,
                value: category.id.toString(),
              })),
            ],
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "All statuses", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Cancelled", value: "CANCELLED" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
            ],
          },
        ]}
        filterValues={filters}
        onFilterChange={(key, value) => {
          if (key === "categoryId") {
            setFilters({
              ...filters,
              categoryId: parseInt(value as string) || 0,
              page: 1,
            });
          } else {
            setFilters({ ...filters, [key]: value, page: 1 });
          }
        }}
        columns={columns}
        visibleColumns={columns.map((col) => col.key)}
        data={transactions}
        renderCell={renderCell}
        pagination={{
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(total / filters.limit),
          totalItems: total,
        }}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onPageSizeChange={(size) =>
          setFilters({ ...filters, limit: size, page: 1 })
        }
        isLoading={isLoading}
        totalCount={total}
        currentCount={transactions.length}
      />

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
    </>
  );
}
