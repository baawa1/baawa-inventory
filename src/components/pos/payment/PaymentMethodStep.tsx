import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import {
  IconCash,
  IconCreditCard,
  IconBuilding,
  IconWallet,
} from '@tabler/icons-react';

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: IconCash, color: 'text-green-600' },
  {
    id: 'pos',
    name: 'POS Machine',
    icon: IconCreditCard,
    color: 'text-blue-600',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: IconBuilding,
    color: 'text-purple-600',
  },
  {
    id: 'mobile',
    name: 'Mobile Money',
    icon: IconWallet,
    color: 'text-orange-600',
  },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['id'];

interface PaymentMethodStepProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (_method: PaymentMethod) => void;
  amountPaid: number;
  setAmountPaid: (_amount: number) => void;
  total: number;
  discount: number;
  change: number;
  processing: boolean;
  isSplitPayment: boolean;
  setIsSplitPayment: (_split: boolean) => void;
  subtotal: number;
}

export function PaymentMethodStep({
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  total,
  discount,
  change,
  processing,
  isSplitPayment,
  setIsSplitPayment,
  subtotal,
}: PaymentMethodStepProps) {
  const handleAmountPaidChange = (value: number) => {
    setAmountPaid(value);
  };

  const handleQuickAmount = (amount: number) => {
    setAmountPaid(amount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Payment Method</h2>
        <p className="text-muted-foreground">
          Select how the customer will pay
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map(method => {
              const IconComponent = method.icon;
              return (
                <Button
                  key={method.id}
                  type="button"
                  variant={paymentMethod === method.id ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod(method.id)}
                  disabled={processing}
                  className="h-16 flex-col gap-1"
                >
                  <IconComponent className={`h-5 w-5 ${method.color}`} />
                  <span className="text-sm">{method.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Split Payment Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="split-payment" className="text-base font-medium">
                Split Payment
              </Label>
              <p className="text-muted-foreground text-sm">
                Allow multiple payment methods for this transaction
              </p>
            </div>
            <Switch
              id="split-payment"
              checked={isSplitPayment}
              onCheckedChange={setIsSplitPayment}
              disabled={processing}
            />
          </div>

          {/* Amount Paid Input (for non-split payments) */}
          {!isSplitPayment && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="amount-paid">Amount Paid</Label>
                <Input
                  id="amount-paid"
                  type="number"
                  value={amountPaid}
                  onChange={e =>
                    handleAmountPaidChange(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter amount paid"
                  disabled={processing}
                  className="text-lg"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="space-y-2">
                <Label className="text-sm">Quick Amount</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    total,
                    Math.ceil(total / 100) * 100,
                    Math.ceil(total / 500) * 500,
                    Math.ceil(total / 1000) * 1000,
                  ].map(amount => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      disabled={processing}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span className="text-green-600">
                  -{formatCurrency(discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {!isSplitPayment && amountPaid > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span>{formatCurrency(amountPaid)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Change:</span>
                  <span
                    className={change >= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {change >= 0
                      ? formatCurrency(change)
                      : `-${formatCurrency(Math.abs(change))}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
