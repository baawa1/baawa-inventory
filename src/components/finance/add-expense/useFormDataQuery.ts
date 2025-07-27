'use client';

import { useState } from 'react';
import { EXPENSE_TYPES, PAYMENT_METHODS } from '@/lib/constants/finance';
import type { ExpenseTypeOption, PaymentMethodOption } from './types';

export function useFormDataQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Expense type options
  const expenseTypeOptions: ExpenseTypeOption[] = [
    { value: EXPENSE_TYPES.INVENTORY_PURCHASES, label: 'Inventory Purchases' },
    { value: EXPENSE_TYPES.UTILITIES, label: 'Utilities' },
    { value: EXPENSE_TYPES.RENT, label: 'Rent' },
    { value: EXPENSE_TYPES.SALARIES, label: 'Salaries' },
    { value: EXPENSE_TYPES.MARKETING, label: 'Marketing' },
    { value: EXPENSE_TYPES.OFFICE_SUPPLIES, label: 'Office Supplies' },
    { value: EXPENSE_TYPES.TRAVEL, label: 'Travel' },
    { value: EXPENSE_TYPES.INSURANCE, label: 'Insurance' },
    { value: EXPENSE_TYPES.MAINTENANCE, label: 'Maintenance' },
    { value: EXPENSE_TYPES.OTHER, label: 'Other' },
  ];

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
