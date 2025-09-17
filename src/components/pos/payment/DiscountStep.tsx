import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { IconPercentage, IconMinus } from '@tabler/icons-react';
import {
  calculateDiscountAmount,
  validateDiscountAmount,
} from '@/lib/utils/calculations';
import { toast } from 'sonner';

interface DiscountStepProps {
  discountType: 'percentage' | 'fixed';
  setDiscountType: (_type: 'percentage' | 'fixed') => void;
  discountValue: number;
  handleDiscountChange: (_value: number) => void;
  subtotal: number;
  processing: boolean;
  appliedCoupon?: any; // Add this to disable manual discount when coupon is applied
  couponDiscount?: number; // Add coupon discount amount
  currentTotalDiscount?: number; // Add current total discount
}

export function DiscountStep({
  discountType,
  setDiscountType,
  discountValue,
  handleDiscountChange,
  subtotal,
  processing,
  appliedCoupon,
  couponDiscount = 0,
  currentTotalDiscount = 0,
}: DiscountStepProps) {
  const maxPercentage = 100;
  const maxFixed = subtotal;

  const handleTypeChange = (newType: 'percentage' | 'fixed') => {
    // If coupon is applied, ask user to remove it first
    if (appliedCoupon) {
      toast.error(
        'Please remove the applied coupon before changing discount type'
      );
      return;
    }

    setDiscountType(newType);
    // Reset discount value when switching types
    handleDiscountChange(0);
  };

  const manualDiscountAmount = calculateDiscountAmount(
    subtotal,
    discountValue,
    discountType
  );
  const finalTotal = subtotal - currentTotalDiscount;

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base font-semibold sm:text-lg">Discount</h3>

      {/* Discount Type Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Discount Type</Label>
          {appliedCoupon && (
            <p className="text-xs text-amber-500">
              ⚠️ Manual discount disabled (coupon applied)
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={discountType === 'percentage' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('percentage')}
            disabled={processing || !!appliedCoupon}
            className="flex-1"
          >
            <IconPercentage className="mr-2 h-4 w-4" />
            Percentage
          </Button>
          <Button
            type="button"
            variant={discountType === 'fixed' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('fixed')}
            disabled={processing || !!appliedCoupon}
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
              const newValue = Math.min(value, max);

              // Validate the discount amount
              const validation = validateDiscountAmount(
                newValue,
                subtotal,
                discountType
              );
              if (!validation.isValid) {
                toast.error(validation.error || 'Invalid discount amount');
                return;
              }

              handleDiscountChange(newValue);
            }}
            placeholder={
              discountType === 'percentage'
                ? 'Enter percentage (0-100)'
                : 'Enter amount'
            }
            disabled={processing || !!appliedCoupon}
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
      {discountType === 'percentage' && !appliedCoupon && (
        <div className="space-y-2">
          <Label className="text-sm">Quick Discount</Label>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {[5, 10, 15, 20, 25, 50].map(percent => (
              <Button
                key={percent}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDiscountChange(percent)}
                disabled={processing}
                className="h-auto py-0.5 text-xs sm:text-sm"
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
        {manualDiscountAmount > 0 && (
          <div className="flex justify-between">
            <span>Manual Discount:</span>
            <span className="text-green-600">
              -{formatCurrency(manualDiscountAmount)}
            </span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between">
            <span>Coupon Discount:</span>
            <span className="text-green-600">
              -{formatCurrency(couponDiscount)}
            </span>
          </div>
        )}
        {currentTotalDiscount > 0 && (
          <div className="flex justify-between">
            <span>Total Discount:</span>
            <span className="text-green-600">
              -{formatCurrency(currentTotalDiscount)}
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
