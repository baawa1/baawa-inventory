"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconEdit,
  IconUser,
  IconBuilding,
  IconCalendar,
  IconNotes,
  IconPackage,
  IconCurrency,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import type { PurchaseOrder } from "@/hooks/api/purchase-orders";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface PurchaseOrderDetailProps {
  purchaseOrder: PurchaseOrder;
  user: User;
}

export function PurchaseOrderDetail({
  purchaseOrder,
  user,
}: PurchaseOrderDetailProps) {
  const getStatusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "approved":
          return "bg-green-100 text-green-800";
        case "ordered":
          return "bg-blue-100 text-blue-800";
        case "shipped":
          return "bg-cyan-100 text-cyan-800";
        case "delivered":
          return "bg-emerald-100 text-emerald-800";
        case "cancelled":
          return "bg-red-100 text-red-800";
        case "draft":
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <Badge className={getStatusColor(status)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canEdit = ["ADMIN", "MANAGER"].includes(user.role);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 px-4 lg:px-6">
          <Link href="/inventory/purchase-orders">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchase Orders
          </Link>
        </Button>
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">
              Purchase Order #{purchaseOrder.orderNumber}
            </h1>
            <p className="text-muted-foreground">
              Created on{" "}
              {format(
                new Date(purchaseOrder.createdAt),
                "MMM dd, yyyy 'at' HH:mm"
              )}
            </p>
            {getStatusBadge(purchaseOrder.status)}
          </div>
          <div>
            {canEdit && (
              <Button asChild>
                <Link
                  href={`/inventory/purchase-orders/${purchaseOrder.id}/edit`}
                >
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit Order
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Order Items Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPackage className="h-5 w-5" />
            Order Items
          </CardTitle>
          <CardDescription>
            Products and quantities in this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchaseOrder.purchaseOrderItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">
                    {item.products?.name ||
                      item.productVariants?.name ||
                      "Unknown Product"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    SKU:{" "}
                    {item.products?.sku || item.productVariants?.sku || "N/A"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>Quantity: {item.quantityOrdered}</span>
                    {item.quantityReceived !== undefined && (
                      <span>Received: {item.quantityReceived}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(parseFloat(item.unitCost))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(parseFloat(item.totalCost))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      {purchaseOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconNotes className="h-5 w-5" />
              Notes
            </CardTitle>
            <CardDescription>
              Additional information about this purchase order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">
                {purchaseOrder.notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCurrency className="h-5 w-5" />
            Order Summary
          </CardTitle>
          <CardDescription>
            Financial breakdown of the purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(parseFloat(purchaseOrder.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrency(parseFloat(purchaseOrder.taxAmount))}</span>
            </div>
            {purchaseOrder.shippingCost && (
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>
                  {formatCurrency(parseFloat(purchaseOrder.shippingCost))}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>
                {formatCurrency(parseFloat(purchaseOrder.totalAmount))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBuilding className="h-5 w-5" />
            Supplier Information
          </CardTitle>
          <CardDescription>
            Details about the supplier for this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg space-y-3">
            <div>
              <h4 className="font-medium">{purchaseOrder.suppliers?.name}</h4>
              {purchaseOrder.suppliers?.email && (
                <p className="text-sm text-muted-foreground">
                  Email: {purchaseOrder.suppliers.email}
                </p>
              )}
              {purchaseOrder.suppliers?.phone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {purchaseOrder.suppliers.phone}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Order Information
          </CardTitle>
          <CardDescription>
            Key dates and timeline for this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">
                {format(new Date(purchaseOrder.orderDate), "MMM dd, yyyy")}
              </p>
            </div>
            {purchaseOrder.expectedDeliveryDate && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Expected Delivery
                </p>
                <p className="font-medium">
                  {format(
                    new Date(purchaseOrder.expectedDeliveryDate),
                    "MMM dd, yyyy"
                  )}
                </p>
              </div>
            )}
            {purchaseOrder.actualDeliveryDate && (
              <div>
                <p className="text-sm text-muted-foreground">Actual Delivery</p>
                <p className="font-medium">
                  {format(
                    new Date(purchaseOrder.actualDeliveryDate),
                    "MMM dd, yyyy"
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Created By Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            Created By
          </CardTitle>
          <CardDescription>
            User who created this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <div>
                <p className="font-medium">
                  {purchaseOrder.users?.firstName &&
                  purchaseOrder.users?.lastName
                    ? `${purchaseOrder.users.firstName} ${purchaseOrder.users.lastName}`
                    : purchaseOrder.users?.firstName ||
                      purchaseOrder.users?.lastName ||
                      "Unknown User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {purchaseOrder.users?.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {purchaseOrder.users?.role
                    ? purchaseOrder.users.role.charAt(0).toUpperCase() +
                      purchaseOrder.users.role.slice(1).toLowerCase()
                    : "Unknown Role"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
