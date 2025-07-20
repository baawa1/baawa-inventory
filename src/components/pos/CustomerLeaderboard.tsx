"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconSearch,
  IconEye,
  IconTrophy,
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconCurrencyNaira,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  averageOrderValue: number;
  rank: number;
}

interface CustomerPurchase {
  id: number;
  transactionNumber: string;
  totalAmount: number;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface CustomerLeaderboardProps {
  user: {
    id: string;
    role: string;
  };
}

async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch("/api/pos/customers");
  if (!response.ok) {
    throw new Error("Failed to fetch customers");
  }
  return response.json();
}

async function fetchCustomerPurchases(
  customerEmail: string
): Promise<CustomerPurchase[]> {
  const response = await fetch(
    `/api/pos/customers/${encodeURIComponent(customerEmail)}/purchases`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch customer purchases");
  }
  return response.json();
}

export function CustomerLeaderboard({ user: _ }: CustomerLeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "totalSpent" | "totalOrders" | "lastPurchase"
  >("totalSpent");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const { data: customerPurchases = [], isLoading: purchasesLoading } =
    useQuery({
      queryKey: ["customer-purchases", selectedCustomer?.email],
      queryFn: () => fetchCustomerPurchases(selectedCustomer!.email),
      enabled: !!selectedCustomer,
    });

  const filteredCustomers = customers
    .filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "totalSpent":
          return b.totalSpent - a.totalSpent;
        case "totalOrders":
          return b.totalOrders - a.totalOrders;
        case "lastPurchase":
          return (
            new Date(b.lastPurchase).getTime() -
            new Date(a.lastPurchase).getTime()
          );
        default:
          return 0;
      }
    });

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <Badge className="bg-yellow-500 text-white">
          <IconTrophy className="w-3 h-3 mr-1" />
          Champion
        </Badge>
      );
    if (rank <= 3)
      return <Badge className="bg-gray-400 text-white">Top 3</Badge>;
    if (rank <= 10)
      return <Badge className="bg-blue-500 text-white">Top 10</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  if (error) {
    toast.error("Failed to load customer data");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Leaderboard</h1>
          <p className="text-muted-foreground">
            Track your top customers and their purchase history
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Customer Spent
            </CardTitle>
            <IconCurrencyNaira className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0
                ? formatCurrency(
                    Math.max(...customers.map((c) => c.totalSpent))
                  )
                : "₦0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <IconCurrencyNaira className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0
                ? formatCurrency(
                    customers.reduce((sum, c) => sum + c.averageOrderValue, 0) /
                      customers.length
                  )
                : "₦0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSpent">Total Spent</SelectItem>
                <SelectItem value="totalOrders">Total Orders</SelectItem>
                <SelectItem value="lastPurchase">Last Purchase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Avg Order Value</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell>{getRankBadge(index + 1)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <IconMail className="w-3 h-3 mr-1" />
                          {customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center text-sm">
                          <IconPhone className="w-3 h-3 mr-1" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No phone</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>
                      {formatCurrency(customer.averageOrderValue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <IconCalendar className="w-3 h-3 mr-1" />
                        {new Date(customer.lastPurchase).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <IconEye className="w-4 h-4 mr-1" />
                            View Purchases
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Purchase History - {customer.name}
                            </DialogTitle>
                            <DialogDescription>
                              Complete purchase history for this customer
                            </DialogDescription>
                          </DialogHeader>

                          {purchasesLoading ? (
                            <div className="flex justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {customerPurchases.map((purchase) => (
                                <Card key={purchase.id}>
                                  <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <CardTitle className="text-lg">
                                          Transaction #
                                          {purchase.transactionNumber}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(
                                            purchase.createdAt
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold">
                                          {formatCurrency(purchase.totalAmount)}
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Product</TableHead>
                                          <TableHead>Quantity</TableHead>
                                          <TableHead>Unit Price</TableHead>
                                          <TableHead>Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {purchase.items.map(
                                          (item, itemIndex) => (
                                            <TableRow key={itemIndex}>
                                              <TableCell>
                                                {item.productName}
                                              </TableCell>
                                              <TableCell>
                                                {item.quantity}
                                              </TableCell>
                                              <TableCell>
                                                {formatCurrency(item.unitPrice)}
                                              </TableCell>
                                              <TableCell>
                                                {formatCurrency(
                                                  item.totalPrice
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </CardContent>
                                </Card>
                              ))}

                              {customerPurchases.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  No purchases found for this customer.
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredCustomers.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No customers found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
