'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  IconArrowLeft,
  IconPercentage,
  IconCurrencyNaira,
  IconRefresh,
} from '@tabler/icons-react';
import { useCreateCoupon } from '@/hooks/api/useCoupons';
import { toast } from 'sonner';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateCouponFormProps {
  user: {
    id: string;
    role: string;
  };
}

export function CreateCouponForm({ user: _user }: CreateCouponFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: '',
    minimumAmount: '',
    maxUses: '',
    validFrom: null as Date | null,
    validUntil: null as Date | null,
  });

  const createMutation = useCreateCoupon();

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | Date | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.code ||
      !formData.name ||
      !formData.value ||
      !formData.validFrom ||
      !formData.validUntil
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Set time to 00:00 for start date and 23:59 for end date
    const validFromDateTime = formData.validFrom
      ? new Date(`${format(formData.validFrom, 'yyyy-MM-dd')}T00:00:00`)
      : null;

    const validUntilDateTime = formData.validUntil
      ? new Date(`${format(formData.validUntil, 'yyyy-MM-dd')}T23:59:59`)
      : null;

    const couponData = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      value: parseFloat(formData.value),
      minimumAmount: formData.minimumAmount
        ? parseFloat(formData.minimumAmount)
        : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      validFrom: validFromDateTime?.toISOString() || '',
      validUntil: validUntilDateTime?.toISOString() || '',
    };

    try {
      await createMutation.mutateAsync(couponData);
      toast.success('Coupon created successfully!');
      router.push('/pos/coupons');
    } catch (_error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/pos/coupons')}
          className="mb-4 px-4 lg:px-6"
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Coupons
        </Button>
        <PageHeader
          title="Create Coupon"
          description="Create a new discount coupon or promotional code for your customers"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Information</CardTitle>
          <CardDescription>
            Enter the details for the new coupon. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Coupon Code */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Coupon Code *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={e =>
                    handleInputChange('code', e.target.value.toUpperCase())
                  }
                  placeholder="Enter coupon code"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCouponCode}
                  className="flex items-center gap-2"
                >
                  <IconRefresh className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>

            {/* Coupon Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Coupon Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="e.g., 10% Off All Items"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Optional description of the coupon"
                rows={3}
              />
            </div>

            {/* Type and Value */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Discount Type *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                    handleInputChange('type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">
                      <div className="flex items-center gap-2">
                        <IconPercentage className="h-4 w-4" />
                        Percentage
                      </div>
                    </SelectItem>
                    <SelectItem value="FIXED">
                      <div className="flex items-center gap-2">
                        <IconCurrencyNaira className="h-4 w-4" />
                        Fixed Amount
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="text-sm font-medium">
                  Discount Value *
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={e => handleInputChange('value', e.target.value)}
                  placeholder={formData.type === 'PERCENTAGE' ? '10' : '1000'}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  {formData.type === 'PERCENTAGE'
                    ? 'Enter percentage (e.g., 10 for 10%)'
                    : 'Enter amount in Naira'}
                </p>
              </div>
            </div>

            {/* Minimum Amount and Max Uses */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minimumAmount" className="text-sm font-medium">
                  Minimum Purchase Amount
                </Label>
                <Input
                  id="minimumAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumAmount}
                  onChange={e =>
                    handleInputChange('minimumAmount', e.target.value)
                  }
                  placeholder="0"
                />
                <p className="text-muted-foreground text-xs">
                  Leave empty for no minimum
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-sm font-medium">
                  Maximum Uses
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={e => handleInputChange('maxUses', e.target.value)}
                  placeholder="Unlimited"
                />
                <p className="text-muted-foreground text-xs">
                  Leave empty for unlimited uses
                </p>
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom" className="text-sm font-medium">
                  Valid From *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.validFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validFrom ? (
                        format(formData.validFrom, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.validFrom}
                      onSelect={date => handleInputChange('validFrom', date)}
                      disabled={date => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-muted-foreground text-xs">
                  Coupon will be valid from 00:00 on this date
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil" className="text-sm font-medium">
                  Valid Until *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.validUntil && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validUntil ? (
                        format(formData.validUntil, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.validUntil}
                      onSelect={date => handleInputChange('validUntil', date)}
                      disabled={date => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-muted-foreground text-xs">
                  Coupon will be valid until 23:59 on this date
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
              </Button>
              <Link href="/pos/coupons">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
