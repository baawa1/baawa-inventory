import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import EditIncomeForm from '@/components/finance/edit-income/EditIncomeForm';
import EditExpenseForm from '@/components/finance/edit-expense/EditExpenseForm';
import { useIncomeData } from '@/components/finance/edit-income/useIncomeData';
import { useExpenseData } from '@/components/finance/edit-expense/useExpenseData';
import { useIncomeUpdate } from '@/components/finance/edit-income/useIncomeUpdate';
import { useExpenseUpdate } from '@/components/finance/edit-expense/useExpenseUpdate';
import { useDeleteFinancialTransaction } from '@/hooks/api/finance';

const mockPush = jest.fn();
const mockDeleteMutateAsync = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/finance/edit-income/useIncomeData', () => ({
  useIncomeData: jest.fn(),
}));

jest.mock('@/components/finance/edit-expense/useExpenseData', () => ({
  useExpenseData: jest.fn(),
}));

jest.mock('@/components/finance/edit-income/useIncomeUpdate', () => ({
  useIncomeUpdate: jest.fn(),
}));

jest.mock('@/components/finance/edit-expense/useExpenseUpdate', () => ({
  useExpenseUpdate: jest.fn(),
}));

jest.mock('@/hooks/api/finance', () => ({
  useDeleteFinancialTransaction: jest.fn(),
}));

const mockUseIncomeData = useIncomeData as jest.MockedFunction<
  typeof useIncomeData
>;
const mockUseExpenseData = useExpenseData as jest.MockedFunction<
  typeof useExpenseData
>;
const mockUseIncomeUpdate = useIncomeUpdate as jest.MockedFunction<
  typeof useIncomeUpdate
>;
const mockUseExpenseUpdate = useExpenseUpdate as jest.MockedFunction<
  typeof useExpenseUpdate
>;
const mockUseDeleteFinancialTransaction =
  useDeleteFinancialTransaction as jest.MockedFunction<
    typeof useDeleteFinancialTransaction
  >;
const mockToast = toast as unknown as {
  success: jest.Mock;
  error: jest.Mock;
};

const adminUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'APPROVED',
  isEmailVerified: true,
  firstName: 'Admin',
  lastName: 'User',
  isActive: true,
  userStatus: 'APPROVED',
  createdAt: '2026-04-26T00:00:00.000Z',
} as any;

const managerUser = {
  ...adminUser,
  role: 'MANAGER',
  email: 'manager@example.com',
} as any;

const baseIncomeData = {
  id: 12,
  transactionNumber: 'FIN-0012',
  type: 'INCOME' as const,
  amount: 5000,
  description: 'Income transaction',
  transactionDate: new Date('2026-04-26'),
  paymentMethod: 'CASH',
  notes: null,
  status: 'COMPLETED' as const,
  incomeDetails: {
    id: 3,
    incomeSource: 'OTHER',
    payerName: 'John Doe',
  },
};

const baseExpenseData = {
  id: 18,
  transactionNumber: 'FIN-0018',
  type: 'EXPENSE' as const,
  amount: 2500,
  description: 'Expense transaction',
  transactionDate: new Date('2026-04-26'),
  paymentMethod: 'CASH',
  notes: null,
  status: 'COMPLETED' as const,
  expenseDetails: {
    id: 4,
    expenseType: 'OTHER',
    vendorName: 'Vendor Ltd',
  },
};

describe('finance edit delete flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIncomeUpdate.mockReturnValue({
      updateIncome: jest.fn(),
      isUpdating: false,
    });
    mockUseExpenseUpdate.mockReturnValue({
      updateExpense: jest.fn(),
      isUpdating: false,
    });
    mockUseDeleteFinancialTransaction.mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as any);
  });

  it('shows delete controls for admins on income and expense edit pages', () => {
    mockUseIncomeData.mockReturnValue({
      data: baseIncomeData,
      isLoading: false,
      error: null,
    } as any);
    mockUseExpenseData.mockReturnValue({
      data: baseExpenseData,
      isLoading: false,
      error: null,
    } as any);

    const { rerender } = render(
      <EditIncomeForm user={adminUser} incomeId="12" />
    );

    expect(
      screen.getByRole('button', { name: 'Delete Income' })
    ).toBeInTheDocument();

    rerender(<EditExpenseForm user={adminUser} expenseId="18" />);

    expect(
      screen.getByRole('button', { name: 'Delete Expense' })
    ).toBeInTheDocument();
  });

  it('hides delete controls for managers', () => {
    mockUseIncomeData.mockReturnValue({
      data: baseIncomeData,
      isLoading: false,
      error: null,
    } as any);

    render(<EditIncomeForm user={managerUser} incomeId="12" />);

    expect(
      screen.queryByRole('button', { name: 'Delete Income' })
    ).not.toBeInTheDocument();
  });

  it('disables delete for approved expense transactions', () => {
    mockUseExpenseData.mockReturnValue({
      data: {
        ...baseExpenseData,
        status: 'APPROVED',
      },
      isLoading: false,
      error: null,
    } as any);

    render(<EditExpenseForm user={adminUser} expenseId="18" />);

    expect(
      screen.getByRole('button', { name: 'Delete Expense' })
    ).toBeDisabled();
    expect(
      screen.getByText(
        'Approved or rejected expense transactions cannot be deleted.'
      )
    ).toBeInTheDocument();
  });

  it('requires a reason before deleting an income transaction', async () => {
    mockUseIncomeData.mockReturnValue({
      data: baseIncomeData,
      isLoading: false,
      error: null,
    } as any);

    render(<EditIncomeForm user={adminUser} incomeId="12" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Income' }));
    await screen.findByLabelText('Reason');

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete Income' }));

    expect(mockToast.error).toHaveBeenCalledWith(
      'Enter a reason for deleting this income transaction'
    );
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('deletes an expense transaction and redirects after success', async () => {
    mockUseExpenseData.mockReturnValue({
      data: baseExpenseData,
      isLoading: false,
      error: null,
    } as any);
    mockDeleteMutateAsync.mockResolvedValue({
      id: 18,
      transactionNumber: 'FIN-0018',
      reason: 'Duplicate expense entry',
    });

    render(<EditExpenseForm user={adminUser} expenseId="18" />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Expense' }));
    fireEvent.change(await screen.findByLabelText('Reason'), {
      target: { value: 'Duplicate expense entry' },
    });

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete Expense' }));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
        id: 18,
        reason: 'Duplicate expense entry',
      });
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Expense transaction deleted successfully'
      );
      expect(mockPush).toHaveBeenCalledWith('/finance/expenses');
    });
  });
});
