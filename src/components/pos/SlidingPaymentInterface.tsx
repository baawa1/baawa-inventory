"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  IconCash,
  IconCreditCard,
  IconBuilding,
  IconWallet,
  IconPercentage,
  IconMinus,
  IconUser,
  IconReceipt,
  IconLoader,
  IconArrowLeft,
  IconArrowRight,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { usePOSErrorHandler } from "./POSErrorBoundary";
import { formatCurrency } from "@/lib/utils";
import { ALL_PAYMENT_METHODS, VALIDATION_RULES } from "@/lib/constants";

// Validation schemas
const discountSchema = z.object({
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0).max(100),
});

const customerInfoSchema = z.object({
  name: z.string().max(VALIDATION_RULES.MAX_NAME_LENGTH).optional(),
  phone: z.string().max(VALIDATION_RULES.MAX_PHONE_LENGTH).optional(),
  email: z
    .string()
    .email()
    .max(VALIDATION_RULES.MAX_EMAIL_LENGTH)
    .optional()
    .or(z.literal("")),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(ALL_PAYMENT_METHODS as [string, ...string[]]),
  amountPaid: z.number().positive().optional(),
  notes: z.string().max(VALIDATION_RULES.MAX_DESCRIPTION_LENGTH).optional(),
});

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
  onPaymentSuccess: (sale: Sale) => void;
  onCancel: () => void;
  onDiscountChange: (discount: number) => void;
  onCustomerInfoChange: (info: {
    name: string;
    phone: string;
    email: string;
  }) => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: IconCash },
  { value: "pos", label: "POS Machine", icon: IconCreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: IconBuilding },
  { value: "mobile_money", label: "Mobile Money", icon: IconWallet },
];

const STEPS = [
  { id: "order-summary", title: "Order Summary", icon: IconReceipt },
  { id: "discount", title: "Discount", icon: IconPercentage },
  { id: "payment-method", title: "Payment Method", icon: IconCreditCard },
  { id: "customer-info", title: "Customer Info", icon: IconUser },
  { id: "review", title: "Review & Complete", icon: IconCheck },
];

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
  const { handleError } = usePOSErrorHandler();
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(total);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<
    Array<{
      id: string;
      amount: number;
      method: string;
    }>
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Validation helper functions
  const validateDiscountInput = (
    type: "percentage" | "fixed",
    value: number
  ) => {
    try {
      discountSchema.parse({ type, value });
      setValidationErrors((prev) => ({ ...prev, discount: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors((prev) => ({
          ...prev,
          discount: error.errors[0]?.message || "Invalid discount value",
        }));
      }
      return false;
    }
  };

  const validateCustomerInfo = (info: typeof customerInfo) => {
    try {
      customerInfoSchema.parse(info);
      setValidationErrors((prev) => ({ ...prev, customer: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors((prev) => ({
          ...prev,
          customer: error.errors[0]?.message || "Invalid customer information",
        }));
      }
      return false;
    }
  };

  const validatePaymentData = (
    method: string,
    amount?: number,
    notes?: string
  ) => {
    try {
      paymentSchema.parse({
        paymentMethod: method,
        amountPaid: amount,
        notes: notes,
      });
      setValidationErrors((prev) => ({ ...prev, payment: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors((prev) => ({
          ...prev,
          payment: error.errors[0]?.message || "Invalid payment information",
        }));
      }
      return false;
    }
  };

  // Handle discount change with validation
  const handleDiscountChange = (value: number) => {
    if (!validateDiscountInput(discountType, value)) {
      return;
    }

    setDiscountValue(value);
    if (discountType === "percentage") {
      const calculatedDiscount = (subtotal * value) / 100;
      onDiscountChange(Math.min(calculatedDiscount, subtotal));
    } else {
      onDiscountChange(Math.min(value, subtotal));
    }
  };

  // Handle customer info change with validation
  const handleCustomerInfoChange = (field: string, value: string) => {
    const newInfo = { ...customerInfo, [field]: value };
    if (validateCustomerInfo(newInfo)) {
      onCustomerInfoChange(newInfo);
    }
  };

  // Handle discount type change
  const handleDiscountTypeChange = (newType: "percentage" | "fixed") => {
    setDiscountType(newType);

    // Convert current discount value to the new type
    if (newType === "percentage") {
      // Convert from fixed amount to percentage
      if (discount > 0 && subtotal > 0) {
        const percentage = (discount / subtotal) * 100;
        setDiscountValue(Math.round(percentage * 100) / 100); // Round to 2 decimal places
      } else {
        setDiscountValue(0);
      }
    } else {
      // Convert from percentage to fixed amount
      if (discountValue > 0 && subtotal > 0) {
        const fixedAmount = (subtotal * discountValue) / 100;
        setDiscountValue(Math.round(fixedAmount * 100) / 100); // Round to 2 decimal places
      } else {
        setDiscountValue(discount);
      }
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (isSplitPayment) {
      const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid < total) {
        toast.error("Insufficient payment amount");
        return;
      }
    } else {
      if (!paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }

      if (paymentMethod === "cash" && amountPaid < total) {
        toast.error("Insufficient payment amount");
        return;
      }
    }

    setProcessing(true);

    try {
      // Create sales transaction
      const saleData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal,
        discount,
        total,
        paymentMethod,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        amountPaid,
        notes: notes || undefined,
      };

      const response = await fetch("/api/pos/create-sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment");
      }

      const result = await response.json();

      const sale: Sale = {
        id: result.saleId,
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        staffName,
        timestamp: new Date(),
      };

      toast.success("Payment processed successfully!");
      onPaymentSuccess(sale);
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
      handleError(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setProcessing(false);
    }
  };

  const change = paymentMethod === "cash" ? Math.max(0, amountPaid - total) : 0;

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
        return paymentMethod !== "";
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
            discount={discount}
            _subtotal={subtotal}
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
            subtotal={subtotal}
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

  return (
    <div className="h-full flex flex-col bg-background border rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
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
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}:{" "}
              {STEPS[currentStep].title}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-2 flex-shrink-0 transition-colors ${
                  index <= currentStep
                    ? "cursor-pointer hover:opacity-80 hover:scale-105"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (index <= currentStep && !processing) {
                    setCurrentStep(index);
                  }
                }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <IconCheck className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs transition-colors ${
                    index <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                  title={
                    index <= currentStep
                      ? `Click to go to ${step.title}`
                      : "Complete previous steps first"
                  }
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-4 h-0.5 ${
                    index < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">{renderStepContent()}</div>

      {/* Footer */}
      <div className="flex justify-between items-center p-4 border-t">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0 || processing}
          size="sm"
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            size="sm"
          >
            Cancel
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handlePayment}
              disabled={processing || !canProceed()}
              className="min-w-32"
              size="sm"
            >
              {processing ? (
                <>
                  <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconCash className="h-4 w-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed() || processing}
              size="sm"
            >
              Next
              <IconArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
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
            className="flex justify-between items-center py-2 border-b last:border-b-0"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
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
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Discount</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

function DiscountStep({
  discountType,
  setDiscountType,
  discountValue,
  handleDiscountChange,
  discount,
  _subtotal,
  processing,
}: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Discount</h3>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={discountType === "percentage" ? "default" : "outline"}
            size="sm"
            onClick={() => setDiscountType("percentage")}
            disabled={processing}
          >
            <IconPercentage className="h-4 w-4 mr-1" />
            Percentage
          </Button>
          <Button
            variant={discountType === "fixed" ? "default" : "outline"}
            size="sm"
            onClick={() => setDiscountType("fixed")}
            disabled={processing}
          >
            <IconMinus className="h-4 w-4 mr-1" />
            Fixed Amount
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={discountType === "percentage" ? "0" : "0.00"}
            value={discountValue || ""}
            onChange={(e) =>
              handleDiscountChange(parseFloat(e.target.value) || 0)
            }
            disabled={processing}
          />
          <div className="flex items-center px-3 bg-muted rounded">
            {discountType === "percentage" ? "%" : "₦"}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Current discount: {formatCurrency(discount)}
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
  subtotal,
}: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Method</h3>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Original Total:</span>
              <span>{formatCurrency(total + discount)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Amount to Pay:</span>
              <span className="text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={isSplitPayment ? "default" : "outline"}
          size="sm"
          onClick={() => setIsSplitPayment(!isSplitPayment)}
          disabled={processing}
        >
          Split Payment
        </Button>
        {isSplitPayment && (
          <span className="text-sm text-muted-foreground">
            Total: {formatCurrency(total)}
          </span>
        )}
      </div>

      {!isSplitPayment ? (
        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <Button
                key={method.value}
                variant={paymentMethod === method.value ? "default" : "outline"}
                className="h-16 flex-col"
                onClick={() => setPaymentMethod(method.value)}
                disabled={processing}
              >
                <Icon className="h-6 w-6 mb-1" />
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
          subtotal={subtotal}
          discount={discount}
        />
      )}

      {paymentMethod && (
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="amountPaid">Amount Paid (₦)</Label>
            <Input
              id="amountPaid"
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              disabled={processing}
            />
          </div>

          {paymentMethod === "cash" && (
            <div className="flex justify-between items-center p-3 bg-muted rounded">
              <span className="font-medium">Change Due:</span>
              <span className="font-bold text-lg">
                {formatCurrency(change)}
              </span>
            </div>
          )}

          {paymentMethod !== "cash" && amountPaid < total && (
            <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded">
              <span className="font-medium text-amber-800">
                Remaining Balance:
              </span>
              <span className="font-bold text-lg text-amber-800">
                ₦{formatCurrency(total - amountPaid)}
              </span>
              <div className="text-xs text-amber-700 mt-1">
                This will be recorded as a debt for the customer
              </div>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Mock customer data - in a real app, this would come from the database
  const mockCustomers = [
    {
      id: 1,
      name: "John Doe",
      phone: "+2348012345678",
      email: "john@example.com",
    },
    {
      id: 2,
      name: "Jane Smith",
      phone: "+2348098765432",
      email: "jane@example.com",
    },
    {
      id: 3,
      name: "Mike Johnson",
      phone: "+2348055555555",
      email: "mike@example.com",
    },
  ];

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectCustomer = (customer: any) => {
    onCustomerInfoChange({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });
    setShowCustomerSearch(false);
    setSearchTerm("");
  };

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
            {showCustomerSearch ? "Hide" : "Search"} Existing Customers
          </Button>
          {customerInfo.name && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onCustomerInfoChange({ name: "", phone: "", email: "" })
              }
              disabled={processing}
            >
              Clear
            </Button>
          )}
        </div>

        {showCustomerSearch && (
          <div className="space-y-2">
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={processing}
            />

            {filteredCustomers.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.phone} • {customer.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="customerName">Name</Label>
          <Input
            id="customerName"
            value={customerInfo.name}
            onChange={(e) =>
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
          <Input
            id="customerPhone"
            type="tel"
            value={customerInfo.phone}
            onChange={(e) =>
              onCustomerInfoChange({
                ...customerInfo,
                phone: e.target.value,
              })
            }
            disabled={processing}
          />
        </div>

        <div>
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            type="email"
            value={customerInfo.email}
            onChange={(e) =>
              onCustomerInfoChange({
                ...customerInfo,
                email: e.target.value,
              })
            }
            disabled={processing}
          />
        </div>
      </div>
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
  const PaymentIcon =
    PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.icon || IconCash;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review & Complete</h3>

      <div className="space-y-4">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item: CartItem) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {isSplitPayment ? "Split Payments" : "Payment Method"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSplitPayment ? (
              <div className="space-y-2">
                {splitPayments.map(
                  (payment: { id: string; amount: number; method: string }) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {
                            PAYMENT_METHODS.find(
                              (m) => m.value === payment.method
                            )?.label
                          }
                        </span>
                      </div>
                      <span className="font-medium">
                        ₦{formatCurrency(payment.amount)}
                      </span>
                    </div>
                  )
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Paid:</span>
                  <span>
                    ₦
                    {splitPayments
                      .reduce(
                        (
                          sum: number,
                          p: { id: string; amount: number; method: string }
                        ) => sum + p.amount,
                        0
                      )
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <PaymentIcon className="h-4 w-4" />
                  <span>
                    {
                      PAYMENT_METHODS.find((m) => m.value === paymentMethod)
                        ?.label
                    }
                  </span>
                </div>
                {paymentMethod === "cash" && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Amount Paid: {formatCurrency(amountPaid)} | Change: ₦
                    {formatCurrency(change)}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        {(customerInfo.name || customerInfo.phone || customerInfo.email) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {customerInfo.name && <div>Name: {customerInfo.name}</div>}
                {customerInfo.phone && <div>Phone: {customerInfo.phone}</div>}
                {customerInfo.email && <div>Email: {customerInfo.email}</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes for this sale..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={processing}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

function SplitPaymentInterface({
  splitPayments,
  setSplitPayments,
  total,
  processing,
  subtotal: _subtotal,
  discount: _discount,
}: {
  splitPayments: Array<{ id: string; amount: number; method: string }>;
  setSplitPayments: (
    payments: Array<{ id: string; amount: number; method: string }>
  ) => void;
  total: number;
  processing: boolean;
  subtotal?: number;
  discount?: number;
}) {
  const addPayment = () => {
    const newPayment = {
      id: Date.now().toString(),
      amount: 0,
      method: "cash",
    };
    setSplitPayments([...splitPayments, newPayment]);
  };

  const removePayment = (id: string) => {
    setSplitPayments(splitPayments.filter((p) => p.id !== id));
  };

  const updatePayment = (
    id: string,
    field: "amount" | "method",
    value: string | number
  ) => {
    setSplitPayments(
      splitPayments.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      {_subtotal && _discount !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Original Total:</span>
                <span>{formatCurrency(_subtotal)}</span>
              </div>
              {_discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount Applied:</span>
                  <span>-{formatCurrency(_discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Amount to Pay:</span>
                <span className="text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Split Payments</span>
        <span className="text-sm text-muted-foreground">
          Total: {formatCurrency(total)}
        </span>
      </div>

      <div className="space-y-3">
        {splitPayments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor={`amount-${payment.id}`}>Amount (₦)</Label>
                  <Input
                    id={`amount-${payment.id}`}
                    type="number"
                    step="0.01"
                    value={payment.amount || ""}
                    onChange={(e) =>
                      updatePayment(
                        payment.id,
                        "amount",
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
                    onChange={(e) =>
                      updatePayment(payment.id, "method", e.target.value)
                    }
                    disabled={processing}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {PAYMENT_METHODS.map((method) => (
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
                  className="mt-6"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={addPayment}
        disabled={processing}
        className="w-full"
      >
        + Add Another Payment
      </Button>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Paid:</span>
              <span className="font-medium">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span
                className={`font-medium ${remaining > 0 ? "text-amber-600" : "text-green-600"}`}
              >
                ₦{formatCurrency(remaining)}
              </span>
            </div>
            {remaining < 0 && (
              <div className="text-sm text-red-600">
                Overpayment: ₦{formatCurrency(Math.abs(remaining))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
