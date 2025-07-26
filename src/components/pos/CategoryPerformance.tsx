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

interface CategoryPerformanceProps {
  user: User;
}

interface CategoryPerformanceData {
  id: string;
  name: string;
  itemsSold: number;
  netSales: number;
  products: number;
  orders: number;
  previousItemsSold: number;
  previousNetSales: number;
  previousProducts: number;
  previousOrders: number;
}

export function CategoryPerformance({ user: _ }: CategoryPerformanceProps) {
  const [dateRange, setDateRange] = useState("month-to-date");
  const [showFilter, setShowFilter] = useState("all-categories");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with actual API calls
  const mockData: CategoryPerformanceData[] = [
    {
      id: "1",
      name: "Wristwatches",
      itemsSold: 4,
      netSales: 247000,
      products: 2,
      orders: 4,
      previousItemsSold: 25,
      previousNetSales: 300000,
      previousProducts: 3,
      previousOrders: 3,
    },
    {
      id: "2",
      name: "Wristwatches > Chain",
      itemsSold: 2,
      netSales: 209000,
      products: 1,
      orders: 2,
      previousItemsSold: 15,
      previousNetSales: 200000,
      previousProducts: 2,
      previousOrders: 2,
    },
  ];

  const filteredData = useMemo(() => {
    return mockData.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mockData, searchTerm]);

  const summaryStats = useMemo(() => {
    const total = filteredData.reduce(
      (acc, category) => ({
        itemsSold: acc.itemsSold + category.itemsSold,
        netSales: acc.netSales + category.netSales,
        products: acc.products + category.products,
        orders: acc.orders + category.orders,
        previousItemsSold: acc.previousItemsSold + category.previousItemsSold,
        previousNetSales: acc.previousNetSales + category.previousNetSales,
        previousProducts: acc.previousProducts + category.previousProducts,
        previousOrders: acc.previousOrders + category.previousOrders,
      }),
      {
        itemsSold: 0,
        netSales: 0,
        products: 0,
        orders: 0,
        previousItemsSold: 0,
        previousNetSales: 0,
        previousProducts: 0,
        previousOrders: 0,
      }
    );

    return {
      itemsSold: total.itemsSold,
      netSales: total.netSales,
      products: total.products,
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
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
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
              <SelectItem value="all-categories">All categories</SelectItem>
              <SelectItem value="top-performing">Top performing</SelectItem>
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

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Compare
              </Button>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search categories..."
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
                <TableHead>Category</TableHead>
                <TableHead>Items sold</TableHead>
                <TableHead>Net sales</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.itemsSold}</TableCell>
                  <TableCell>{formatCurrency(category.netSales)}</TableCell>
                  <TableCell>{category.products}</TableCell>
                  <TableCell>{category.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-sm text-muted-foreground">
            {filteredData.length} Categories {summaryStats.itemsSold} Items sold{" "}
            {formatCurrency(summaryStats.netSales)} Net sales{" "}
            {summaryStats.orders} Orders
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
