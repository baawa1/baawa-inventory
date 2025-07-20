"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconCurrencyNaira,
  IconShoppingBag,
  IconEye,
  IconPrinter,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
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

interface User {
  id: string;
  role: string;
  status: string;
}

interface CustomerDetailViewProps {
  customer: CustomerData;
  user: User;
}

// API function to fetch customer purchases
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

// API function to reprint receipt
async function reprintReceipt(transactionId: number): Promise<void> {
  const response = await fetch(`/api/pos/receipts/${transactionId}/reprint`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to reprint receipt");
  }
}

export function CustomerDetailView({
  customer,
  user: _user,
}: CustomerDetailViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<CustomerPurchase | null>(
    null
  );
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  const {
    data: purchases = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-purchases", customer.email],
    queryFn: () => fetchCustomerPurchases(customer.email),
  });

  const reprintMutation = useMutation({
    mutationFn: reprintReceipt,
    onSuccess: () => {
      toast.success("Receipt sent to printer");
    },
    onError: () => {
      toast.error("Failed to reprint receipt");
    },
  });

  const handleViewOrder = (order: CustomerPurchase) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const handleReprintReceipt = (transactionId: number) => {
    reprintMutation.mutate(transactionId);
  };

  if (error) {
    toast.error("Failed to load customer purchases");
  }

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="font-medium">{customer.name}</p>
              </div>
              {customer.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <IconMail className="h-4 w-4" />
                    <p>{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4" />
                    <p>{customer.phone}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Customer Rank
                </label>
                <div>
                  <Badge variant="outline" className="text-lg font-bold">
                    #{customer.rank}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Purchase
                </label>
                <div className="flex items-center gap-2">
                  <IconCalendar className="h-4 w-4" />
                  <p>{format(new Date(customer.lastPurchase), "PPP")}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <IconCurrencyNaira className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(customer.totalSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IconShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <p className="text-2xl font-bold">{customer.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IconCurrencyNaira className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Order
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(customer.averageOrderValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History ({purchases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading orders...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8">
              <IconShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono">
                      {purchase.transactionNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconCalendar className="h-3 w-3" />
                        {format(
                          new Date(purchase.createdAt),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{purchase.items.length}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(purchase.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Dialog
                          open={
                            orderDetailOpen && selectedOrder?.id === purchase.id
                          }
                          onOpenChange={(open) => {
                            setOrderDetailOpen(open);
                            if (!open) setSelectedOrder(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(purchase)}
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <OrderDetailContent order={selectedOrder} />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprintReceipt(purchase.id)}
                          disabled={reprintMutation.isPending}
                        >
                          <IconPrinter className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Order Detail Component (reusing transaction detail logic)
function OrderDetailContent({ order }: { order: CustomerPurchase }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Transaction #
          </label>
          <p className="font-mono">{order.transactionNumber}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Date
          </label>
          <p>{format(new Date(order.createdAt), "PPP p")}</p>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-3">Items Purchased</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {item.productName}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.totalPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Separator />

      <div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
