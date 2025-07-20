import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconReceipt,
  IconUser,
  IconCreditCard,
  IconDiscount,
  IconCheck,
} from "@tabler/icons-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface PaymentInfo {
  method: string;
  amountPaid: number;
  discountType: "percentage" | "fixed" | null;
  discountValue: number;
  splitPayment: boolean;
  splitAmount?: number;
}

interface ReviewStepProps {
  cartItems: CartItem[];
  customerInfo: CustomerInfo;
  paymentInfo: PaymentInfo;
  subtotal: number;
  total: number;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  cartItems,
  customerInfo,
  paymentInfo,
  subtotal,
  total,
  onConfirm,
  onBack,
  isSubmitting,
}) => {
  const discountAmount =
    paymentInfo.discountType === "percentage"
      ? (subtotal * paymentInfo.discountValue) / 100
      : paymentInfo.discountValue || 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconReceipt className="h-5 w-5" />
          Review Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Items */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Order Items</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    ₦{item.price.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">₦{item.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <IconUser className="h-4 w-4" />
            Customer Information
          </h3>
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{customerInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{customerInfo.phone}</p>
            </div>
            {customerInfo.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customerInfo.email}</p>
              </div>
            )}
            {customerInfo.address && (
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{customerInfo.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <IconCreditCard className="h-4 w-4" />
            Payment Information
          </h3>
          <div className="space-y-2 p-3 bg-gray-50 rounded">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <Badge variant="secondary">{paymentInfo.method}</Badge>
            </div>
            {paymentInfo.discountType && (
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <IconDiscount className="h-4 w-4" />
                  Discount:
                </span>
                <span className="text-green-600 font-medium">
                  {paymentInfo.discountType === "percentage"
                    ? `${paymentInfo.discountValue}%`
                    : `₦${paymentInfo.discountValue.toLocaleString()}`}
                </span>
              </div>
            )}
            {paymentInfo.splitPayment && (
              <div className="flex justify-between">
                <span>Split Payment:</span>
                <Badge variant="outline">Yes</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-₦{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Amount Paid:</span>
            <span>₦{paymentInfo.amountPaid.toLocaleString()}</span>
          </div>
          {paymentInfo.amountPaid > total && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Change:</span>
              <span>₦{(paymentInfo.amountPaid - total).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                <IconCheck className="h-4 w-4 mr-2" />
                Confirm Order
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
