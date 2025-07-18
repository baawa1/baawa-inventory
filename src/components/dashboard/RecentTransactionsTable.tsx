"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconShoppingCart,
  IconSearch,
  IconArrowRight,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { useTransactions } from "@/hooks/api/transactions";

interface RecentTransactionsTableProps {
  limit?: number;
  showFilters?: boolean;
}

export function RecentTransactionsTable({
  limit = 10,
  showFilters = false,
}: RecentTransactionsTableProps) {
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const { data: transactionsData, isLoading } = useTransactions(
    {
      search,
      paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    },
    { page: 1, limit }
  );

  const transactions = transactionsData?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Cash
          </Badge>
        );
      case "pos":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            POS
          </Badge>
        );
      case "transfer":
        return (
          <Badge
            variant="outline"
            className="text-purple-600 border-purple-200"
          >
            Transfer
          </Badge>
        );
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <IconShoppingCart className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          View All
          <IconArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-12"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </TableCell>
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {transaction.transactionNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {transaction.customerName || "Walk-in"}
                        </p>
                        {transaction.customerPhone && (
                          <p className="text-sm text-muted-foreground">
                            {transaction.customerPhone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {transaction.items?.length || 0} items
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(transaction.paymentMethod)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.paymentStatus)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(transaction.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
