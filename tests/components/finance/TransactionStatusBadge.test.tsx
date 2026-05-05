import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  TransactionStatusBadge,
  getStatusLabel,
} from '@/components/finance/shared/TransactionStatusBadge';

describe('TransactionStatusBadge', () => {
  it('renders finance ledger statuses with distinct labels and colors', () => {
    const { rerender } = render(<TransactionStatusBadge status="PAID" />);

    expect(screen.getByText('Paid')).toHaveClass(
      'bg-emerald-100',
      'text-emerald-700'
    );

    rerender(<TransactionStatusBadge status="PARTIAL" />);
    expect(screen.getByText('Partial')).toHaveClass(
      'bg-orange-100',
      'text-orange-700'
    );

    rerender(<TransactionStatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toHaveClass(
      'bg-yellow-100',
      'text-yellow-700'
    );
  });

  it('returns a readable fallback label for unknown statuses', () => {
    expect(getStatusLabel('SETTLED')).toBe('SETTLED');
  });
});
