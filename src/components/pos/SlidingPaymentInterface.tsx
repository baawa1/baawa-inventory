'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  IconX,
  IconReceipt,
  IconPercentage,
  IconCreditCard,
  IconCash,
  IconBuilding,
  IconWallet,
  IconUser,
  IconCheck,
  IconLoader,
  IconArrowLeft,
  IconArrowRight,
  IconSearch,
} from '@tabler/icons-react';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { DiscountStep } from './payment/DiscountStep';
import { useQuery } from '@tanstack/react-query';

export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  category?: string;
  brand?: string;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffName: string;
  timestamp: Date;
}

interface SlidingPaymentInterfaceProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  staffName: string;
  onPaymentSuccess: (_sale: Sale) => void;
  onCancel: () => void;
  onDiscountChange: (_discount: number) => void;
  onCustomerInfoChange: (_info: {
    name: string;
    phone: string;
    email: string;
  }) => void;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: IconCash },
  { value: 'pos', label: 'POS Machine', icon: IconCreditCard },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: IconBuilding },
  { value: 'mobile_money', label: 'Mobile Money', icon: IconWallet },
];

const STEPS = [
  { id: 'order-summary', title: 'Order Summary', icon: IconReceipt },
  { id: 'discount', title: 'Discount', icon: IconPercentage },
  { id: 'payment-method', title: 'Payment Method', icon: IconCreditCard },
  { id: 'customer-info', title: 'Customer Info', icon: IconUser },
  { id: 'review', title: 'Review & Complete', icon: IconCheck },
];

// API function to fetch customers
async function fetchCustomers({
  queryKey,
}: {
  queryKey: string[];
}): Promise<any[]> {
  const searchQuery = queryKey[1]; // The search term is the second element in the query key
  const url = searchQuery
    ? `/api/pos/customers?search=${encodeURIComponent(searchQuery)}`
    : '/api/pos/customers';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

export function SlidingPaymentInterface({
  items,
  subtotal,
  discount,
  total,
  customerInfo,
  staffName,
  onPaymentSuccess,
  onCancel,
  onDiscountChange,
  onCustomerInfoChange,
}: SlidingPaymentInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    'percentage'
  );
  const [discountValue, setDiscountValue] = useState(discount);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountPaid, setAmountPaid] = useState(total - discount);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<
    Array<{ id: string; amount: number; method: string }>
  >([]);

  const { handleError } = usePOSErrorHandler();

  const handleDiscountChange = (value: number) => {
    setDiscountValue(value);
    if (discountType === 'percentage') {
      const calculatedDiscount = (subtotal * value) / 100;
      onDiscountChange(Math.min(calculatedDiscount, subtotal));
    } else {
      onDiscountChange(Math.min(value, subtotal));
    }
  };

  const handleDiscountTypeChange = (newType: 'percentage' | 'fixed') => {
    setDiscountType(newType);
    // Reset discount value when switching types
    setDiscountValue(0);
    onDiscountChange(0);
  };

  const handlePayment = async () => {
    if (isSplitPayment) {
      const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid < total - discount) {
        toast.error('Split payment total is less than the required amount');
        return;
      }
    } else {
      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }

      if (paymentMethod === 'cash' && amountPaid < total - discount) {
        toast.error('Insufficient payment amount');
        return;
      }
    }

    setProcessing(true);

    try {
      // Create sales transaction
      const saleData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal,
        discount,
        total,
        paymentMethod: isSplitPayment ? 'split' : paymentMethod,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        amountPaid: isSplitPayment
          ? splitPayments.reduce((sum, p) => sum + p.amount, 0)
          : amountPaid,
        notes: notes || undefined,
        splitPayments: isSplitPayment ? splitPayments : undefined,
      };

      const response = await fetch('/api/pos/create-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      const result = await response.json();

      const sale: Sale = {
        id: result.saleId,
        items,
        subtotal,
        discount,
        total,
        paymentMethod: isSplitPayment ? 'split' : paymentMethod,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        staffName,
        timestamp: new Date(),
      };

      toast.success('Payment processed successfully!');
      onPaymentSuccess(sale);
    } catch (error) {
      const errorMessage = 'Payment processing failed';
      toast.error(errorMessage);
      handleError(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setProcessing(false);
    }
  };

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(Math.min(currentStep + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Order Summary - always can proceed
        return true;
      case 1: // Discount - always can proceed
        return true;
      case 2: // Payment Method
        if (isSplitPayment) {
          const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
          return splitPayments.length > 0 && totalPaid > 0;
        }
        return paymentMethod !== '';
      case 3: // Customer Info - always can proceed
        return true;
      case 4: // Review - always can proceed
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <OrderSummaryStep
            items={items}
            subtotal={subtotal}
            discount={discount}
            total={total}
          />
        );
      case 1:
        return (
          <DiscountStep
            discountType={discountType}
            setDiscountType={handleDiscountTypeChange}
            discountValue={discountValue}
            handleDiscountChange={handleDiscountChange}
            subtotal={subtotal}
            processing={processing}
          />
        );
      case 2:
        return (
          <PaymentMethodStep
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
            total={total}
            discount={discount}
            change={change}
            processing={processing}
            isSplitPayment={isSplitPayment}
            setIsSplitPayment={setIsSplitPayment}
            _splitPayments={splitPayments}
            _setSplitPayments={setSplitPayments}
          />
        );
      case 3:
        return (
          <CustomerInfoStep
            customerInfo={customerInfo}
            onCustomerInfoChange={onCustomerInfoChange}
            processing={processing}
          />
        );
      case 4:
        return (
          <ReviewStep
            items={items}
            subtotal={subtotal}
            discount={discount}
            total={total}
            paymentMethod={paymentMethod}
            customerInfo={customerInfo}
            amountPaid={amountPaid}
            change={change}
            notes={notes}
            setNotes={setNotes}
            processing={processing}
            isSplitPayment={isSplitPayment}
            splitPayments={splitPayments}
          />
        );
      default:
        return null;
    }
  };

  const change =
    paymentMethod === 'cash' ? Math.max(0, amountPaid - (total - discount)) : 0;

  return (
    <div className="bg-background animate-in slide-in-from-right flex h-full flex-col rounded-lg border shadow-lg duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={processing}
          >
            <IconX className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Payment Processing</h2>
            <p className="text-muted-foreground text-sm">
              Step {currentStep + 1} of {STEPS.length}:{' '}
              {STEPS[currentStep].title}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b px-4 py-2">
        <div className="flex gap-1">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex justify-between border-t p-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0 || processing}
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={handlePayment}
            disabled={!canProceed() || processing}
            className="min-w-32"
          >
            {processing ? (
              <>
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IconCheck className="mr-2 h-4 w-4" />
                Complete Payment
              </>
            )}
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={!canProceed() || processing}>
            Next
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step Components
function OrderSummaryStep({ items, subtotal, discount, total }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Order Summary</h3>
      <div className="space-y-3">
        {items.map((item: CartItem) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b py-2 last:border-b-0"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-muted-foreground text-sm">
                {item.quantity} × ₦{item.price.toLocaleString()}
              </p>
            </div>
            <div className="font-medium">
              ₦{(item.price * item.quantity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Discount:</span>
          <span>-₦{discount.toLocaleString()}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodStep({
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
  _splitPayments,
  _setSplitPayments,
}: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Method</h3>

      {/* Payment Options */}
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={isSplitPayment ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsSplitPayment(!isSplitPayment)}
          disabled={processing}
        >
          Split Payment
        </Button>
        {isSplitPayment && (
          <span className="text-muted-foreground text-sm">
            Total: ₦{(total - discount).toLocaleString()}
          </span>
        )}
      </div>

      {!isSplitPayment ? (
        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_METHODS.map(method => {
            const Icon = method.icon;
            return (
              <Button
                key={method.value}
                variant={paymentMethod === method.value ? 'default' : 'outline'}
                className="h-16 flex-col"
                onClick={() => setPaymentMethod(method.value)}
                disabled={processing}
              >
                <Icon className="mb-1 h-6 w-6" />
                <span className="text-sm">{method.label}</span>
              </Button>
            );
          })}
        </div>
      ) : (
        <SplitPaymentInterface
          splitPayments={_splitPayments}
          setSplitPayments={_setSplitPayments}
          total={total - discount}
          processing={processing}
        />
      )}

      {/* Amount Paid (for non-split payments) */}
      {!isSplitPayment && paymentMethod && (
        <div className="space-y-2">
          <Label htmlFor="amountPaid">Amount Paid (₦)</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            value={amountPaid}
            onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
            disabled={processing}
          />
          {paymentMethod === 'cash' && change > 0 && (
            <div className="bg-muted flex items-center justify-between rounded p-3">
              <span className="font-medium">Change Due:</span>
              <span className="text-lg font-bold">
                ₦{change.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomerInfoStep({
  customerInfo,
  onCustomerInfoChange,
  processing,
}: any) {
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [emailValidation, setEmailValidation] = useState<{
    checking: boolean;
    exists: boolean;
    message: string;
  }>({ checking: false, exists: false, message: '' });
  const [phoneValidation, setPhoneValidation] = useState<{
    checking: boolean;
    exists: boolean;
    message: string;
  }>({ checking: false, exists: false, message: '' });

  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: fetchCustomers,
    enabled: showCustomerSearch,
  });

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    // Update the parent component with the selected customer info
    onCustomerInfoChange({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email,
    });
    setShowCustomerSearch(false);
    setSearchTerm('');
  };

  const selectNewCustomer = () => {
    setSelectedCustomer(null);
    onCustomerInfoChange({ name: '', phone: '', email: '' });
    setShowCustomerSearch(false);
    setSearchTerm('');
    // Reset validation states
    setEmailValidation({ checking: false, exists: false, message: '' });
    setPhoneValidation({ checking: false, exists: false, message: '' });
  };

  // Function to check email uniqueness
  const checkEmailUniqueness = async (email: string) => {
    if (!email || email.length < 3) {
      setEmailValidation({ checking: false, exists: false, message: '' });
      return;
    }

    setEmailValidation({ checking: true, exists: false, message: '' });

    try {
      const response = await fetch('/api/pos/customers/check-unique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailValidation({
          checking: false,
          exists: data.exists,
          message: data.message,
        });
      } else {
        setEmailValidation({
          checking: false,
          exists: false,
          message: 'Failed to check email',
        });
      }
    } catch (_error) {
      setEmailValidation({
        checking: false,
        exists: false,
        message: 'Failed to check email',
      });
    }
  };

  // Function to check phone uniqueness
  const checkPhoneUniqueness = async (phone: string) => {
    if (!phone || phone.length < 5) {
      setPhoneValidation({ checking: false, exists: false, message: '' });
      return;
    }

    setPhoneValidation({ checking: true, exists: false, message: '' });

    try {
      const response = await fetch('/api/pos/customers/check-unique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setPhoneValidation({
          checking: false,
          exists: data.exists,
          message: data.message,
        });
      } else {
        setPhoneValidation({
          checking: false,
          exists: false,
          message: 'Failed to check phone',
        });
      }
    } catch (_error) {
      setPhoneValidation({
        checking: false,
        exists: false,
        message: 'Failed to check phone',
      });
    }
  };

  // Use customers directly since API handles filtering
  const filteredCustomers = customers;

  if (customersError) {
    toast.error('Failed to load customers');
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Customer Information (Optional)</h3>

      {/* Customer Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
            disabled={processing}
          >
            {showCustomerSearch ? 'Hide' : 'Search'} Existing Customers
          </Button>
          {customerInfo.name && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onCustomerInfoChange({ name: '', phone: '', email: '' })
              }
              disabled={processing}
            >
              Clear
            </Button>
          )}
        </div>

        {showCustomerSearch && (
          <div className="rounded-lg border p-4">
            <div className="mb-3">
              <div className="relative">
                <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {customersLoading ? (
              <div className="py-4 text-center">
                <IconLoader className="mx-auto mb-2 h-6 w-6 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Loading customers...
                </p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-4 text-center">
                <IconUser className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  {searchTerm
                    ? 'No customers found matching your search'
                    : 'No customers found'}
                </p>
              </div>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {/* New Customer Option */}
                <div
                  className="hover:bg-muted border-muted-foreground/30 flex cursor-pointer items-center justify-between rounded border-2 border-dashed p-2 transition-colors"
                  onClick={selectNewCustomer}
                >
                  <div className="flex-1">
                    <div className="text-primary font-medium">
                      + New Customer
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Create a new customer record
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    Select
                  </Button>
                </div>

                {/* Existing Customers */}
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={`${customer.id}-${index}`}
                    className="hover:bg-muted flex cursor-pointer items-center justify-between rounded p-2 transition-colors"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {customer.email}
                        {customer.phone && ` • ${customer.phone}`}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {customer.totalOrders} orders •{' '}
                        {customer.totalSpent.toLocaleString()} spent
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Information Display or Form */}
      {selectedCustomer ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-muted-foreground text-sm font-medium">
              Selected Customer
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectNewCustomer}
              disabled={processing}
            >
              Change Customer
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <div className="font-medium">{selectedCustomer.name}</div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <div className="text-sm">{selectedCustomer.email}</div>
            </div>

            {selectedCustomer.phone && (
              <div>
                <Label className="text-muted-foreground text-xs">Phone</Label>
                <div className="text-sm">{selectedCustomer.phone}</div>
              </div>
            )}

            <div className="text-muted-foreground text-xs">
              {selectedCustomer.totalOrders} orders •{' '}
              {selectedCustomer.totalSpent.toLocaleString()} spent
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="customerName">Name</Label>
            <Input
              id="customerName"
              value={customerInfo.name}
              onChange={e =>
                onCustomerInfoChange({
                  ...customerInfo,
                  name: e.target.value,
                })
              }
              disabled={processing}
            />
          </div>

          <div>
            <Label htmlFor="customerPhone">Phone</Label>
            <div className="relative">
              <Input
                id="customerPhone"
                type="tel"
                value={customerInfo.phone}
                onChange={e => {
                  const phone = e.target.value;
                  onCustomerInfoChange({
                    ...customerInfo,
                    phone,
                  });
                  // Check uniqueness after a delay
                  setTimeout(() => checkPhoneUniqueness(phone), 500);
                }}
                onBlur={() => checkPhoneUniqueness(customerInfo.phone)}
                disabled={processing}
                className={phoneValidation.exists ? 'border-red-500' : ''}
              />
              {phoneValidation.checking && (
                <IconLoader className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>
            {phoneValidation.message && (
              <p
                className={`mt-1 text-xs ${
                  phoneValidation.exists ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {phoneValidation.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="customerEmail">Email</Label>
            <div className="relative">
              <Input
                id="customerEmail"
                type="email"
                value={customerInfo.email}
                onChange={e => {
                  const email = e.target.value;
                  onCustomerInfoChange({
                    ...customerInfo,
                    email,
                  });
                  // Check uniqueness after a delay
                  setTimeout(() => checkEmailUniqueness(email), 500);
                }}
                onBlur={() => checkEmailUniqueness(customerInfo.email)}
                disabled={processing}
                className={emailValidation.exists ? 'border-red-500' : ''}
              />
              {emailValidation.checking && (
                <IconLoader className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>
            {emailValidation.message && (
              <p
                className={`mt-1 text-xs ${
                  emailValidation.exists ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {emailValidation.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  customerInfo,
  amountPaid,
  change,
  notes,
  setNotes,
  processing,
  isSplitPayment,
  splitPayments,
}: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review & Complete</h3>

      {/* Order Summary Section */}
      <div className="space-y-3">
        <h4 className="text-base font-medium">Order Summary</h4>
        {items.map((item: CartItem) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b py-2 last:border-b-0"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-muted-foreground text-sm">
                {item.quantity} × ₦{item.price.toLocaleString()}
              </p>
            </div>
            <div className="font-medium">
              ₦{(item.price * item.quantity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Discount:</span>
          <span>-₦{discount.toLocaleString()}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="space-y-3">
        <h4 className="text-base font-medium">Payment Details</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span>{isSplitPayment ? 'Split Payment' : paymentMethod}</span>
          </div>
          {!isSplitPayment && (
            <>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>₦{amountPaid.toLocaleString()}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>₦{change.toLocaleString()}</span>
                </div>
              )}
            </>
          )}
          {isSplitPayment && (
            <div className="space-y-2">
              {splitPayments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between">
                  <span>{payment.method}:</span>
                  <span>₦{payment.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Information Section */}
      {customerInfo.name && (
        <div className="space-y-3">
          <h4 className="text-base font-medium">Customer Information</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Name:</span>
              <span>{customerInfo.name}</span>
            </div>
            {customerInfo.phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{customerInfo.phone}</span>
              </div>
            )}
            {customerInfo.email && (
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{customerInfo.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={processing}
          rows={3}
        />
      </div>
    </div>
  );
}

function SplitPaymentInterface({
  splitPayments,
  setSplitPayments,
  total,
  processing,
}: {
  splitPayments: Array<{ id: string; amount: number; method: string }>;
  setSplitPayments: (
    _payments: Array<{ id: string; amount: number; method: string }>
  ) => void;
  total: number;
  processing: boolean;
}) {
  const addPayment = () => {
    const newPayment = {
      id: Date.now().toString(),
      amount: 0,
      method: 'cash',
    };
    setSplitPayments([...splitPayments, newPayment]);
  };

  const removePayment = (id: string) => {
    setSplitPayments(splitPayments.filter(p => p.id !== id));
  };

  const updatePayment = (
    id: string,
    field: 'amount' | 'method',
    value: string | number
  ) => {
    setSplitPayments(
      splitPayments.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Split Payments</span>
        <span className="text-muted-foreground text-sm">
          Total: ₦{total.toLocaleString()}
        </span>
      </div>

      <div className="space-y-3">
        {splitPayments.map(payment => (
          <Card key={payment.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor={`amount-${payment.id}`}>Amount (₦)</Label>
                  <Input
                    id={`amount-${payment.id}`}
                    type="number"
                    step="0.01"
                    value={payment.amount || ''}
                    onChange={e =>
                      updatePayment(
                        payment.id,
                        'amount',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={processing}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`method-${payment.id}`}>Method</Label>
                  <select
                    id={`method-${payment.id}`}
                    value={payment.method}
                    onChange={e =>
                      updatePayment(payment.id, 'method', e.target.value)
                    }
                    disabled={processing}
                    className="w-full rounded-md border p-2"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePayment(payment.id)}
                  disabled={processing}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addPayment}
          disabled={processing}
          className="w-full"
        >
          Add Payment Method
        </Button>
      </div>

      <div className="bg-muted rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span>Total Paid:</span>
          <span>₦{totalPaid.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Remaining:</span>
          <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
            ₦{remaining.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
