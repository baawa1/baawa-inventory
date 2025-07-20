"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconCash,
  IconCreditCard,
  IconBuilding,
  IconWallet,
  IconPercentage,
  IconMinus,
  IconUser,
  IconReceipt,
  IconLoader,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { usePOSErrorHandler } from "./POSErrorBoundary";

export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  category?: string;
  brand?: string;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffName: string;
  timestamp: Date;
}

interface PaymentInterfaceProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  staffName: string;
  onPaymentSuccess: (sale: Sale) => void;
  onCancel: () => void;
  onDiscountChange: (discount: number) => void;
  onCustomerInfoChange: (info: {
    name: string;
    phone: string;
    email: string;
  }) => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: IconCash },
  { value: "pos", label: "POS Machine", icon: IconCreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: IconBuilding },
  { value: "mobile_money", label: "Mobile Money", icon: IconWallet },
];

export function PaymentInterface({
  items,
  subtotal,
  discount,
  total,
  customerInfo,
  staffName,
  onPaymentSuccess,
  onCancel,
  onDiscountChange,
  onCustomerInfoChange,
}: PaymentInterfaceProps) {
  const { handleError } = usePOSErrorHandler();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(total);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Handle discount change
  const handleDiscountChange = (value: number) => {
    setDiscountValue(value);
    if (discountType === "percentage") {
      const calculatedDiscount = (subtotal * value) / 100;
      onDiscountChange(Math.min(calculatedDiscount, subtotal));
    } else {
      onDiscountChange(Math.min(value, subtotal));
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "cash" && amountPaid < total) {
      toast.error("Insufficient payment amount");
      return;
    }

    setProcessing(true);

    try {
      // Create sales transaction
      const saleData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal,
        discount,
        total,
        paymentMethod,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        amountPaid,
        notes: notes || undefined,
      };

      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment");
      }

      const result = await response.json();

      const sale: Sale = {
        id: result.saleId,
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        staffName,
        timestamp: new Date(),
      };

      toast.success("Payment processed successfully!");
      onPaymentSuccess(sale);
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
      handleError(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setProcessing(false);
    }
  };

  const change = paymentMethod === "cash" ? Math.max(0, amountPaid - total) : 0;

  return (
    <Dialog open={true} onOpenChange={() => !processing && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconReceipt className="h-5 w-5" />
            Payment Processing
          </DialogTitle>
          <DialogDescription>
            Complete the payment for {items.length} item
            {items.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × ₦{item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="font-medium">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-₦{discount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconPercentage className="h-5 w-5" />
                  Discount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={
                      discountType === "percentage" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDiscountType("percentage")}
                    disabled={processing}
                  >
                    <IconPercentage className="h-4 w-4 mr-1" />
                    Percentage
                  </Button>
                  <Button
                    variant={discountType === "fixed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDiscountType("fixed")}
                    disabled={processing}
                  >
                    <IconMinus className="h-4 w-4 mr-1" />
                    Fixed Amount
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={discountType === "percentage" ? "0" : "0.00"}
                    value={discountValue || ""}
                    onChange={(e) =>
                      handleDiscountChange(parseFloat(e.target.value) || 0)
                    }
                    disabled={processing}
                  />
                  <div className="flex items-center px-3 bg-muted rounded">
                    {discountType === "percentage" ? "%" : "₦"}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Current discount: ₦{discount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment & Customer Info */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <Button
                        key={method.value}
                        variant={
                          paymentMethod === method.value ? "default" : "outline"
                        }
                        className="h-16 flex-col"
                        onClick={() => setPaymentMethod(method.value)}
                        disabled={processing}
                      >
                        <Icon className="h-6 w-6 mb-1" />
                        <span className="text-sm">{method.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cash Payment Details */}
            {paymentMethod === "cash" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cash Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amountPaid">Amount Paid (₦)</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) =>
                        setAmountPaid(parseFloat(e.target.value) || 0)
                      }
                      disabled={processing}
                    />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="font-medium">Change Due:</span>
                    <span className="font-bold text-lg">
                      ₦{change.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconUser className="h-5 w-5" />
                  Customer Information (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Name</Label>
                  <Input
                    id="customerName"
                    value={customerInfo.name}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        name: e.target.value,
                      })
                    }
                    disabled={processing}
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    disabled={processing}
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      onCustomerInfoChange({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    disabled={processing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Additional notes for this sale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={processing}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={processing || !paymentMethod}
            className="min-w-32"
          >
            {processing ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IconCash className="h-4 w-4 mr-2" />
                Complete Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
