'use client';

import React from 'react';

export type PaymentMethodType =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'POS'
  | 'POS_MACHINE'
  | 'MOBILE_MONEY'
  | 'CREDIT_CARD'
  | 'CHECK'
  | 'OTHER'
  | string;

interface PaymentMethodIconProps {
  method: PaymentMethodType | null | undefined;
  showLabel?: boolean;
  className?: string;
}

const PAYMENT_METHOD_CONFIG: Record<
  string,
  { icon: string; label: string; colorClass: string }
> = {
  cash: { icon: '💵', label: 'Cash', colorClass: 'text-green-600' },
  bank_transfer: {
    icon: '🏦',
    label: 'Bank Transfer',
    colorClass: 'text-blue-600',
  },
  pos: { icon: '💳', label: 'POS', colorClass: 'text-purple-600' },
  pos_machine: { icon: '💳', label: 'POS Machine', colorClass: 'text-purple-600' },
  mobile_money: {
    icon: '📱',
    label: 'Mobile Money',
    colorClass: 'text-orange-600',
  },
  credit_card: { icon: '💳', label: 'Credit Card', colorClass: 'text-purple-600' },
  check: { icon: '📝', label: 'Check', colorClass: 'text-gray-600' },
  other: { icon: '💰', label: 'Other', colorClass: 'text-gray-600' },
};

export function PaymentMethodIcon({
  method,
  showLabel = false,
  className = '',
}: PaymentMethodIconProps) {
  const normalizedMethod = method?.toLowerCase() || 'other';
  const config = PAYMENT_METHOD_CONFIG[normalizedMethod] || PAYMENT_METHOD_CONFIG.other;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={config.colorClass}
        role="img"
        aria-label={config.label}
      >
        {config.icon}
      </span>
      {showLabel && (
        <span className="capitalize">
          {method?.replace(/_/g, ' ') || 'N/A'}
        </span>
      )}
    </span>
  );
}

export function getPaymentMethodLabel(method: PaymentMethodType | null | undefined): string {
  if (!method) return 'N/A';
  const normalizedMethod = method.toLowerCase();
  const config = PAYMENT_METHOD_CONFIG[normalizedMethod];
  return config?.label || method.replace(/_/g, ' ');
}
