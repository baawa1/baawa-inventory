'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { IconLoader, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';
import { usePOSErrorHandler } from './POSErrorBoundary';
import { ALL_PAYMENT_METHODS, VALIDATION_RULES } from '@/lib/constants';
// import { OrderSummaryStep } from "./OrderSummaryStep";
// import { DiscountStep } from "./DiscountStep";
// import { PaymentMethodStep } from "./PaymentMethodStep";
// import { CustomerInfoStep } from "./CustomerInfoStep";

// Validation schemas
const discountSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
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
    .or(z.literal('')),
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
  { id: 'order-summary', title: 'Order Summary' },
  { id: 'discount', title: 'Discount' },
  { id: 'payment-method', title: 'Payment Method' },
  { id: 'customer-info', title: 'Customer Info' },
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
  // Temporarily disabled due to missing components
  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Payment Interface</h2>
        <p className="mb-4 text-gray-600">
          Payment interface temporarily disabled
        </p>
        <Button onClick={onCancel} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
}
