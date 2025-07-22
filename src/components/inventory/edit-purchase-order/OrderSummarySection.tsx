import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { IconCurrency, IconBuilding, IconCalendar } from "@tabler/icons-react";
import { PurchaseOrder } from "./types";

interface OrderSummarySectionProps {
  purchaseOrder: PurchaseOrder;
}

export function OrderSummarySection({
  purchaseOrder,
}: OrderSummarySectionProps) {
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

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCurrency className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>
                {formatCurrency(parseFloat(purchaseOrder.totalAmount))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBuilding className="h-5 w-5" />
            Supplier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      {/* Order Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Order Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-medium">#{purchaseOrder.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Date</p>
            <p className="font-medium">
              {format(new Date(purchaseOrder.orderDate), "MMM dd, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">{getStatusBadge(purchaseOrder.status)}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created By</p>
            <p className="font-medium">
              {purchaseOrder.users?.firstName} {purchaseOrder.users?.lastName}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
