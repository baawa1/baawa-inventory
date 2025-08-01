'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  IconCash,
  IconUser,
  IconReceipt,
  IconLoader,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_METHODS_UI } from '@/lib/constants/ui';
import { logger } from '@/lib/logger';
import {
  calculateDiscountAmount,
  validatePaymentAmount,
} from '@/lib/utils/calculations';
import { DiscountStep } from './payment/DiscountStep';

interface CouponData {
  id: number;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumAmount?: number;
}

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
  onPaymentSuccess: (_sale: Sale) => void;
  onCancel: () => void;
  onDiscountChange: (_discount: number) => void;
  onCustomerInfoChange: (_info: {
    name: string;
    phone: string;
    email: string;
  }) => void;
}

const PAYMENT_METHODS = PAYMENT_METHODS_UI;

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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    'percentage'
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(total);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Handle discount change
  const handleDiscountChange = (value: number) => {
    setDiscountValue(value);
    const calculatedDiscount = calculateDiscountAmount(
      subtotal,
      value,
      discountType
    );

    // Only apply manual discount if no coupon is applied
    if (!appliedCoupon) {
      onDiscountChange(calculatedDiscount);
    }
  };

  const handleDiscountTypeChange = (newType: 'percentage' | 'fixed') => {
    setDiscountType(newType);
    // Reset discount value when switching types
    setDiscountValue(0);

    // Only update discount if no coupon is applied
    if (!appliedCoupon) {
      onDiscountChange(0);
    }
  };

  // Handle coupon change
  const handleCouponChange = (
    coupon: CouponData | null,
    discountAmount: number
  ) => {
    console.log('handleCouponChange called:', { coupon, discountAmount });
    setAppliedCoupon(coupon);
    setCouponDiscount(discountAmount);

    if (coupon) {
      // If coupon is applied, reset manual discount and use only coupon discount
      setDiscountValue(0);
      onDiscountChange(discountAmount);
    } else {
      // If coupon is removed, keep manual discount if any
      const manualDiscount =
        discountValue > 0
          ? calculateDiscountAmount(subtotal, discountValue, discountType)
          : 0;
      onDiscountChange(manualDiscount);
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const validation = validatePaymentAmount(amountPaid, total, paymentMethod);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid payment amount');
      return;
    }

    setProcessing(true);

    try {
      // Create sales transaction
      const saleData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          couponId: appliedCoupon?.id, // Add coupon ID to all items
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

      const response = await fetch('/api/pos/create-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
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

      // Show success message with email status
      if (result.emailSent && customerInfo.email) {
        toast.success(
          'Payment processed successfully! Email receipt sent to customer.'
        );
      } else if (customerInfo.email) {
        toast.success(
          'Payment processed successfully! (Email receipt failed to send)'
        );
      } else {
        toast.success('Payment processed successfully!');
      }

      onPaymentSuccess(sale);
    } catch (error) {
      logger.error('Payment processing failed', {
        paymentMethod,
        amount: total,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const change = paymentMethod === 'cash' ? Math.max(0, amountPaid - total) : 0;

  return (
    <Dialog open={true} onOpenChange={() => !processing && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconReceipt className="h-5 w-5" />
            Payment Processing
          </DialogTitle>
          <DialogDescription>
            Complete the payment for {items.length} item
            {items.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-48 overflow-y-auto">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b py-2 last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}

                  {discount > couponDiscount && (
                    <div className="flex justify-between text-blue-600">
                      <span>Manual Discount</span>
                      <span>-{formatCurrency(discount - couponDiscount)}</span>
                    </div>
                  )}

                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <DiscountStep
              discountType={discountType}
              setDiscountType={handleDiscountTypeChange}
              discountValue={discountValue}
              handleDiscountChange={handleDiscountChange}
              subtotal={subtotal}
              processing={processing}
              appliedCoupon={appliedCoupon}
              onCouponChange={handleCouponChange}
            />
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
                  {PAYMENT_METHODS.map(method => {
                    const Icon = method.icon;
                    return (
                      <Button
                        key={method.value}
                        variant={
                          paymentMethod === method.value ? 'default' : 'outline'
                        }
                        className="h-16 flex-col"
                        onClick={() => setPaymentMethod(method.value)}
                        disabled={processing}
                      >
                        <Icon className="mb-1 h-6 w-6" />
                        <span className="text-sm">{method.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cash Payment Details */}
            {paymentMethod === 'cash' && (
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
                      onChange={e =>
                        setAmountPaid(parseFloat(e.target.value) || 0)
                      }
                      disabled={processing}
                    />
                  </div>

                  <div className="bg-muted flex items-center justify-between rounded p-3">
                    <span className="font-medium">Change Due:</span>
                    <span className="text-lg font-bold">
                      ₦{formatCurrency(change)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
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
                    onChange={e =>
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
                    onChange={e =>
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
                    onChange={e =>
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
                  onChange={e => setNotes(e.target.value)}
                  disabled={processing}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 border-t pt-4">
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
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IconCash className="mr-2 h-4 w-4" />
                Complete Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
