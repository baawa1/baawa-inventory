'use client';

import { useState } from 'react';
import {
  MANUAL_ALLOWED_INCOME_SOURCE_VALUES,
  PAYMENT_METHODS,
} from '@/lib/constants/finance';
import type { IncomeSourceOption, PaymentMethodOption } from './types';

export function useFormDataQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Income source options
  const incomeSourceOptions: IncomeSourceOption[] =
    MANUAL_ALLOWED_INCOME_SOURCE_VALUES.map(value => ({
      value,
      label:
        {
          SERVICES: 'Service Fees',
          INVESTMENTS: 'Investment Income',
          ROYALTIES: 'Royalties',
          COMMISSIONS: 'Commission',
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
    incomeSourceOptions,
    paymentMethodOptions,
    setIsSubmitting,
    setSubmitError,
  };
}
