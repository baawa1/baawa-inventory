import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconUser, IconPhone, IconMail, IconMapPin } from '@tabler/icons-react';

interface CustomerInfoStepProps {
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  onCustomerInfoChange: (
    _field: keyof CustomerInfoStepProps['customerInfo'],
    _value: string
  ) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
  customerInfo,
  onCustomerInfoChange,
  onNext,
  onBack,
  isSubmitting,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUser className="h-5 w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name" className="flex items-center gap-2">
              <IconUser className="h-4 w-4" />
              Customer Name
            </Label>
            <Input
              id="customer-name"
              type="text"
              placeholder="Enter customer name"
              value={customerInfo.name}
              onChange={e => onCustomerInfoChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone" className="flex items-center gap-2">
              <IconPhone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="Enter phone number"
              value={customerInfo.phone}
              onChange={e => onCustomerInfoChange('phone', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email" className="flex items-center gap-2">
              <IconMail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="Enter email address"
              value={customerInfo.email}
              onChange={e => onCustomerInfoChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="customer-address"
              className="flex items-center gap-2"
            >
              <IconMapPin className="h-4 w-4" />
              Address
            </Label>
            <Input
              id="customer-address"
              type="text"
              placeholder="Enter delivery address"
              value={customerInfo.address}
              onChange={e => onCustomerInfoChange('address', e.target.value)}
            />
          </div>

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
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
