import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { IconPercentage, IconMinus } from '@tabler/icons-react';
import { calculateDiscountAmount } from '@/lib/utils/calculations';

interface DiscountStepProps {
  discountType: 'percentage' | 'fixed';
  setDiscountType: (_type: 'percentage' | 'fixed') => void;
  discountValue: number;
  handleDiscountChange: (_value: number) => void;
  subtotal: number;
  processing: boolean;
}

export function DiscountStep({
  discountType,
  setDiscountType,
  discountValue,
  handleDiscountChange,
  subtotal,
  processing,
}: DiscountStepProps) {
  const maxPercentage = 100;
  const maxFixed = subtotal;

  const handleTypeChange = (newType: 'percentage' | 'fixed') => {
    setDiscountType(newType);
    // Reset discount value when switching types
    handleDiscountChange(0);
  };

  const discountAmount = calculateDiscountAmount(
    subtotal,
    discountValue,
    discountType
  );
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Discount</h3>

      {/* Discount Type Selection */}
      <div className="space-y-2">
        <Label>Discount Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={discountType === 'percentage' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('percentage')}
            disabled={processing}
            className="flex-1"
          >
            <IconPercentage className="mr-2 h-4 w-4" />
            Percentage
          </Button>
          <Button
            type="button"
            variant={discountType === 'fixed' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('fixed')}
            disabled={processing}
            className="flex-1"
          >
            <IconMinus className="mr-2 h-4 w-4" />
            Fixed Amount
          </Button>
        </div>
      </div>

      {/* Discount Value Input */}
      <div className="space-y-2">
        <Label htmlFor="discount-value">
          {discountType === 'percentage'
            ? 'Discount Percentage'
            : 'Discount Amount'}
        </Label>
        <div className="relative">
          <Input
            id="discount-value"
            type="number"
            value={discountValue}
            onChange={e => {
              const value = parseFloat(e.target.value) || 0;
              const max =
                discountType === 'percentage' ? maxPercentage : maxFixed;
              handleDiscountChange(Math.min(value, max));
            }}
            placeholder={
              discountType === 'percentage'
                ? 'Enter percentage (0-100)'
                : 'Enter amount'
            }
            disabled={processing}
            className="pr-12"
          />
          <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">
            {discountType === 'percentage' ? '%' : '₦'}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Max:{' '}
          {discountType === 'percentage'
            ? `${maxPercentage}%`
            : formatCurrency(maxFixed)}
        </p>
      </div>

      {/* Quick Discount Buttons */}
      {discountType === 'percentage' && (
        <div className="space-y-2">
          <Label>Quick Discount</Label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15, 20, 25, 50].map(percent => (
              <Button
                key={percent}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDiscountChange(percent)}
                disabled={processing}
              >
                {percent}%
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span className="text-green-600">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Final Total:</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
}
