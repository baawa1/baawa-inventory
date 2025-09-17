'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconUser,
  IconSearch,
  IconUserPlus,
  IconMapPin,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EnhancedCustomerInfo {
  name: string;
  email: string;
  phone: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  customerType?: 'individual' | 'business';
  notes?: string;
  useBillingAsShipping?: boolean;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
}

interface EnhancedCustomerInfoStepProps {
  customerInfo: EnhancedCustomerInfo;
  onCustomerInfoChange: (info: EnhancedCustomerInfo) => void;
  processing: boolean;
}

const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

// API function to fetch customers
async function fetchCustomers({
  queryKey,
}: {
  queryKey: string[];
}): Promise<any[]> {
  const searchQuery = queryKey[1];
  if (!searchQuery) return [];

  const response = await fetch(
    `/api/pos/customers?search=${encodeURIComponent(searchQuery)}`
  );
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

export function EnhancedCustomerInfoStep({
  customerInfo,
  onCustomerInfoChange,
  processing,
}: EnhancedCustomerInfoStepProps) {
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: fetchCustomers,
    enabled: showCustomerSearch && searchTerm.length > 2,
  });

  // Update shipping address when billing address changes and useBillingAsShipping is true
  useEffect(() => {
    if (customerInfo.useBillingAsShipping) {
      onCustomerInfoChange({
        ...customerInfo,
        shippingAddress: customerInfo.billingAddress,
        shippingCity: customerInfo.city,
        shippingState: customerInfo.state,
        shippingPostalCode: customerInfo.postalCode,
        shippingCountry: customerInfo.country,
      });
    }
  }, [
    customerInfo.useBillingAsShipping,
    customerInfo.billingAddress,
    customerInfo.city,
    customerInfo.state,
    customerInfo.postalCode,
    customerInfo.country,
  ]);

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);

    // Update with customer data
    onCustomerInfoChange({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      billingAddress: customer.billingAddress || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || 'Nigeria',
      customerType: customer.customerType || 'individual',
      notes: customer.notes || '',
      useBillingAsShipping: true,
      shippingAddress:
        customer.shippingAddress || customer.billingAddress || '',
      shippingCity: customer.shippingCity || customer.city || '',
      shippingState: customer.shippingState || customer.state || '',
      shippingPostalCode:
        customer.shippingPostalCode || customer.postalCode || '',
      shippingCountry:
        customer.shippingCountry || customer.country || 'Nigeria',
    });

    setShowCustomerSearch(false);
    setSearchTerm('');
    toast.success(`Selected customer: ${customer.name}`);
  };

  const startNewCustomer = () => {
    setSelectedCustomer(null);
    onCustomerInfoChange({
      name: '',
      phone: '',
      email: '',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria',
      customerType: 'individual',
      notes: '',
      useBillingAsShipping: true,
      shippingCity: '',
      shippingState: '',
      shippingPostalCode: '',
      shippingCountry: 'Nigeria',
    });
    setShowCustomerSearch(false);
    setSearchTerm('');
  };

  const updateField = (field: keyof EnhancedCustomerInfo, value: any) => {
    onCustomerInfoChange({
      ...customerInfo,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Customer Information</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
            disabled={processing}
          >
            <IconSearch className="mr-2 h-4 w-4" />
            {showCustomerSearch ? 'Hide Search' : 'Search Existing'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={startNewCustomer}
            disabled={processing}
          >
            <IconUserPlus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </div>
      </div>

      {/* Customer Search */}
      {showCustomerSearch && (
        <div className="space-y-3 rounded-lg border p-4">
          <Label>Search Customers</Label>
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            disabled={processing}
          />

          {customersLoading && (
            <div className="py-4 text-center">Searching...</div>
          )}

          {searchTerm.length > 2 &&
            customers.length === 0 &&
            !customersLoading && (
              <div className="text-muted-foreground py-4 text-center">
                No customers found
              </div>
            )}

          {customers.length > 0 && (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50"
                  onClick={() => selectCustomer(customer)}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {customer.email} • {customer.phone}
                  </div>
                  {customer.city && customer.state && (
                    <div className="text-muted-foreground text-sm">
                      {customer.city}, {customer.state}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="rounded-lg border bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconUser className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                Selected: {selectedCustomer.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewCustomer}
              disabled={processing}
            >
              Change
            </Button>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 font-medium">
          <IconUser className="h-4 w-4" />
          Basic Information
        </h4>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Name *</Label>
            <Input
              id="customerName"
              value={customerInfo.name || ''}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Customer name"
              disabled={processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerType">Customer Type</Label>
            <Select
              value={customerInfo.customerType || 'individual'}
              onValueChange={value => updateField('customerType', value)}
              disabled={processing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              value={customerInfo.phone || ''}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="Phone number"
              disabled={processing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerInfo.email || ''}
              onChange={e => updateField('email', e.target.value)}
              placeholder="Email address"
              disabled={processing}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Billing Address */}
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 font-medium">
          <IconMapPin className="h-4 w-4" />
          Billing Address
        </h4>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billingAddress">Address</Label>
            <Input
              id="billingAddress"
              value={customerInfo.billingAddress || ''}
              onChange={e => updateField('billingAddress', e.target.value)}
              placeholder="Street address"
              disabled={processing}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={customerInfo.city || ''}
                onChange={e => updateField('city', e.target.value)}
                placeholder="City"
                disabled={processing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={customerInfo.state || ''}
                onValueChange={value => updateField('state', value)}
                disabled={processing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={customerInfo.postalCode || ''}
                onChange={e => updateField('postalCode', e.target.value)}
                placeholder="Postal code"
                disabled={processing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={customerInfo.country || 'Nigeria'}
              onValueChange={value => updateField('country', value)}
              disabled={processing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nigeria">Nigeria</SelectItem>
                <SelectItem value="Ghana">Ghana</SelectItem>
                <SelectItem value="Kenya">Kenya</SelectItem>
                <SelectItem value="South Africa">South Africa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Shipping Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-medium">
            <IconMapPin className="h-4 w-4" />
            Shipping Address
          </h4>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useBillingAsShipping"
              checked={customerInfo.useBillingAsShipping}
              onCheckedChange={checked =>
                updateField('useBillingAsShipping', checked)
              }
              disabled={processing}
            />
            <Label htmlFor="useBillingAsShipping">
              Same as billing address
            </Label>
          </div>
        </div>

        {!customerInfo.useBillingAsShipping && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Address</Label>
              <Input
                id="shippingAddress"
                value={customerInfo.shippingAddress || ''}
                onChange={e => updateField('shippingAddress', e.target.value)}
                placeholder="Street address"
                disabled={processing}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="shippingCity">City</Label>
                <Input
                  id="shippingCity"
                  value={customerInfo.shippingCity || ''}
                  onChange={e => updateField('shippingCity', e.target.value)}
                  placeholder="City"
                  disabled={processing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingState">State</Label>
                <Select
                  value={customerInfo.shippingState || ''}
                  onValueChange={value => updateField('shippingState', value)}
                  disabled={processing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingPostalCode">Postal Code</Label>
                <Input
                  id="shippingPostalCode"
                  value={customerInfo.shippingPostalCode || ''}
                  onChange={e =>
                    updateField('shippingPostalCode', e.target.value)
                  }
                  placeholder="Postal code"
                  disabled={processing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingCountry">Country</Label>
              <Select
                value={customerInfo.shippingCountry || 'Nigeria'}
                onValueChange={value => updateField('shippingCountry', value)}
                disabled={processing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nigeria">Nigeria</SelectItem>
                  <SelectItem value="Ghana">Ghana</SelectItem>
                  <SelectItem value="Kenya">Kenya</SelectItem>
                  <SelectItem value="South Africa">South Africa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="customerNotes">Notes (Optional)</Label>
        <Textarea
          id="customerNotes"
          value={customerInfo.notes || ''}
          onChange={e => updateField('notes', e.target.value)}
          placeholder="Additional notes about this customer..."
          disabled={processing}
          rows={3}
        />
      </div>
    </div>
  );
}
