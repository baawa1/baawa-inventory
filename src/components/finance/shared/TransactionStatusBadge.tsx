'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

export type TransactionStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'APPROVED'
  | 'REJECTED'
  | string;

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; variant?: 'destructive' | 'secondary' | 'default' | 'outline' }
> = {
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  REJECTED: {
    label: 'Rejected',
    className: '',
    variant: 'destructive',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: '',
    variant: 'destructive',
  },
};

export function TransactionStatusBadge({
  status,
  className = '',
}: TransactionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: '',
    variant: 'secondary' as const,
  };

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}

export function getStatusLabel(status: TransactionStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}
