"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconX,
  IconBuilding,
  IconCalendar,
  IconCurrency,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { useUpdatePurchaseOrder } from "@/hooks/api/purchase-orders";
import type { PurchaseOrder } from "@/hooks/api/purchase-orders";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface PurchaseOrderEditProps {
  purchaseOrder: PurchaseOrder;
  user: User;
}

const PURCHASE_ORDER_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "ordered", label: "Ordered" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function PurchaseOrderEdit({
  purchaseOrder,
  user: _user,
}: PurchaseOrderEditProps) {
  const router = useRouter();
  const updatePurchaseOrderMutation = useUpdatePurchaseOrder();

  const [formData, setFormData] = useState({
    status: purchaseOrder.status,
    notes: purchaseOrder.notes || "",
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate
      ? format(new Date(purchaseOrder.expectedDeliveryDate), "yyyy-MM-dd")
      : "",
    actualDeliveryDate: purchaseOrder.actualDeliveryDate
      ? format(new Date(purchaseOrder.actualDeliveryDate), "yyyy-MM-dd")
      : "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updatePurchaseOrderMutation.mutateAsync({
        id: purchaseOrder.id,
        data: {
          status: formData.status,
          notes: formData.notes,
          expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
          actualDeliveryDate: formData.actualDeliveryDate || undefined,
        },
      });

      toast.success("Purchase order updated successfully");
      router.push(`/inventory/purchase-orders/${purchaseOrder.id}`);
    } catch (_error) {
      toast.error("Failed to update purchase order");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/inventory/purchase-orders/${purchaseOrder.id}`}>
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Purchase Order
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Edit Purchase Order #{purchaseOrder.orderNumber}
            </h1>
            <p className="text-muted-foreground">
              Update order status and details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(purchaseOrder.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit Purchase Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURCHASE_ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expected Delivery Date */}
                <div className="space-y-2">
                  <Label htmlFor="expectedDeliveryDate">
                    Expected Delivery Date
                  </Label>
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expectedDeliveryDate: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Actual Delivery Date */}
                <div className="space-y-2">
                  <Label htmlFor="actualDeliveryDate">
                    Actual Delivery Date
                  </Label>
                  <Input
                    id="actualDeliveryDate"
                    type="date"
                    value={formData.actualDeliveryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        actualDeliveryDate: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add any additional notes..."
                    rows={4}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={updatePurchaseOrderMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <IconDeviceFloppy className="h-4 w-4" />
                    {updatePurchaseOrderMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/inventory/purchase-orders/${purchaseOrder.id}`
                      )
                    }
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
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
                <span>
                  {formatCurrency(parseFloat(purchaseOrder.subtotal))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>
                  {formatCurrency(parseFloat(purchaseOrder.taxAmount))}
                </span>
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
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {format(new Date(purchaseOrder.orderDate), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{purchaseOrder.users?.name}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
