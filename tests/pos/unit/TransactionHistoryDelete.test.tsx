import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { toast } from 'sonner';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/pos/POSErrorBoundary', () => ({
  usePOSErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

jest.mock('@/components/pos/ReceiptPrinter', () => ({
  ReceiptPrinter: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

jest.mock('@/components/ui/date-range-picker-with-presets', () => ({
  DateRangePickerWithPresets: () => <div>Date Range Picker</div>,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockToast = toast as unknown as {
  success: jest.Mock;
  error: jest.Mock;
};

const baseTransaction = {
  id: 1,
  transactionNumber: 'TXN-001',
  items: [
    {
      id: 1,
      productId: 1,
      name: 'Widget',
      sku: 'W-001',
      price: 1000,
      quantity: 1,
      total: 1000,
      coupon: null,
    },
  ],
  fees: [],
  customer: {
    id: 12,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '08000000000',
  },
  staffName: 'Admin User',
  staffId: 7,
  timestamp: new Date('2026-04-26T10:00:00.000Z'),
  createdAt: new Date('2026-04-26T10:00:00.000Z'),
  updatedAt: new Date('2026-04-26T10:00:00.000Z'),
  paymentStatus: 'PAID',
  subtotal: 1000,
  discount: 0,
  total: 1000,
  amountPaid: 1000,
  balanceDue: 0,
  splitPayments: [],
  transactionPayments: [],
  paymentMethod: 'cash',
  notes: null,
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

const openTransactionGroup = async () => {
  fireEvent.click(await screen.findByText('April 26, 2026'));
};

describe('TransactionHistory delete flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [baseTransaction],
      }),
    });
  });

  it('shows the delete button only for admins', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
      update: jest.fn(),
    } as any);

    renderWithQueryClient(<TransactionHistory />);

    await openTransactionGroup();

    await waitFor(() => {
      expect(screen.getByText('Customer: John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Customer: John Doe'));

    expect(
      await screen.findByRole('button', { name: 'Delete Transaction' })
    ).toBeInTheDocument();
  });

  it('hides the delete button for non-admin users', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          role: 'STAFF',
        },
      },
      status: 'authenticated',
      update: jest.fn(),
    } as any);

    renderWithQueryClient(<TransactionHistory />);

    await openTransactionGroup();

    await waitFor(() => {
      expect(screen.getByText('Customer: John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Customer: John Doe'));

    expect(
      screen.queryByRole('button', { name: 'Delete Transaction' })
    ).not.toBeInTheDocument();
  });

  it('requires a reason before deleting a transaction', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
      update: jest.fn(),
    } as any);

    renderWithQueryClient(<TransactionHistory />);

    await openTransactionGroup();

    await waitFor(() => {
      expect(screen.getByText('Customer: John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Customer: John Doe'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Transaction' })
    );
    await screen.findByLabelText('Reason');
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Transaction' })
    );

    expect(mockToast.error).toHaveBeenCalledWith(
      'Enter a reason for deleting this transaction'
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('deletes the transaction and clears the selected order after reload', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
      update: jest.fn(),
    } as any);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [baseTransaction],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 1,
            transactionNumber: 'TXN-001',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
        }),
      });

    global.fetch = fetchMock as any;

    renderWithQueryClient(<TransactionHistory />);

    await openTransactionGroup();

    await waitFor(() => {
      expect(screen.getByText('Customer: John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Customer: John Doe'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Transaction' })
    );

    fireEvent.change(await screen.findByLabelText('Reason'), {
      target: { value: 'Duplicate transaction' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Transaction' })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/sales/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Duplicate transaction' }),
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('Select an order to view details')
      ).toBeInTheDocument();
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      'Transaction deleted successfully'
    );
  });
});
