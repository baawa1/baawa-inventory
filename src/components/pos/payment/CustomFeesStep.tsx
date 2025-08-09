'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPlus, IconTrash, IconCoins } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

interface CustomFee {
  feeType: string;
  description?: string;
  amount: number;
}

interface CustomFeesStepProps {
  fees: CustomFee[];
  onFeesChange: (_fees: CustomFee[]) => void;
  processing: boolean;
  subtotal: number;
}

const FEE_TYPES = [
  { value: 'shipping', label: 'Shipping Fee' },
  { value: 'service', label: 'Service Fee' },
  { value: 'processing', label: 'Processing Fee' },
  { value: 'delivery', label: 'Delivery Fee' },
  { value: 'installation', label: 'Installation Fee' },
  { value: 'custom', label: 'Custom Fee' },
];

const QUICK_FEES = [
  { label: '₦500', value: 500 },
  { label: '₦1,000', value: 1000 },
  { label: '₦2,500', value: 2500 },
  { label: '₦5,000', value: 5000 },
  { label: '₦10,000', value: 10000 },
  { label: '₦15,000', value: 15000 },
];

export function CustomFeesStep({
  fees,
  onFeesChange,
  processing,
  subtotal,
}: CustomFeesStepProps) {
  const [newFee, setNewFee] = useState<CustomFee>({
    feeType: '',
    description: '',
    amount: 0,
  });

  const addFee = () => {
    if (newFee.feeType && newFee.amount > 0) {
      const updatedFees = [...fees, { ...newFee }];
      onFeesChange(updatedFees);

      // Reset form
      setNewFee({
        feeType: '',
        description: '',
        amount: 0,
      });
    }
  };

  const removeFee = (index: number) => {
    const updatedFees = fees.filter((_, i) => i !== index);
    onFeesChange(updatedFees);
  };

  const addQuickFee = (amount: number) => {
    setNewFee(prev => ({ ...prev, amount }));
  };

  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const finalTotal = subtotal + totalFees;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Custom Fees</h3>

      {/* Current Fees List */}
      {fees.length > 0 && (
        <div className="space-y-2">
          <Label>Applied Fees</Label>
          <div className="space-y-2">
            {fees.map((fee, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {FEE_TYPES.find(type => type.value === fee.feeType)
                        ?.label || fee.feeType}
                    </span>
                    {fee.description && (
                      <span className="text-muted-foreground text-sm">
                        ({fee.description})
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    +{formatCurrency(fee.amount)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFee(index)}
                  disabled={processing}
                >
                  <IconTrash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="feeType">Fee Type</Label>
        <Select
          value={newFee.feeType}
          onValueChange={value =>
            setNewFee(prev => ({ ...prev, feeType: value }))
          }
          disabled={processing}
        >
          <SelectTrigger id="feeType">
            <SelectValue placeholder="Select fee type" />
          </SelectTrigger>
          <SelectContent>
            {FEE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <IconCoins className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fee Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="feeAmount">Fee Amount</Label>
        <div className="relative">
          <Input
            id="feeAmount"
            type="number"
            min="0"
            value={newFee.amount || ''}
            onChange={e =>
              setNewFee(prev => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder="Enter amount"
            disabled={processing}
            className="pr-12"
          />
          <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">
            ₦
          </div>
        </div>
      </div>

      {/* Quick Fee Buttons */}
      <div className="space-y-2">
        <Label>Quick Fees</Label>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_FEES.map(fee => (
            <Button
              key={fee.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuickFee(fee.value)}
              disabled={processing}
            >
              {fee.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Fee Description */}
      <div className="space-y-2">
        <Label htmlFor="feeDescription">Description (Optional)</Label>
        <Input
          id="feeDescription"
          value={newFee.description || ''}
          onChange={e =>
            setNewFee(prev => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Additional details about this fee..."
          disabled={processing}
        />
      </div>

      {/* Add Fee Button */}
      <Button
        onClick={addFee}
        disabled={!newFee.feeType || newFee.amount <= 0 || processing}
        className="w-full"
        variant="outline"
      >
        <IconPlus className="mr-2 h-4 w-4" />
        Add Fee
      </Button>

      <Separator />

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {totalFees > 0 && (
          <div className="flex justify-between">
            <span>Total Fees:</span>
            <span className="text-orange-600">
              +{formatCurrency(totalFees)}
            </span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Final Total:</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {fees.length === 0 && (
        <div className="text-muted-foreground py-4 text-center">
          <p className="text-sm">
            No fees added. You can skip this step if no additional fees apply.
          </p>
        </div>
      )}
    </div>
  );
}
