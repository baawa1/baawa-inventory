'use client';

import React, { useState, useEffect } from 'react';
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
  IconMail,
  IconPrinter,
  IconCoins,
} from '@tabler/icons-react';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { DiscountStep } from './payment/DiscountStep';
import { CustomFeesStep } from './payment/CustomFeesStep';
import { EnhancedCustomerInfoStep } from './payment/EnhancedCustomerInfoStep';
import { CouponDisplay } from './payment/CouponDisplay';
import { useQuery } from '@tanstack/react-query';
import {
  calculateDiscountAmount,
  validatePaymentAmount,
  validateSplitPayments,
  calculateChange,
} from '@/lib/utils/calculations';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type {
  CartItem,
  Sale,
  CouponData,
  CustomerInfo,
  TransactionFee,
  SplitPayment,
  Customer,
  CustomerApiResponse,
  SaleApiResponse,
  OrderSummaryStepProps,
  PaymentMethodStepProps,
  CustomerInfoStepProps,
  ReviewStepProps,
  SplitPaymentInterfaceProps,
  ApiError,
  ValidationError,
} from '@/types/pos';

interface SlidingPaymentInterfaceProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  fees: TransactionFee[];
  total: number;
  customerInfo: CustomerInfo;
  staffName: string;
  onPaymentSuccess: (_sale: Sale) => void;
  onCancel: () => void;
  onDiscountChange: (_discount: number) => void;
  onFeesChange: (_fees: TransactionFee[]) => void;
  onCustomerInfoChange: (_info: CustomerInfo) => void;
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
  { id: 'custom-fees', title: 'Custom Fees', icon: IconCoins },
  { id: 'payment-method', title: 'Payment Method', icon: IconCreditCard },
  { id: 'customer-info', title: 'Customer Info', icon: IconUser },
  { id: 'review', title: 'Review & Complete', icon: IconCheck },
  { id: 'receipt', title: 'Receipt', icon: IconReceipt },
];

// API function to fetch customers
async function fetchCustomers({
  queryKey,
}: {
  queryKey: string[];
}): Promise<Customer[]> {
  const searchQuery = queryKey[1]; // The search term is the second element in the query key
  const url = searchQuery
    ? `/api/pos/customers?search=${encodeURIComponent(searchQuery)}`
    : '/api/pos/customers';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  const data: CustomerApiResponse = await response.json();
  return data.data || [];
}

// Helper function to check if we should search for phone
const shouldSearchPhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 7;
};

// Helper function to check if we should search for email
const shouldSearchEmail = (email: string): boolean => {
  return email.length >= 5 && email.includes('@');
};

export function SlidingPaymentInterface({
  items,
  subtotal,
  discount,
  fees,
  total,
  customerInfo,
  staffName,
  onPaymentSuccess,
  onCancel,
  onDiscountChange,
  onFeesChange,
  onCustomerInfoChange,
}: SlidingPaymentInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    'percentage'
  );
  const [discountValue, setDiscountValue] = useState(discount);
  const [paymentMethod, setPaymentMethodState] = useState('');
  const [amountPaid, setAmountPaid] = useState(total);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<
    Array<{ id: string; amount: number; method: string }>
  >([]);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [localFees, setLocalFees] = useState(fees);

  const { handleError } = usePOSErrorHandler();

  // Custom setPaymentMethod that also updates amountPaid to the discounted total
  const setPaymentMethod = (method: string) => {
    setPaymentMethodState(method);
    // Auto-fill amount paid with the discounted total when payment method is selected
    setAmountPaid(total);
  };

  // Update amountPaid when total changes (due to discounts/coupons) if payment method is selected
  useEffect(() => {
    if (paymentMethod) {
      setAmountPaid(total);
    }
  }, [total, paymentMethod]);

  const handleDiscountChange = (value: number) => {
    setDiscountValue(value);
    const calculatedDiscount = calculateDiscountAmount(
      subtotal,
      value,
      discountType
    );

    // Only apply manual discount if no coupon is applied
    if (!appliedCoupon) {
      onDiscountChange(calculatedDiscount);
    }
  };

  const handleDiscountTypeChange = (newType: 'percentage' | 'fixed') => {
    setDiscountType(newType);
    // Reset discount value when switching types
    setDiscountValue(0);

    // Only update discount if no coupon is applied
    if (!appliedCoupon) {
      onDiscountChange(0);
    }
  };

  // Handle coupon change
  const handleCouponChange = (
    _coupon: CouponData | null,
    _discountAmount: number
  ) => {
    // Log coupon change for debugging
    logger.info('Coupon change processed', {
      couponId: _coupon?.id,
      discountAmount: _discountAmount,
    });
    setAppliedCoupon(_coupon);
    setCouponDiscount(_discountAmount);

    if (_coupon) {
      // If coupon is applied, reset manual discount and use only coupon discount
      setDiscountValue(0);
      onDiscountChange(_discountAmount);
    } else {
      // If coupon is removed, reset coupon discount and restore manual discount if any
      setCouponDiscount(0);
      const manualDiscount =
        discountValue > 0
          ? calculateDiscountAmount(subtotal, discountValue, discountType)
          : 0;
      onDiscountChange(manualDiscount);
    }
  };

  const handlePayment = async () => {
    if (isSplitPayment) {
      const validation = validateSplitPayments(splitPayments, total);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid split payment');
        return;
      }
    } else {
      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }

      const validation = validatePaymentAmount(
        amountPaid,
        total,
        paymentMethod
      );
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid payment amount');
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
          couponId: appliedCoupon?.id, // Add coupon ID to all items
        })),
        subtotal,
        discount,
        fees: localFees, // Include fees in the sale data
        total,
        paymentMethod: isSplitPayment ? 'split' : paymentMethod,
        // Send customerInfo object for proper customer processing
        customerInfo:
          customerInfo.name || customerInfo.email || customerInfo.phone
            ? {
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone,
                billingAddress: customerInfo.billingAddress,
                shippingAddress: customerInfo.shippingAddress,
                city: customerInfo.city,
                state: customerInfo.state,
                postalCode: customerInfo.postalCode,
                country: customerInfo.country,
                customerType: customerInfo.customerType,
                notes: customerInfo.notes,
              }
            : undefined,
        // Legacy fields for backward compatibility
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        amountPaid: isSplitPayment
          ? splitPayments.reduce((sum, p) => sum + p.amount, 0)
          : amountPaid,
        notes: notes || undefined,
        splitPayments: isSplitPayment ? splitPayments : undefined,
      };

      // Debug logging
      logger.info('Sale data being sent', {
        itemCount: saleData.items.length,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod,
      });

      const response = await fetch('/api/pos/create-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);

        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }

        throw new Error(errorData.error || 'Failed to process payment');
      }

      const result = await response.json();

      const sale: Sale = {
        id: result.saleId,
        items,
        subtotal,
        discount,
        fees: localFees.map(fee => ({
          type: fee.feeType,
          description: fee.description,
          amount: fee.amount,
        })),
        total,
        paymentMethod: isSplitPayment ? 'split' : paymentMethod,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        staffName,
        timestamp: new Date(),
        notes: notes || undefined,
        splitPayments: isSplitPayment
          ? splitPayments.map(payment => ({
              ...payment,
              createdAt: new Date(),
            }))
          : undefined,
      };

      setCompletedSale(sale);
      setCurrentStep(6); // Move to receipt step

      // Show success message with email status
      if (result.emailSent && customerInfo.email) {
        toast.success(
          'Payment processed successfully! Email receipt sent to customer.'
        );
      } else if (customerInfo.email) {
        toast.success(
          'Payment processed successfully! (Email receipt failed to send)'
        );
      } else {
        toast.success('Payment processed successfully!');
      }
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
      case 2: // Custom Fees - always can proceed
        return true;
      case 3: // Payment Method
        if (isSplitPayment) {
          const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
          return splitPayments.length > 0 && totalPaid > 0;
        }
        return paymentMethod !== '';
      case 4: // Customer Info - always can proceed
        return true;
      case 5: // Review - always can proceed
        return true;
      case 6: // Receipt - always can proceed
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
            fees={localFees}
            total={total}
            _appliedCoupon={appliedCoupon}
            couponDiscount={couponDiscount}
          />
        );
      case 1:
        return (
          <div className="space-y-6">
            <CouponDisplay
              subtotal={subtotal}
              processing={processing}
              appliedCoupon={appliedCoupon}
              onCouponChange={handleCouponChange}
            />
            <DiscountStep
              discountType={discountType}
              setDiscountType={handleDiscountTypeChange}
              discountValue={discountValue}
              handleDiscountChange={handleDiscountChange}
              subtotal={subtotal}
              processing={processing}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              currentTotalDiscount={discount}
            />
          </div>
        );
      case 2:
        return (
          <CustomFeesStep
            fees={localFees}
            onFeesChange={updatedFees => {
              setLocalFees(updatedFees);
              onFeesChange(updatedFees);
            }}
            processing={processing}
            subtotal={subtotal - discount - couponDiscount}
          />
        );
      case 3:
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
      case 4:
        return (
          <EnhancedCustomerInfoStep
            customerInfo={customerInfo}
            onCustomerInfoChange={onCustomerInfoChange}
            processing={processing}
          />
        );
      case 5:
        return (
          <ReviewStep
            items={items}
            subtotal={subtotal}
            discount={discount}
            fees={localFees}
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
            couponDiscount={couponDiscount}
          />
        );
      case 6:
        return <ReceiptStep sale={completedSale} />;
      default:
        return null;
    }
  };

  const change =
    paymentMethod === 'cash' ? calculateChange(amountPaid, total) : 0;

  return (
    <div className="bg-background animate-in slide-in-from-right flex h-full flex-col rounded-lg border shadow-lg duration-300 lg:rounded-lg lg:border lg:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={processing}
            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
          >
            <IconX className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-semibold">Payment Processing</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Step {currentStep + 1} of {STEPS.length}:{' '}
              <span className="hidden xs:inline">{STEPS[currentStep].title}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b px-3 py-2 sm:px-4">
        <div className="flex gap-1">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => {
                // Prevent clicking on receipt step (index 6) unless we're already there
                if (index === 6 && currentStep !== 6) {
                  return;
                }
                // Prevent clicking on any step when we're on receipt step
                if (currentStep === 6) {
                  return;
                }
                setCurrentStep(index);
              }}
              disabled={currentStep === 6 || (index === 6 && currentStep !== 6)}
              className={`h-2 sm:h-2 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              } ${currentStep === 6 || (index === 6 && currentStep !== 6) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex justify-between border-t p-3 sm:p-4">
        {currentStep !== 5 && (
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0 || processing}
            className="h-11 sm:h-10"
          >
            <IconArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Previous</span>
          </Button>
        )}

        {currentStep === 5 ? (
          <Button
            onClick={handlePayment}
            disabled={!canProceed() || processing}
            className="min-w-24 sm:min-w-32 h-11 sm:h-10 flex-1 sm:flex-none ml-2 sm:ml-0"
          >
            {processing ? (
              <>
                <IconLoader className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                <span className="hidden xs:inline">Processing...</span>
                <span className="xs:hidden">...</span>
              </>
            ) : (
              <>
                <IconCheck className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Complete Payment</span>
                <span className="xs:hidden">Pay</span>
              </>
            )}
          </Button>
        ) : currentStep === 6 ? (
          <div className="ml-auto flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onCancel} className="min-w-16 sm:min-w-32 flex-1 sm:flex-none h-11 sm:h-10">
              <IconX className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Close</span>
            </Button>
            <Button
              onClick={() => {
                onPaymentSuccess(completedSale!);
                onCancel();
              }}
              className="min-w-16 sm:min-w-32 flex-1 sm:flex-none h-11 sm:h-10"
            >
              <IconCash className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">New Sale</span>
              <span className="xs:hidden">New</span>
            </Button>
          </div>
        ) : (
          <Button 
            onClick={nextStep} 
            disabled={!canProceed() || processing}
            className="h-11 sm:h-10 flex-1 sm:flex-none ml-2 sm:ml-0"
          >
            <span className="hidden xs:inline">Next</span>
            <IconArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step Components
function OrderSummaryStep({
  items,
  subtotal,
  discount,
  fees,
  total,
  _appliedCoupon,
  couponDiscount,
}: OrderSummaryStepProps) {
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
                {item.quantity} × {formatCurrency(item.price)}
              </p>
            </div>
            <div className="font-medium">
              {formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {/* Show coupon discount if applied */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Coupon Discount</span>
            <span>-{formatCurrency(couponDiscount)}</span>
          </div>
        )}

        {/* Show manual discount if there's additional discount beyond coupon */}
        {Math.max(0, discount - couponDiscount) > 0 && (
          <div className="flex justify-between text-blue-600">
            <span>Manual Discount</span>
            <span>
              -{formatCurrency(Math.max(0, discount - couponDiscount))}
            </span>
          </div>
        )}

        {/* Custom Fees */}
        {fees && fees.length > 0 && (
          <>
            {fees.map((fee: TransactionFee, index: number) => (
              <div key={index} className="flex justify-between text-orange-600">
                <span>
                  {fee.feeType}
                  {fee.description ? ` (${fee.description})` : ''}:
                </span>
                <span>+{formatCurrency(fee.amount)}</span>
              </div>
            ))}
          </>
        )}

        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
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
  change,
  processing,
  isSplitPayment,
  setIsSplitPayment,
  _splitPayments,
  _setSplitPayments,
}: PaymentMethodStepProps) {
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
      </div>

      {/* Total Amount Display */}
      <div className="bg-muted mb-4 flex items-center justify-between rounded p-3">
        <span className="font-medium">Total Amount:</span>
        <span className="text-primary text-lg font-bold">
          ₦{total.toLocaleString()}
        </span>
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
          total={total}
          processing={processing}
        />
      )}

      {/* Payment Amounts (for non-split payments) */}
      {!isSplitPayment && paymentMethod && (
        <div className="space-y-4">
          {/* Amount Paid Input */}
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
          </div>

          {/* Change Due */}
          {paymentMethod === 'cash' && change > 0 && (
            <div className="bg-muted flex items-center justify-between rounded p-3">
              <span className="font-medium">Change Due:</span>
              <span className="text-lg font-bold text-green-600">
                ₦{change.toLocaleString()}
              </span>
            </div>
          )}

          {/* Insufficient Payment Warning */}
          {paymentMethod === 'cash' && amountPaid < total && (
            <div className="bg-destructive/10 border-destructive/20 flex items-center justify-between rounded border p-3">
              <span className="text-destructive font-medium">
                Insufficient Payment:
              </span>
              <span className="text-destructive text-lg font-bold">
                ₦{(total - amountPaid).toLocaleString()}
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
}: CustomerInfoStepProps) {
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
  const [autoSearchResults, setAutoSearchResults] = useState<any[]>([]);
  const [showAutoSearch, setShowAutoSearch] = useState(false);

  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: fetchCustomers,
    enabled: showCustomerSearch && searchTerm.length > 0,
  });

  // Auto-search for phone numbers
  const autoSearchPhone = async (phone: string) => {
    if (!shouldSearchPhone(phone)) {
      setAutoSearchResults([]);
      setShowAutoSearch(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/pos/customers?search=${encodeURIComponent(phone)}`
      );
      if (response.ok) {
        const results = await response.json();
        setAutoSearchResults(results);
        setShowAutoSearch(results.length > 0);
      }
    } catch (error) {
      console.error('Auto-search error:', error);
    }
  };

  // Auto-search for emails
  const autoSearchEmail = async (email: string) => {
    if (!shouldSearchEmail(email)) {
      setAutoSearchResults([]);
      setShowAutoSearch(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/pos/customers?search=${encodeURIComponent(email)}`
      );
      if (response.ok) {
        const results = await response.json();
        setAutoSearchResults(results);
        setShowAutoSearch(results.length > 0);
      }
    } catch (error) {
      console.error('Auto-search error:', error);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Update the parent component with the selected customer info
    onCustomerInfoChange({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email,
    });
    setShowCustomerSearch(false);
    setShowAutoSearch(false);
    setSearchTerm('');
    setAutoSearchResults([]);
    // Reset validation states
    setEmailValidation({ checking: false, exists: false, message: '' });
    setPhoneValidation({ checking: false, exists: false, message: '' });
  };

  const selectNewCustomer = () => {
    setSelectedCustomer(null);
    onCustomerInfoChange({ name: '', phone: '', email: '' });
    setShowCustomerSearch(false);
    setShowAutoSearch(false);
    setSearchTerm('');
    setAutoSearchResults([]);
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

        // If there are partial matches, show them in auto-search
        if (data.hasPartialMatches && data.customers.length > 0) {
          setAutoSearchResults(data.customers);
          setShowAutoSearch(true);
        }
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

        // If there are partial matches, show them in auto-search
        if (data.hasPartialMatches && data.customers.length > 0) {
          setAutoSearchResults(data.customers);
          setShowAutoSearch(true);
        }
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
                {filteredCustomers.map((customer, index) => {
                  const isStaff = customer.type === 'user';

                  return (
                    <div
                      key={`${customer.id}-${index}`}
                      className={`hover:bg-muted flex cursor-pointer items-center justify-between rounded p-2 transition-colors ${
                        isStaff ? 'border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{customer.name}</div>
                          {isStaff && (
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                              Staff
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {customer.email}
                          {customer.phone && ` • ${customer.phone}`}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {isStaff
                            ? `Staff Member • ${customer.role}`
                            : `${customer.totalOrders || 0} orders • ${(customer.totalSpent || 0).toLocaleString()} spent`}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Select
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Auto-search Results */}
        {showAutoSearch && autoSearchResults.length > 0 && (
          <div className="rounded-lg border border-gray-600 bg-black p-4">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-white" />
                <h4 className="text-sm font-medium text-white">
                  Found Existing Customer
                  {autoSearchResults.length > 1 ? 's' : ''}
                </h4>
              </div>
              <p className="text-xs text-gray-400">
                We found customer{autoSearchResults.length > 1 ? 's' : ''} with
                similar information. Select one or continue as new customer.
              </p>
            </div>

            <div className="max-h-32 space-y-2 overflow-y-auto">
              {/* Continue as New Customer */}
              <div
                className="flex cursor-pointer items-center justify-between rounded border border-gray-600 bg-black p-2 transition-colors hover:bg-gray-900"
                onClick={selectNewCustomer}
              >
                <div className="flex-1">
                  <div className="font-medium text-white">
                    Continue as New Customer
                  </div>
                  <div className="text-xs text-gray-400">
                    Create a new customer record
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-gray-800"
                >
                  Continue
                </Button>
              </div>

              {/* Existing Customers */}
              {autoSearchResults.map((customer, index) => {
                // Check if this is an exact match for current input
                const isExactEmailMatch =
                  customerInfo.email &&
                  customer.email.toLowerCase() ===
                    customerInfo.email.toLowerCase();
                const isExactPhoneMatch =
                  customerInfo.phone &&
                  (customer.phone === customerInfo.phone ||
                    customer.phone?.replace(/\D/g, '') ===
                      customerInfo.phone.replace(/\D/g, ''));

                const isExactMatch = isExactEmailMatch || isExactPhoneMatch;

                return (
                  <div
                    key={`auto-${customer.id}-${index}`}
                    className={`flex cursor-pointer items-center justify-between rounded border p-2 transition-colors hover:bg-gray-900 ${
                      isExactMatch
                        ? 'border-red-500 bg-red-900/20'
                        : 'border-gray-600 bg-black'
                    }`}
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-white">
                          {customer.name}
                        </div>
                        {isExactMatch && (
                          <span className="rounded-full border border-red-500 bg-red-900/50 px-2 py-1 text-xs text-red-300">
                            Exact Match
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {customer.email}
                        {customer.phone && ` • ${customer.phone}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.totalOrders} orders •{' '}
                        {customer.totalSpent.toLocaleString()} spent
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-gray-800"
                    >
                      Select
                    </Button>
                  </div>
                );
              })}
            </div>
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
                  // Auto-search when phone has 7+ digits
                  if (shouldSearchPhone(phone)) {
                    autoSearchPhone(phone);
                  } else {
                    setShowAutoSearch(false);
                    setAutoSearchResults([]);
                  }
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
            {phoneValidation.exists && (
              <p className="mt-1 text-xs font-medium text-red-600">
                ⚠️ This phone number is already registered. Please select the
                existing customer or use a different number.
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
                  // Auto-search when email has sufficient characters
                  if (shouldSearchEmail(email)) {
                    autoSearchEmail(email);
                  } else {
                    setShowAutoSearch(false);
                    setAutoSearchResults([]);
                  }
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
            {emailValidation.exists && (
              <p className="mt-1 text-xs font-medium text-red-600">
                ⚠️ This email is already registered. Please select the existing
                customer or use a different email.
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
  fees,
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
  couponDiscount,
}: ReviewStepProps) {
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
                {item.quantity} × {formatCurrency(item.price)}
              </p>
            </div>
            <div className="font-medium">
              {formatCurrency(item.price * item.quantity)}
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

        {/* Show detailed discount breakdown */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Coupon Discount:</span>
            <span>-₦{couponDiscount.toLocaleString()}</span>
          </div>
        )}

        {Math.max(0, discount - couponDiscount) > 0 && (
          <div className="flex justify-between text-blue-600">
            <span>Manual Discount:</span>
            <span>
              -₦{Math.max(0, discount - couponDiscount).toLocaleString()}
            </span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Total Discount:</span>
            <span>-₦{discount.toLocaleString()}</span>
          </div>
        )}

        {/* Custom Fees */}
        {fees && fees.length > 0 && (
          <>
            {fees.map((fee: TransactionFee, index: number) => (
              <div key={index} className="flex justify-between text-orange-600">
                <span>
                  {fee.feeType}
                  {fee.description ? ` (${fee.description})` : ''}:
                </span>
                <span>+₦{fee.amount.toLocaleString()}</span>
              </div>
            ))}
          </>
        )}

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
              {splitPayments.map((payment: SplitPayment) => (
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
}: SplitPaymentInterfaceProps) {
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

function ReceiptStep({ sale }: { sale: Sale | null }) {
  if (!sale) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No sale data available</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const PAYMENT_METHOD_ICONS = {
    cash: IconCash,
    pos: IconCreditCard,
    bank_transfer: IconBuilding,
    mobile_money: IconWallet,
    split: IconWallet,
  };

  const PAYMENT_METHOD_LABELS = {
    cash: 'Cash',
    pos: 'POS Machine',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    split: 'Split Payment',
  };

  const _PaymentIcon =
    PAYMENT_METHOD_ICONS[
      sale.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS
    ] || IconCash;
  const paymentLabel =
    PAYMENT_METHOD_LABELS[
      sale.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
    ] || 'Cash';

  // Print receipt
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${sale.id}</title>
          <style>
            body { font-family: monospace; font-size: 12px; line-height: 1.4; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .store-name { font-size: 18px; font-weight: bold; }
            .receipt-details { margin-bottom: 20px; }
            .items { margin-bottom: 20px; }
            .item { margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
            .item-name { font-weight: bold; }
            .item-details { color: #666; font-size: 11px; }
            .totals { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; }
            .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .grand-total { font-weight: bold; font-size: 14px; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">BaaWA ACCESSORIES</div>
            <div>Quality Accessories Store</div>
            <div>Receipt #${sale.id}</div>
          </div>
          
          <div class="receipt-details">
            <div><strong>Date:</strong> ${formatDate(sale.timestamp)}</div>
            <div><strong>Time:</strong> ${formatTime(sale.timestamp)}</div>
            <div><strong>Staff:</strong> ${sale.staffName}</div>
            <div><strong>Payment:</strong> ${paymentLabel}</div>
            
            ${sale.customerName ? `<div><strong>Customer:</strong> ${sale.customerName}</div>` : ''}
            ${sale.customerPhone ? `<div><strong>Phone:</strong> ${sale.customerPhone}</div>` : ''}
            ${sale.customerEmail ? `<div><strong>Email:</strong> ${sale.customerEmail}</div>` : ''}
          </div>
          
          <div class="items">
            ${sale.items
              .map(
                item => `
              <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">SKU: ${item.sku} | ${item.category || 'N/A'}</div>
                <div class="total-line">
                  <span>${item.quantity} × ${formatCurrency(item.price)}</span>
                  <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            <div class="total-line">
              <span>Discount:</span>
              <span>-${formatCurrency(sale.discount)}</span>
            </div>
            <div class="total-line grand-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(sale.total)}</span>
            </div>
            ${
              sale.paymentMethod === 'split' &&
              sale.splitPayments &&
              sale.splitPayments.length > 0
                ? `
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">
              <div style="font-weight: bold; margin-bottom: 8px;">Payment Details:</div>
              ${sale.splitPayments
                .map(
                  payment => `
                <div class="total-line" style="font-size: 11px;">
                  <span>${payment.method}:</span>
                  <span>${formatCurrency(payment.amount)}</span>
                </div>
              `
                )
                .join('')}
            </div>
            `
                : ''
            }
          </div>
          
          <div class="footer">
            <div>Thank you for shopping with us!</div>
            <div>Visit us again soon</div>
            <div style="margin-top: 20px;">.</div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      toast.success('Receipt sent to printer');
    }
  };

  // Thermal printer receipt (placeholder for future implementation)
  const handleThermalPrint = async () => {
    try {
      // Placeholder for future thermal printer implementation
      toast.info(
        'Thermal printer functionality has been removed. Use standard print for now.'
      );

      // For now, just show a message that thermal printing is not available
      setTimeout(() => {
        toast.success(
          'Thermal printer functionality removed - use standard print'
        );
      }, 1000);
    } catch (_error) {
      toast.error('Thermal printer functionality removed');
    }
  };

  // Email receipt
  const handleEmailReceipt = async () => {
    if (!sale.customerEmail) {
      toast.error('No customer email available');
      return;
    }

    try {
      const response = await fetch('/api/pos/email-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: sale.id,
          customerEmail: sale.customerEmail,
          customerName: sale.customerName,
          receiptData: {
            items: sale.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
            paymentMethod: sale.paymentMethod,
            timestamp: sale.timestamp.toISOString(),
            staffName: sale.staffName,
          },
        }),
      });

      if (response.ok) {
        toast.success('Receipt sent successfully!');
      } else {
        toast.error('Failed to send receipt');
      }
    } catch (_error) {
      toast.error('Failed to send receipt');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <IconCheck className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-600">
          Payment Successful!
        </h2>
        <p className="text-muted-foreground">
          Transaction completed on {formatDate(sale.timestamp)} at{' '}
          {formatTime(sale.timestamp)}
        </p>
      </div>

      {/* Sale Details */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Sale Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction ID:</span>
            <span className="font-medium">{sale.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Staff:</span>
            <span className="font-medium">{sale.staffName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-medium">{paymentLabel}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      {(sale.customerName || sale.customerPhone || sale.customerEmail) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Customer Information</h3>
          <div className="space-y-2">
            {sale.customerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{sale.customerName}</span>
              </div>
            )}
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{sale.customerPhone}</span>
              </div>
            )}
            {sale.customerEmail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{sale.customerEmail}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Items</h3>
        <div className="space-y-3">
          {sale.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b py-2 last:border-b-0"
            >
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground text-sm">
                  {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}

        {/* Custom Fees */}
        {sale.fees && sale.fees.length > 0 && (
          <>
            {sale.fees.map((fee, index: number) => (
              <div key={index} className="flex justify-between text-orange-600">
                <span>
                  {fee.type}
                  {fee.description ? ` (${fee.description})` : ''}:
                </span>
                <span>+{formatCurrency(fee.amount)}</span>
              </div>
            ))}
          </>
        )}

        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>

        {/* Split Payment Details */}
        {sale.paymentMethod === 'split' &&
          sale.splitPayments &&
          sale.splitPayments.length > 0 && (
            <div className="mt-4 space-y-2 rounded-lg border bg-gray-50 p-3">
              <h4 className="text-sm font-semibold">Payment Details:</h4>
              {sale.splitPayments.map((payment, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {payment.method}:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Notes</h3>
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-muted-foreground text-sm">{sale.notes}</p>
          </div>
        </div>
      )}

      {/* Printer Actions */}
      <div className="flex gap-3 pt-4">
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          <IconPrinter className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button
          onClick={handleThermalPrint}
          variant="outline"
          className="flex-1"
        >
          <IconPrinter className="mr-2 h-4 w-4" />
          Thermal Printer
        </Button>
        {sale.customerEmail && (
          <Button
            onClick={handleEmailReceipt}
            variant="outline"
            className="flex-1"
          >
            <IconMail className="mr-2 h-4 w-4" />
            Email
          </Button>
        )}
      </div>
    </div>
  );
}
