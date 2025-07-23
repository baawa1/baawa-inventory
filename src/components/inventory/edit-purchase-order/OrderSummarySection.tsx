import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { PurchaseOrderStatusBadge } from "@/components/inventory/PurchaseOrderStatusBadge";
import { format } from "date-fns";
import { IconCurrency, IconBuilding, IconCalendar } from "@tabler/icons-react";
import { PurchaseOrder } from "@/hooks/api/purchase-orders";

interface OrderSummarySectionProps {
  purchaseOrder: PurchaseOrder;
}

export function OrderSummarySection({
  purchaseOrder,
}: OrderSummarySectionProps) {
  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "Not specified";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return format(date, "MMM dd, yyyy");
    } catch (_error) {
      return "Invalid date";
    }
  };

  // Helper function to safely parse and format currency
  const formatCurrencySafely = (
    amount: string | number | undefined | null
  ): string => {
    if (amount === undefined || amount === null || amount === "") {
      return formatCurrency(0);
    }

    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return formatCurrency(0);
    }

    return formatCurrency(numAmount);
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
            <span>{formatCurrencySafely(purchaseOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrencySafely(purchaseOrder.taxAmount)}</span>
          </div>
          {purchaseOrder.shippingCost && (
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{formatCurrencySafely(purchaseOrder.shippingCost)}</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrencySafely(purchaseOrder.totalAmount)}</span>
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
          {purchaseOrder.suppliers ? (
            <div>
              <h4 className="font-medium">{purchaseOrder.suppliers.name}</h4>
              {purchaseOrder.suppliers.email && (
                <p className="text-sm text-muted-foreground">
                  Email: {purchaseOrder.suppliers.email}
                </p>
              )}
              {purchaseOrder.suppliers.phone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {purchaseOrder.suppliers.phone}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No supplier information available
            </p>
          )}
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
            <p className="font-medium">#{purchaseOrder.orderNumber || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Date</p>
            <p className="font-medium">{formatDate(purchaseOrder.orderDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">
              {purchaseOrder.status ? (
                <PurchaseOrderStatusBadge status={purchaseOrder.status} />
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created By</p>
            <p className="font-medium">
              {purchaseOrder.users
                ? `${purchaseOrder.users.firstName} ${purchaseOrder.users.lastName}`
                : "Unknown"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
