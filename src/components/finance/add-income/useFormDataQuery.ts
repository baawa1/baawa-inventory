"use client";

import { useState } from "react";
import { INCOME_SOURCES, PAYMENT_METHODS } from "@/lib/constants/finance";
import type { IncomeSourceOption, PaymentMethodOption } from "./types";

export function useFormDataQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Income source options
  const incomeSourceOptions: IncomeSourceOption[] = [
    { value: INCOME_SOURCES.SALES, label: "Sales Revenue" },
    { value: INCOME_SOURCES.SERVICES, label: "Service Fees" },
    { value: INCOME_SOURCES.INVESTMENTS, label: "Investment Income" },
    { value: INCOME_SOURCES.ROYALTIES, label: "Royalties" },
    { value: INCOME_SOURCES.COMMISSIONS, label: "Commission" },
    { value: INCOME_SOURCES.OTHER, label: "Other" },
  ];

  // Payment method options
  const paymentMethodOptions: PaymentMethodOption[] = [
    { value: PAYMENT_METHODS.CASH, label: "Cash" },
    { value: PAYMENT_METHODS.BANK_TRANSFER, label: "Bank Transfer" },
    { value: PAYMENT_METHODS.POS_MACHINE, label: "POS Machine" },
    { value: PAYMENT_METHODS.CREDIT_CARD, label: "Credit Card" },
    { value: PAYMENT_METHODS.MOBILE_MONEY, label: "Mobile Money" },
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
