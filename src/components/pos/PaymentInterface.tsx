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
  IconPercentage,
  IconMinus,
  IconUser,
  IconReceipt,
  IconLoader,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_METHODS_UI } from '@/lib/constants/ui';
import { logger } from '@/lib/logger';

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

  // Handle discount change
  const handleDiscountChange = (value: number) => {
    setDiscountValue(value);
    if (discountType === 'percentage') {
      const calculatedDiscount = (subtotal * value) / 100;
      onDiscountChange(Math.min(calculatedDiscount, subtotal));
    } else {
      onDiscountChange(Math.min(value, subtotal));
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (paymentMethod === 'cash' && amountPaid < total) {
      toast.error('Insufficient payment amount');
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

      toast.success('Payment processed successfully!');
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
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconPercentage className="h-5 w-5" />
                  Discount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={
                      discountType === 'percentage' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setDiscountType('percentage')}
                    disabled={processing}
                  >
                    <IconPercentage className="mr-1 h-4 w-4" />
                    Percentage
                  </Button>
                  <Button
                    variant={discountType === 'fixed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDiscountType('fixed')}
                    disabled={processing}
                  >
                    <IconMinus className="mr-1 h-4 w-4" />
                    Fixed Amount
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={discountType === 'percentage' ? '0' : '0.00'}
                    value={discountValue || ''}
                    onChange={e =>
                      handleDiscountChange(parseFloat(e.target.value) || 0)
                    }
                    disabled={processing}
                  />
                  <div className="bg-muted flex items-center rounded px-3">
                    {discountType === 'percentage' ? '%' : '₦'}
                  </div>
                </div>

                <div className="text-muted-foreground text-sm">
                  Current discount: {formatCurrency(discount)}
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
