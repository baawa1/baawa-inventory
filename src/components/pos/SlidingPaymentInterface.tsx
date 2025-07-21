"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { IconLoader, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { usePOSErrorHandler } from "./POSErrorBoundary";
import { ALL_PAYMENT_METHODS, VALIDATION_RULES } from "@/lib/constants";
import { OrderSummaryStep } from "./OrderSummaryStep";
import { DiscountStep } from "./DiscountStep";
import { PaymentMethodStep } from "./PaymentMethodStep";
import { CustomerInfoStep } from "./CustomerInfoStep";
import { ReviewStep } from "./ReviewStep";

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
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
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
    address: string;
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

const STEPS = [
  { id: "order-summary", title: "Order Summary" },
  { id: "discount", title: "Discount" },
  { id: "payment-method", title: "Payment Method" },
  { id: "customer-info", title: "Customer Info" },
  { id: "review", title: "Review & Complete" },
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
  const [_notes, _setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<
    Array<{
      id: string;
      amount: number;
      method: string;
    }>
  >([]);

  // Validation helper functions
  const validateDiscountInput = (
    type: "percentage" | "fixed",
    value: number
  ) => {
    try {
      discountSchema.parse({ type, value });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Invalid discount value");
      }
      return false;
    }
  };

  const _validateCustomerInfo = (info: typeof customerInfo) => {
    try {
      customerInfoSchema.parse(info);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Invalid customer information");
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
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Invalid payment data");
      }
      return false;
    }
  };

  const handleDiscountChange = (value: number) => {
    if (validateDiscountInput(discountType, value)) {
      setDiscountValue(value);
      const newDiscount =
        discountType === "percentage" ? (subtotal * value) / 100 : value;
      onDiscountChange(newDiscount);
    }
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    const updatedInfo = { ...customerInfo, [field]: value };
    onCustomerInfoChange(updatedInfo);
  };

  const handleDiscountTypeChange = (newType: "percentage" | "fixed") => {
    setDiscountType(newType);
    setDiscountValue(0);
    onDiscountChange(0);
  };

  const handlePayment = async () => {
    if (!validatePaymentData(paymentMethod, amountPaid, _notes)) {
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const sale: Sale = {
        id: Date.now().toString(),
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        staffName,
        timestamp: new Date(),
      };

      onPaymentSuccess(sale);
      toast.success("Payment processed successfully!");
    } catch (error) {
      handleError(error, "Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

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

  const _canProceed = () => {
    switch (currentStep) {
      case 0: // Order Summary
        return true;
      case 1: // Discount
        return true;
      case 2: // Payment Method
        return paymentMethod && amountPaid > 0;
      case 3: // Customer Info
        return customerInfo.name && customerInfo.phone;
      case 4: // Review
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
            onNext={nextStep}
            onBack={onCancel}
            isSubmitting={processing}
          />
        );
      case 1:
        return (
          <DiscountStep
            discountType={discountType}
            onDiscountTypeChange={handleDiscountTypeChange}
            discountValue={discountValue}
            onDiscountChange={handleDiscountChange}
            discount={discount}
            subtotal={subtotal}
            onNext={nextStep}
            onBack={prevStep}
            isSubmitting={processing}
          />
        );
      case 2:
        return (
          <PaymentMethodStep
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            amountPaid={amountPaid}
            onAmountPaidChange={setAmountPaid}
            total={total}
            discount={discount}
            subtotal={subtotal}
            isSplitPayment={isSplitPayment}
            onSplitPaymentChange={setIsSplitPayment}
            splitPayments={splitPayments}
            onSplitPaymentsChange={setSplitPayments}
            onNext={nextStep}
            onBack={prevStep}
            isSubmitting={processing}
          />
        );
      case 3:
        return (
          <CustomerInfoStep
            customerInfo={customerInfo}
            onCustomerInfoChange={handleCustomerInfoChange}
            onNext={nextStep}
            onBack={prevStep}
            isSubmitting={processing}
          />
        );
      case 4:
        return (
          <ReviewStep
            cartItems={items}
            customerInfo={customerInfo}
            paymentInfo={{
              method: paymentMethod,
              amountPaid,
              discountType,
              discountValue,
              splitPayment: isSplitPayment,
            }}
            subtotal={subtotal}
            total={total}
            onConfirm={handlePayment}
            onBack={prevStep}
            isSubmitting={processing}
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
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

      {/* Loading Overlay */}
      {processing && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <IconLoader className="h-5 w-5 animate-spin" />
            <span>Processing payment...</span>
          </div>
        </div>
      )}
    </div>
  );
}
