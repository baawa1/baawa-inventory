"use client";

import { useState } from "react";
import { INCOME_SOURCES, PAYMENT_METHODS } from "@/lib/constants";
import type { IncomeSourceOption, PaymentMethodOption } from "./types";

export function useFormDataQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Income source options
  const incomeSourceOptions: IncomeSourceOption[] = [
    { value: INCOME_SOURCES.SALES, label: "Sales Revenue" },
    { value: INCOME_SOURCES.LOAN, label: "Loan" },
    { value: INCOME_SOURCES.SERVICES, label: "Service Fees" },
    { value: INCOME_SOURCES.INVESTMENT, label: "Investment Income" },
    { value: INCOME_SOURCES.RENTAL, label: "Rental Income" },
    { value: INCOME_SOURCES.COMMISSION, label: "Commission" },
    { value: INCOME_SOURCES.REFUND, label: "Refund" },
    { value: INCOME_SOURCES.OTHER, label: "Other" },
  ];

  // Payment method options
  const paymentMethodOptions: PaymentMethodOption[] = [
    { value: PAYMENT_METHODS.CASH, label: "Cash" },
    { value: PAYMENT_METHODS.BANK_TRANSFER, label: "Bank Transfer" },
    { value: PAYMENT_METHODS.CARD, label: "Card" },
    { value: PAYMENT_METHODS.MOBILE_MONEY, label: "Mobile Money" },
    { value: PAYMENT_METHODS.CHECK, label: "Check" },
    { value: PAYMENT_METHODS.OTHER, label: "Other" },
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
