"use client";

import React, { useState, useMemo, useCallback } from "react";
import { DashboardTableLayout } from "@/components/layouts/DashboardTableLayout";
import { DashboardTableColumn } from "@/components/layouts/DashboardColumnCustomizer";
import { FilterConfig } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconEye,
  IconReceipt,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconCalendar,
  IconUser,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useTransactions,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  type Transaction,
  type TransactionPagination,
} from "@/hooks/api/transactions";
import { PAYMENT_METHODS, TRANSACTION_STATUS, CURRENCY } from "@/lib/constants";
import { TransactionDataOverview } from "./TransactionDataOverview";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface TransactionListProps {
  user: User;
}

interface TransactionFilters {
  search: string;
  paymentMethod: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  staffId: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "total-desc", label: "Total (High to Low)" },
  { value: "total-asc", label: "Total (Low to High)" },
  { value: "transactionNumber-asc", label: "Transaction # (A-Z)" },
  { value: "transactionNumber-desc", label: "Transaction # (Z-A)" },
];

export function TransactionList({ user }: TransactionListProps) {
  const [pagination, setPagination] = useState<TransactionPagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    paymentMethod: "",
    paymentStatus: "",
    dateFrom: "",
    dateTo: "",
    staffId: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Dialog states
  const [transactionDetailModalOpen, setTransactionDetailModalOpen] =
    useState(false);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] =
    useState<Transaction | null>(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const transactionsQuery = useTransactions(
    {
      search: debouncedSearchTerm,
      paymentMethod: filters.paymentMethod,
      paymentStatus: filters.paymentStatus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      staffId: filters.staffId,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  // Extract data from queries
  const transactions = transactionsQuery.data?.data || [];

  const canViewTransactions = ["ADMIN", "MANAGER", "STAFF"].includes(user.role);

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: "transactionNumber",
        label: "Transaction #",
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: "total",
        label: "Total",
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: "paymentMethod",
        label: "Payment Method",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "paymentStatus",
        label: "Status",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "customerName",
        label: "Customer",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "staffName",
        label: "Staff",
        sortable: true,
        defaultVisible: true,
      },
      {
        key: "items",
        label: "Items",
        sortable: false,
        defaultVisible: true,
      },
      {
        key: "createdAt",
        label: "Date",
        sortable: true,
        defaultVisible: true,
      },
    ],
    []
  );

  // Initialize visibleColumns with default values
  const defaultVisibleColumns = useMemo(
    () => columns.filter((col) => col.defaultVisible).map((col) => col.key),
    [columns]
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "paymentMethod",
        label: "Payment Method",
        type: "select",
        options: [
          { value: PAYMENT_METHODS.CASH, label: "Cash" },
          { value: PAYMENT_METHODS.POS, label: "POS Machine" },
          { value: PAYMENT_METHODS.BANK_TRANSFER, label: "Bank Transfer" },
          { value: PAYMENT_METHODS.MOBILE_MONEY, label: "Mobile Money" },
        ],
        placeholder: "All Payment Methods",
      },
      {
        key: "paymentStatus",
        label: "Status",
        type: "select",
        options: [
          { value: TRANSACTION_STATUS.PENDING, label: "Pending" },
          { value: TRANSACTION_STATUS.COMPLETED, label: "Completed" },
          { value: TRANSACTION_STATUS.CANCELLED, label: "Cancelled" },
          { value: TRANSACTION_STATUS.REFUNDED, label: "Refunded" },
        ],
        placeholder: "All Status",
      },
      {
        key: "dateFrom",
        label: "From Date",
        type: "date",
        placeholder: "Start date",
      },
      {
        key: "dateTo",
        label: "To Date",
        type: "date",
        placeholder: "End date",
      },
    ],
    []
  );

  // Render cell function
  const renderCell = useCallback(
    (transaction: Transaction, columnKey: string) => {
      switch (columnKey) {
        case "transactionNumber":
          return (
            <span className="font-mono font-medium text-sm">
              {transaction.transactionNumber}
            </span>
          );
        case "total":
          return (
            <span className="font-semibold">
              {CURRENCY.SYMBOL}
              {Number(transaction.total).toLocaleString()}
            </span>
          );
        case "paymentMethod":
          return (
            <div className="flex items-center gap-2">
              {getPaymentMethodIcon(transaction.paymentMethod)}
              <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
            </div>
          );
        case "paymentStatus":
          return (
            <Badge className={getPaymentStatusColor(transaction.paymentStatus)}>
              {getPaymentStatusLabel(transaction.paymentStatus)}
            </Badge>
          );
        case "customerName":
          return (
            <div>
              {transaction.customerName ? (
                <div>
                  <div className="font-medium">{transaction.customerName}</div>
                  {transaction.customerPhone && (
                    <div className="text-sm text-muted-foreground">
                      {transaction.customerPhone}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  Walk-in customer
                </span>
              )}
            </div>
          );
        case "staffName":
          return (
            <div className="flex items-center gap-2">
              <IconUser className="h-4 w-4 text-muted-foreground" />
              <span>{transaction.staffName}</span>
            </div>
          );
        case "items":
          return (
            <span className="text-sm">
              {transaction.items.length} item
              {transaction.items.length !== 1 ? "s" : ""}
            </span>
          );
        case "createdAt":
          return (
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
          );
        default:
          return null;
      }
    },
    []
  );

  // Render actions
  const renderActions = useCallback(
    (transaction: Transaction) => (
      <div className="flex items-center gap-2">
        <Dialog
          open={
            transactionDetailModalOpen &&
            selectedTransactionForDetail?.id === transaction.id
          }
          onOpenChange={(open) => {
            setTransactionDetailModalOpen(open);
            if (!open) setSelectedTransactionForDetail(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTransactionForDetail(transaction)}
            >
              <IconEye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            {selectedTransactionForDetail && (
              <TransactionDetailContent
                transaction={selectedTransactionForDetail}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    ),
    [transactionDetailModalOpen, selectedTransactionForDetail]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    }));
  }, []);

  // Handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination((prev) => ({ ...prev, limit: size, page: 1 }));
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      paymentMethod: "",
      paymentStatus: "",
      dateFrom: "",
      dateTo: "",
      staffId: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  if (!canViewTransactions) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          You don't have permission to view transactions.
        </p>
      </div>
    );
  }

  return (
    <>
      <TransactionDataOverview
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
      />
      <DashboardTableLayout
        title="Transaction History"
        description="View and manage all sales transactions"
        searchPlaceholder="Search transactions, customers, or transaction numbers..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange("search", value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        sortOptions={SORT_OPTIONS}
        currentSort={`${filters.sortBy}-${filters.sortOrder}`}
        onSortChange={handleSortChange}
        columns={columns}
        visibleColumns={
          visibleColumns.length > 0 ? visibleColumns : defaultVisibleColumns
        }
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="transaction-columns"
        data={transactions}
        renderCell={renderCell}
        renderActions={renderActions}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          totalPages: transactionsQuery.data?.pagination?.totalPages || 1,
          totalItems: transactionsQuery.data?.pagination?.total || 0,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={transactionsQuery.isLoading}
        isRefetching={transactionsQuery.isRefetching}
        error={transactionsQuery.error?.message}
        onRetry={() => transactionsQuery.refetch()}
        emptyStateIcon={<IconReceipt className="h-8 w-8" />}
        emptyStateMessage="No transactions found"
        tableTitle="Transaction Results"
        totalCount={transactionsQuery.data?.pagination?.total || 0}
        currentCount={transactions.length}
      />
    </>
  );
}

// Helper function to get payment method icon
function getPaymentMethodIcon(method: string) {
  switch (method) {
    case PAYMENT_METHODS.CASH:
      return <IconCash className="h-4 w-4" />;
    case PAYMENT_METHODS.POS:
      return <IconCreditCard className="h-4 w-4" />;
    case PAYMENT_METHODS.BANK_TRANSFER:
      return <IconBuildingBank className="h-4 w-4" />;
    case PAYMENT_METHODS.MOBILE_MONEY:
      return <IconDeviceMobile className="h-4 w-4" />;
    default:
      return <IconCash className="h-4 w-4" />;
  }
}

// Transaction detail component
function TransactionDetailContent({
  transaction,
}: {
  transaction: Transaction;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Transaction #
          </label>
          <p className="font-mono">{transaction.transactionNumber}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Date
          </label>
          <p>{format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Payment Method
          </label>
          <p>{getPaymentMethodLabel(transaction.paymentMethod)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Status
          </label>
          <Badge className={getPaymentStatusColor(transaction.paymentStatus)}>
            {getPaymentStatusLabel(transaction.paymentStatus)}
          </Badge>
        </div>
      </div>

      {transaction.customerName && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Customer
          </label>
          <p>{transaction.customerName}</p>
          {transaction.customerPhone && (
            <p className="text-sm text-muted-foreground">
              {transaction.customerPhone}
            </p>
          )}
          {transaction.customerEmail && (
            <p className="text-sm text-muted-foreground">
              {transaction.customerEmail}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Items
        </label>
        <div className="mt-2 space-y-2">
          {transaction.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {CURRENCY.SYMBOL}
                  {item.price.toLocaleString()} × {item.quantity}
                </p>
                <p className="text-sm text-muted-foreground">
                  {CURRENCY.SYMBOL}
                  {item.total.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>
            {CURRENCY.SYMBOL}
            {Number(transaction.subtotal).toLocaleString()}
          </span>
        </div>
        {transaction.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>
              -{CURRENCY.SYMBOL}
              {Number(transaction.discount).toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>
            {CURRENCY.SYMBOL}
            {Number(transaction.total).toLocaleString()}
          </span>
        </div>
      </div>

      {transaction.notes && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Notes
          </label>
          <p className="text-sm">{transaction.notes}</p>
        </div>
      )}
    </div>
  );
}
