/**
 * Transaction History Component
 * Displays both online and offline transactions with comprehensive filtering and management
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  IconSearch,
  IconFilter,
  IconEye,
  IconDownload,
  IconRefresh,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceMobile,
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { offlineStorage } from "@/lib/utils/offline-storage";
import { useOffline } from "@/hooks/useOffline";
import { usePOSErrorHandler } from "./POSErrorBoundary";
import { formatCurrency } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface TransactionItem {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
}

interface Transaction {
  id: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "pos" | "bank_transfer" | "mobile_money";
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffName: string;
  staffId?: number;
  timestamp: Date;
  status?: "pending" | "synced" | "failed";
  syncAttempts?: number;
  errorMessage?: string;
  isOffline?: boolean;
}

interface TransactionFilters {
  search: string;
  paymentMethod: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  staffName: string;
}

const paymentMethodIcons = {
  cash: IconCash,
  pos: IconCreditCard,
  bank_transfer: IconBuildingBank,
  mobile_money: IconDeviceMobile,
};

const paymentMethodLabels = {
  cash: "Cash",
  pos: "POS Machine",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  synced: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const statusIcons = {
  pending: IconClock,
  synced: IconCheck,
  failed: IconX,
};

export function TransactionHistory() {
  const { data: session } = useSession();
  const { isOnline, syncNow } = useOffline();
  const { handleError } = usePOSErrorHandler();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    paymentMethod: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
    staffName: "all",
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/pos/transactions");
      if (!response.ok) {
        throw new Error("Failed to load transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter((transaction) => {
    const searchMatch =
      !filters.search ||
      transaction.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.customerName
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      transaction.staffName
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    const paymentMethodMatch =
      filters.paymentMethod === "all" ||
      transaction.paymentMethod === filters.paymentMethod;

    const statusMatch =
      filters.status === "all" || transaction.status === filters.status;

    const dateFromMatch =
      !filters.dateFrom || transaction.timestamp >= new Date(filters.dateFrom);

    const dateToMatch =
      !filters.dateTo ||
      transaction.timestamp <= new Date(filters.dateTo + "T23:59:59");

    const staffMatch =
      filters.staffName === "all" ||
      transaction.staffName === filters.staffName;

    return (
      searchMatch &&
      paymentMethodMatch &&
      statusMatch &&
      dateFromMatch &&
      dateToMatch &&
      staffMatch
    );
  });

  // Get unique staff names for filter
  const uniqueStaffNames = [...new Set(transactions.map((t) => t.staffName))];

  // Handle sync retry for failed transactions
  const handleSyncRetry = async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline");
      return;
    }

    try {
      const result = await syncNow();
      toast.success(
        `Sync completed: ${result.success} successful, ${result.failed} failed`
      );
      loadTransactions(); // Reload to get updated status
    } catch (error) {
      toast.error("Sync failed");
      handleError(error instanceof Error ? error : new Error("Sync failed"));
    }
  };

  // Export transactions to CSV
  const exportTransactions = () => {
    const csvData = filteredTransactions.map((t) => ({
      "Transaction ID": t.id,
      Date: format(t.timestamp, "yyyy-MM-dd HH:mm:ss"),
      Staff: t.staffName,
      Customer: t.customerName || "",
      Items: t.items.length,
      Subtotal: t.subtotal,
      Discount: t.discount,
      Total: t.total,
      "Payment Method": paymentMethodLabels[t.paymentMethod],
      Status: t.status || "synced",
      Source: t.isOffline ? "Offline" : "Online",
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const TransactionDetailsDialog = ({
    transaction,
  }: {
    transaction: Transaction;
  }) => {
    const PaymentIcon = paymentMethodIcons[transaction.paymentMethod];
    const StatusIcon = statusIcons[transaction.status || "synced"];

    return (
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Transaction ID
              </label>
              <p className="font-mono">{transaction.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Date & Time
              </label>
              <p>{format(transaction.timestamp, "PPP p")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Staff Member
              </label>
              <p>{transaction.staffName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[transaction.status || "synced"]}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {transaction.status || "synced"}
                </Badge>
                {transaction.isOffline && (
                  <Badge variant="outline">Offline</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {(transaction.customerName ||
            transaction.customerPhone ||
            transaction.customerEmail) && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 gap-2">
                  {transaction.customerName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Name
                      </label>
                      <p>{transaction.customerName}</p>
                    </div>
                  )}
                  {transaction.customerPhone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Phone
                      </label>
                      <p>{transaction.customerPhone}</p>
                    </div>
                  )}
                  {transaction.customerEmail && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <p>{transaction.customerEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Items */}
          <Separator />
          <div>
            <h3 className="font-medium mb-3">Items Purchased</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Payment Summary */}
          <Separator />
          <div>
            <h3 className="font-medium mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <PaymentIcon className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  Paid via{" "}
                  {paymentMethodLabels[transaction.paymentMethod] || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message for Failed Transactions */}
          {transaction.status === "failed" && transaction.errorMessage && (
            <>
              <Separator />
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <IconAlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Sync Error</span>
                </div>
                <p className="text-sm text-red-700">
                  {transaction.errorMessage}
                </p>
                {transaction.syncAttempts && (
                  <p className="text-xs text-red-600 mt-1">
                    Sync attempts: {transaction.syncAttempts}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    );
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            View and manage sales transactions from both online and offline
            sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadTransactions}
            disabled={loading}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {!isOnline && (
            <Button variant="outline" onClick={handleSyncRetry}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          )}
          <Button variant="outline" onClick={exportTransactions}>
            <IconDownload className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <IconSearch className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-10"
              />
            </div>

            <Select
              value={filters.paymentMethod}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="pos">POS Machine</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
              }
            />

            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
              }
            />

            <Select
              value={filters.staffName}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, staffName: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Staff Member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {uniqueStaffNames.map((staff) => (
                  <SelectItem key={staff} value={staff}>
                    {staff}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                Loading transactions...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const PaymentIcon =
                    paymentMethodIcons[transaction.paymentMethod] || IconCash;
                  const StatusIcon =
                    statusIcons[transaction.status || "synced"] || IconCheck;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        {format(transaction.timestamp, "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{transaction.staffName}</TableCell>
                      <TableCell>{transaction.customerName || "-"}</TableCell>
                      <TableCell>{transaction.items.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentIcon className="h-4 w-4" />
                          <span className="text-sm">
                            {paymentMethodLabels[transaction.paymentMethod] ||
                              "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              statusColors[transaction.status || "synced"]
                            }
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {transaction.status || "synced"}
                          </Badge>
                          {transaction.isOffline && (
                            <Badge variant="outline" className="text-xs">
                              Offline
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedTransaction(transaction)
                              }
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {selectedTransaction && (
                            <TransactionDetailsDialog
                              transaction={selectedTransaction}
                            />
                          )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
