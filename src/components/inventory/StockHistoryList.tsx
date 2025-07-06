"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconSearch,
  IconDownload,
  IconPackage,
  IconTrendingUp,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface StockHistoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  supplier?: {
    id: string;
    name: string;
  };
  purchaseDate: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  previousStock?: number;
  newStock?: number;
}

interface StockHistoryListProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function StockHistoryList({ user: _user }: StockHistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");

  const {
    data: stockHistory,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "stock-history",
      {
        search: searchTerm,
        sort: sortBy,
        order: sortOrder,
        supplier: supplierFilter,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortOrder,
        ...(supplierFilter !== "all" && { supplier: supplierFilter }),
      });

      const response = await fetch(`/api/stock-additions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stock history");
      }
      return response.json();
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }
      return response.json();
    },
  });

  const exportStockHistory = async () => {
    try {
      const response = await fetch("/api/stock-additions/export", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export stock history");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Stock history exported successfully");
    } catch (_error) {
      toast.error("Failed to export stock history");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Failed to load stock history. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPackage className="h-5 w-5" />
            Stock History
          </CardTitle>
          <CardDescription>
            Track all stock additions and purchases made to your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by product name, SKU, or reference number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers?.data?.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-");
                setSortBy(field);
                setSortOrder(order as "asc" | "desc");
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="product-asc">Product A-Z</SelectItem>
                <SelectItem value="product-desc">Product Z-A</SelectItem>
                <SelectItem value="quantity-desc">Highest Quantity</SelectItem>
                <SelectItem value="quantity-asc">Lowest Quantity</SelectItem>
                <SelectItem value="totalCost-desc">Highest Cost</SelectItem>
                <SelectItem value="totalCost-asc">Lowest Cost</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={exportStockHistory}
              variant="outline"
              className="gap-2"
            >
              <IconDownload className="h-4 w-4" />
              Export
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading stock history...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Previous Stock</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Cost per Unit</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Added By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockHistory?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-gray-500"
                      >
                        No stock history found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockHistory?.data?.map((item: StockHistoryItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(new Date(item.createdAt), "MMM dd, yyyy")}
                            </div>
                            <div className="text-gray-500">
                              {format(new Date(item.createdAt), "HH:mm")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.product.sku}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.previousStock || 0} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            <IconTrendingUp className="h-3 w-3 mr-1" />+
                            {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(item.previousStock || 0) + item.quantity} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.costPerUnit)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.totalCost)}
                        </TableCell>
                        <TableCell>
                          {item.supplier ? (
                            <Badge variant="outline">
                              {item.supplier.name}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.referenceNumber ? (
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {item.referenceNumber}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{item.createdBy.name}</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
