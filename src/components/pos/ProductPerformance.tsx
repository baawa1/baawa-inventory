"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  IconSearch,
  IconDownload,
  IconDots,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface ProductPerformanceProps {
  user: User;
}

interface ProductPerformanceData {
  id: string;
  name: string;
  sku: string;
  category: string;
  itemsSold: number;
  netSales: number;
  orders: number;
  previousItemsSold: number;
  previousNetSales: number;
  previousOrders: number;
}

export function ProductPerformance({ user: _ }: ProductPerformanceProps) {
  const [dateRange, setDateRange] = useState("month-to-date");
  const [showFilter, setShowFilter] = useState("all-products");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with actual API calls
  const mockData: ProductPerformanceData[] = [
    {
      id: "1",
      name: "Patek Philippe PP8011G Gold Mens Watch",
      sku: "PP8011G",
      category: "Wristwatches > Chain",
      itemsSold: 2,
      netSales: 209000,
      orders: 2,
      previousItemsSold: 3,
      previousNetSales: 250000,
      previousOrders: 3,
    },
    {
      id: "2",
      name: "Fusili G0375 Rubber watch",
      sku: "G0375",
      category: "Wristwatches",
      itemsSold: 2,
      netSales: 38000,
      orders: 2,
      previousItemsSold: 4,
      previousNetSales: 45000,
      previousOrders: 4,
    },
  ];

  const filteredData = useMemo(() => {
    return mockData.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mockData, searchTerm]);

  const summaryStats = useMemo(() => {
    const total = filteredData.reduce(
      (acc, product) => ({
        itemsSold: acc.itemsSold + product.itemsSold,
        netSales: acc.netSales + product.netSales,
        orders: acc.orders + product.orders,
        previousItemsSold: acc.previousItemsSold + product.previousItemsSold,
        previousNetSales: acc.previousNetSales + product.previousNetSales,
        previousOrders: acc.previousOrders + product.previousOrders,
      }),
      {
        itemsSold: 0,
        netSales: 0,
        orders: 0,
        previousItemsSold: 0,
        previousNetSales: 0,
        previousOrders: 0,
      }
    );

    return {
      itemsSold: total.itemsSold,
      netSales: total.netSales,
      orders: total.orders,
      itemsSoldChange:
        total.previousItemsSold > 0
          ? ((total.itemsSold - total.previousItemsSold) /
              total.previousItemsSold) *
            100
          : 0,
      netSalesChange:
        total.previousNetSales > 0
          ? ((total.netSales - total.previousNetSales) /
              total.previousNetSales) *
            100
          : 0,
      ordersChange:
        total.previousOrders > 0
          ? ((total.orders - total.previousOrders) / total.previousOrders) * 100
          : 0,
    };
  }, [filteredData]);

  const getChangeBadge = (change: number) => {
    if (change > 0) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <IconTrendingUp className="h-3 w-3 mr-1" />+{change.toFixed(0)}%
        </Badge>
      );
    } else if (change < 0) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <IconTrendingDown className="h-3 w-3 mr-1" />
          {change.toFixed(0)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <IconMinus className="h-3 w-3 mr-1" />
          0%
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week-to-date">Week to date</SelectItem>
              <SelectItem value="month-to-date">
                Month to date (Jul 1 - 26, 2025) vs. Previous year (Jul 1 - 26,
                2024)
              </SelectItem>
              <SelectItem value="quarter-to-date">Quarter to date</SelectItem>
              <SelectItem value="year-to-date">Year to date</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={showFilter} onValueChange={setShowFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-products">All products</SelectItem>
              <SelectItem value="top-selling">Top selling</SelectItem>
              <SelectItem value="low-performing">Low performing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.itemsSold}</div>
            <div className="flex items-center mt-2">
              {getChangeBadge(summaryStats.itemsSoldChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.netSales)}
            </div>
            <div className="flex items-center mt-2">
              {getChangeBadge(summaryStats.netSalesChange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.orders}</div>
            <div className="flex items-center mt-2">
              {getChangeBadge(summaryStats.ordersChange)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Compare
              </Button>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <IconDownload className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <IconDots className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product title</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Items sold</TableHead>
                <TableHead>Net sales</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.itemsSold}</TableCell>
                  <TableCell>{formatCurrency(product.netSales)}</TableCell>
                  <TableCell>{product.orders}</TableCell>
                  <TableCell>{product.category}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-sm text-muted-foreground">
            {filteredData.length} Products {summaryStats.itemsSold} Items sold{" "}
            {formatCurrency(summaryStats.netSales)} Net sales{" "}
            {summaryStats.orders} Orders
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
