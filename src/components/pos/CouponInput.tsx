'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { IconTicket, IconX, IconCheck } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { useValidateCoupon } from '@/hooks/api/useCoupons';
import type { ValidateCouponResponse } from '@/hooks/api/useCoupons';

interface CouponInputProps {
  totalAmount: number;
  onCouponApplied: (couponData: ValidateCouponResponse) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: ValidateCouponResponse | null;
}

export function CouponInput({
  totalAmount,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = useValidateCoupon();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    try {
      const result = await validateCoupon.mutateAsync({
        code: couponCode.trim(),
        totalAmount,
      });

      onCouponApplied(result);
      setCouponCode('');
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IconCheck className="h-5 w-5 text-green-600" />
              <div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    {appliedCoupon.coupon.code}
                  </Badge>
                  <span className="text-sm font-medium text-green-800">
                    {appliedCoupon.coupon.name}
                  </span>
                </div>
                <div className="text-sm text-green-700">
                  Discount: {formatCurrency(appliedCoupon.discountAmount)}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <IconTicket className="text-muted-foreground h-4 w-4" />
            <Label htmlFor="coupon-code" className="text-sm font-medium">
              Apply Coupon
            </Label>
          </div>

          <div className="flex space-x-2">
            <Input
              id="coupon-code"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={isValidating}
              className="flex-1"
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || isValidating}
              size="sm"
            >
              {isValidating ? 'Validating...' : 'Apply'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
