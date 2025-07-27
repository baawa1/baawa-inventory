import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCreditCard, IconPlus, IconX } from '@tabler/icons-react';

interface SplitPayment {
  id: string;
  method: string;
  amount: number;
}

interface SplitPaymentInterfaceProps {
  total: number;
  splitPayments: SplitPayment[];
  onSplitPaymentsChange: (payments: SplitPayment[]) => void;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer', 'POS', 'Wallet'] as const;

export const SplitPaymentInterface: React.FC<SplitPaymentInterfaceProps> = ({
  total,
  splitPayments,
  onSplitPaymentsChange,
  onBack,
  onConfirm,
  isSubmitting,
}) => {
  const [newPayment, setNewPayment] = useState<Omit<SplitPayment, 'id'>>({
    method: 'Cash',
    amount: 0,
  });

  const totalPaid = splitPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const remaining = total - totalPaid;

  const addPayment = () => {
    if (newPayment.amount <= 0) return;

    const payment: SplitPayment = {
      id: Date.now().toString(),
      ...newPayment,
    };

    onSplitPaymentsChange([...splitPayments, payment]);
    setNewPayment({ method: 'Cash', amount: 0 });
  };

  const removePayment = (id: string) => {
    onSplitPaymentsChange(splitPayments.filter(payment => payment.id !== id));
  };

  const updatePayment = (
    id: string,
    field: keyof SplitPayment,
    value: string | number
  ) => {
    onSplitPaymentsChange(
      splitPayments.map(payment =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  const isComplete = totalPaid >= total;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCreditCard className="h-5 w-5" />
          Split Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total and Remaining */}
        <div className="grid grid-cols-2 gap-4 rounded bg-gray-50 p-4">
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold">₦{total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Remaining</p>
            <p
              className={`text-xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              ₦{remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Existing Payments */}
        {splitPayments.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Payment Methods</h3>
            <div className="space-y-2">
              {splitPayments.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 rounded bg-gray-50 p-3"
                >
                  <select
                    value={payment.method}
                    onChange={e =>
                      updatePayment(payment.id, 'method', e.target.value)
                    }
                    className="flex-1 rounded border p-2"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    value={payment.amount}
                    onChange={e =>
                      updatePayment(
                        payment.id,
                        'amount',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-32"
                    placeholder="Amount"
                  />
                  <Badge variant="secondary">
                    ₦{payment.amount.toLocaleString()}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePayment(payment.id)}
                    className="p-1"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Payment */}
        <div className="space-y-3">
          <h3 className="font-semibold">Add Payment Method</h3>
          <div className="flex items-center gap-3">
            <select
              value={newPayment.method}
              onChange={e =>
                setNewPayment({ ...newPayment, method: e.target.value })
              }
              className="flex-1 rounded border p-2"
            >
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={newPayment.amount}
              onChange={e =>
                setNewPayment({
                  ...newPayment,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              className="w-32"
              placeholder="Amount"
            />
            <Button
              type="button"
              onClick={addPayment}
              disabled={newPayment.amount <= 0}
              className="p-2"
            >
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span>Total Paid:</span>
            <span className="font-semibold">₦{totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining:</span>
            <span
              className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              ₦{remaining.toLocaleString()}
            </span>
          </div>
          {totalPaid > total && (
            <div className="flex justify-between text-blue-600">
              <span>Change:</span>
              <span>₦{(totalPaid - total).toLocaleString()}</span>
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
            disabled={isSubmitting || !isComplete}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Split Payment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
