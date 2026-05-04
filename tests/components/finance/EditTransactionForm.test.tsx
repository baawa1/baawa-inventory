import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditTransactionForm } from '@/components/finance/EditTransactionForm';
import {
  useFinancialTransaction,
  useUpdateFinancialTransaction,
} from '@/hooks/api/finance';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/hooks/api/finance', () => ({
  useFinancialTransaction: jest.fn(),
  useUpdateFinancialTransaction: jest.fn(),
}));

const mockUseFinancialTransaction =
  useFinancialTransaction as jest.MockedFunction<
    typeof useFinancialTransaction
  >;
const mockUseUpdateFinancialTransaction =
  useUpdateFinancialTransaction as jest.MockedFunction<
    typeof useUpdateFinancialTransaction
  >;

const managerUser = {
  id: '7',
  email: 'manager@example.com',
  name: 'Manager User',
  role: 'MANAGER',
  status: 'APPROVED',
  isEmailVerified: true,
  firstName: 'Manager',
  lastName: 'User',
  isActive: true,
  userStatus: 'APPROVED',
  createdAt: '2026-05-01T00:00:00.000Z',
} as const;

describe('EditTransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdateFinancialTransaction.mockReturnValue({
      mutateAsync: jest.fn(),
    } as any);
  });

  it('blocks managers from editing transactions they do not own', () => {
    mockUseFinancialTransaction.mockReturnValue({
      data: {
        id: 12,
        transactionNumber: 'FIN-0012',
        type: 'INCOME',
        amount: 5000,
        description: 'Consulting revenue',
        transactionDate: '2026-04-30T12:00:00.000Z',
        paymentMethod: 'CASH',
        status: 'PENDING',
        createdAt: '2026-04-30T12:00:00.000Z',
        updatedAt: '2026-04-30T12:00:00.000Z',
        createdBy: 3,
        createdByUser: {
          id: 3,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
        incomeDetails: {
          incomeSource: 'SERVICES',
          payerName: 'Customer',
        },
      },
      isLoading: false,
      error: null,
    } as any);

    render(<EditTransactionForm transactionId={12} user={managerUser as any} />);

    expect(
      screen.getByText(
        'You can only edit your own pending or completed transactions. This transaction was created by Jane Doe.'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Transaction' }));

    expect(mockPush).toHaveBeenCalledWith('/finance/transactions/12');
  });
});
