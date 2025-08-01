import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { IconTag, IconX, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';

interface CouponData {
  id: number;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumAmount?: number;
}

interface CouponDisplayProps {
  subtotal: number;
  processing: boolean;
  appliedCoupon?: CouponData | null;
  onCouponChange?: (coupon: CouponData | null, discountAmount: number) => void;
}

export function CouponDisplay({
  subtotal,
  processing,
  appliedCoupon,
  onCouponChange,
}: CouponDisplayProps) {
  const [couponCode, setCouponCode] = React.useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);
  const [couponError, setCouponError] = React.useState('');

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await fetch('/api/pos/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          totalAmount: subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCouponError(data.error || 'Failed to validate coupon');
        return;
      }

      // Apply the coupon
      console.log(
        'Applying coupon:',
        data.coupon,
        'discount:',
        data.discountAmount
      );
      if (onCouponChange) {
        onCouponChange(data.coupon, data.discountAmount);
      }

      setCouponCode('');
      toast.success(`Coupon "${data.coupon.code}" applied successfully!`);
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    if (onCouponChange) {
      onCouponChange(null, 0);
    }
    toast.success('Coupon removed');
  };

  const handleCouponInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndApplyCoupon();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Coupon Code</h3>

      {/* Coupon Input Section */}
      <div className="space-y-2">
        <Label>Enter Coupon Code</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              onKeyPress={handleCouponInputKeyPress}
              placeholder="Enter coupon code"
              disabled={processing || isValidatingCoupon || !!appliedCoupon}
              className="pr-20"
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              {isValidatingCoupon && (
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
              )}
            </div>
          </div>
          <Button
            onClick={validateAndApplyCoupon}
            disabled={
              processing ||
              isValidatingCoupon ||
              !!appliedCoupon ||
              !couponCode.trim()
            }
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <IconTag className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>

        {couponError && <p className="text-sm text-red-500">{couponError}</p>}
      </div>

      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <div className="border-primary/30 bg-primary/5 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
                <IconCheck className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">
                  {appliedCoupon.name} ({appliedCoupon.code})
                </p>
                <p className="text-muted-foreground text-xs">
                  {appliedCoupon.type === 'PERCENTAGE'
                    ? `${appliedCoupon.value}% off`
                    : `${formatCurrency(appliedCoupon.value)} off`}
                </p>
              </div>
            </div>
            <Button
              onClick={removeCoupon}
              variant="ghost"
              size="sm"
              disabled={processing}
              className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Separator />
    </div>
  );
}
