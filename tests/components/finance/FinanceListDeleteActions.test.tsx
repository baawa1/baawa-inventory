import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IncomeList } from '@/components/finance/IncomeList';
import { ExpenseList } from '@/components/finance/ExpenseList';
import { MobileIncomeList } from '@/components/finance/MobileIncomeList';
import { MobileExpenseList } from '@/components/finance/MobileExpenseList';
import { useDeleteFinancialTransaction } from '@/hooks/api/finance';

const mockPush = jest.fn();
const mockDeleteMutateAsync = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

jest.mock('@/hooks/api/finance', () => ({
  useDeleteFinancialTransaction: jest.fn(),
}));

jest.mock('@/components/layouts/DashboardTableLayout', () => ({
  DashboardTableLayout: ({ data, renderActions }: any) => (
    <div>
      {data.map((item: any) => (
        <div key={item.id}>{renderActions?.(item)}</div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/layouts/DashboardPageLayout', () => ({
  DashboardPageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@/components/layouts/MobileDashboardFiltersBar', () => ({
  MobileDashboardFiltersBar: () => <div>filters</div>,
}));

jest.mock('@/components/layouts/MobileDashboardTable', () => ({
  MobileDashboardTable: ({ data, renderActions }: any) => (
    <div>
      {data.map((item: any) => (
        <div key={item.id}>{renderActions?.(item)}</div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/date-range-picker-with-presets', () => ({
  DateRangePickerWithPresets: () => <div>date-range</div>,
}));

jest.mock('@/components/finance/shared/PaymentMethodIcon', () => ({
  PaymentMethodIcon: () => <span>payment</span>,
}));

jest.mock('@/components/finance/shared/TransactionStatusBadge', () => ({
  TransactionStatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({
    children,
    onClick,
    onSelect,
    disabled,
    asChild,
  }: {
    children: React.ReactNode;
    onClick?: (_event: React.MouseEvent<HTMLButtonElement>) => void;
    onSelect?: (_event: { preventDefault: () => void }) => void;
    disabled?: boolean;
    asChild?: boolean;
  }) => {
    if (asChild) {
      return <>{children}</>;
    }

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={event => {
          onSelect?.({ preventDefault: () => undefined });
          onClick?.(event);
        }}
      >
        {children}
      </button>
    );
  },
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
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

const incomeTransaction = {
  id: 12,
  transactionNumber: 'FIN-0012',
  type: 'INCOME' as const,
  amount: 5000,
  description: 'Income transaction',
  transactionDate: '2026-04-26T00:00:00.000Z',
  paymentMethod: 'CASH',
  status: 'COMPLETED' as const,
  incomeDetails: {
    id: 3,
    incomeSource: 'OTHER',
    payerName: 'John Doe',
  },
  createdByUser: {
    id: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
  },
};

const expenseTransaction = {
  id: 18,
  transactionNumber: 'FIN-0018',
  type: 'EXPENSE' as const,
  amount: 2500,
  description: 'Expense transaction',
  transactionDate: '2026-04-26T00:00:00.000Z',
  paymentMethod: 'CASH',
  status: 'COMPLETED' as const,
  expenseDetails: {
    id: 4,
    expenseType: 'OTHER',
    vendorName: 'Vendor Ltd',
  },
  createdByUser: {
    id: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
  },
};

describe('finance list delete actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeleteFinancialTransaction.mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as any);
    mockUseQuery.mockReturnValue({
      data: {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  it('shows delete action for admins on the income list and requires a reason', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [incomeTransaction],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<IncomeList user={adminUser} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Income' }));
    await screen.findByLabelText('Reason');

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete Income' }));

    expect(mockToast.error).toHaveBeenCalledWith(
      'Enter a reason for deleting this income transaction'
    );
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('hides list delete actions for managers', () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [incomeTransaction],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<IncomeList user={managerUser} />);

    expect(
      screen.queryByRole('button', { name: 'Delete Income' })
    ).not.toBeInTheDocument();
  });

  it('disables list delete actions for approved income transactions', () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [{ ...incomeTransaction, status: 'APPROVED' }],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<IncomeList user={adminUser} />);

    expect(
      screen.getByRole('button', { name: 'Delete Income' })
    ).toBeDisabled();
  });

  it('deletes an expense transaction from the expense list after a reason is entered', async () => {
    mockDeleteMutateAsync.mockResolvedValue({
      id: 18,
      transactionNumber: 'FIN-0018',
      reason: 'Duplicate expense entry',
    });
    mockUseQuery.mockReturnValue({
      data: {
        data: [expenseTransaction],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<ExpenseList user={adminUser} />);

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

    expect(mockToast.success).toHaveBeenCalledWith(
      'Expense transaction deleted successfully'
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows delete in the mobile income action menu for admins', () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [incomeTransaction],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MobileIncomeList user={adminUser} />);

    expect(
      screen.getByRole('button', { name: 'Delete Income' })
    ).toBeInTheDocument();
  });

  it('shows delete in the mobile expense action menu for admins', () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [expenseTransaction],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 1,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MobileExpenseList user={adminUser} />);

    expect(
      screen.getByRole('button', { name: 'Delete Expense' })
    ).toBeInTheDocument();
  });
});
