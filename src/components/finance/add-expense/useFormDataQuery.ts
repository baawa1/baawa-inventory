'use client';

import { useState } from 'react';
import {
  MANUAL_ALLOWED_EXPENSE_TYPE_VALUES,
  PAYMENT_METHODS,
} from '@/lib/constants/finance';
import type { ExpenseTypeOption, PaymentMethodOption } from './types';

export function useFormDataQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Expense type options
  const expenseTypeOptions: ExpenseTypeOption[] =
    MANUAL_ALLOWED_EXPENSE_TYPE_VALUES.map(value => ({
      value,
      label:
        {
          UTILITIES: 'Utilities',
          RENT: 'Rent',
          SALARIES: 'Salaries',
          MARKETING: 'Marketing',
          OFFICE_SUPPLIES: 'Office Supplies',
          TRAVEL: 'Travel',
          INSURANCE: 'Insurance',
          MAINTENANCE: 'Maintenance',
          OTHER: 'Other',
        }[value] || value,
    }));

  // Payment method options
  const paymentMethodOptions: PaymentMethodOption[] = [
    { value: PAYMENT_METHODS.CASH, label: 'Cash' },
    { value: PAYMENT_METHODS.BANK_TRANSFER, label: 'Bank Transfer' },
    { value: PAYMENT_METHODS.POS_MACHINE, label: 'POS Machine' },
    { value: PAYMENT_METHODS.CREDIT_CARD, label: 'Credit Card' },
    { value: PAYMENT_METHODS.MOBILE_MONEY, label: 'Mobile Money' },
  ];

  return {
    isSubmitting,
    submitError,
    expenseTypeOptions,
    paymentMethodOptions,
    setIsSubmitting,
    setSubmitError,
  };
}
