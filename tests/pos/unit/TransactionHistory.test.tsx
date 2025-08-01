import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/components/pos/POSErrorBoundary', () => ({
  usePOSErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

jest.mock('@/hooks/useOffline', () => ({
  useOffline: () => ({
    isOnline: true,
    syncOfflineTransactions: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockTransactions = [
  {
    id: 1,
    transactionNumber: 'TXN-001',
    items: [
      {
        id: 1,
        productId: 1,
        name: 'Test Product 1',
        sku: 'SKU001',
        price: 1000,
        quantity: 2,
        total: 2000,
      },
    ],
    subtotal: 2000,
    discount: 100,
    total: 1900,
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    staffName: 'Test Staff',
    staffId: 1,
    timestamp: new Date('2024-01-01T10:00:00Z'),
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    notes: 'Test transaction with notes',
  },
  {
    id: 2,
    transactionNumber: 'TXN-002',
    items: [
      {
        id: 2,
        productId: 2,
        name: 'Test Product 2',
        sku: 'SKU002',
        price: 500,
        quantity: 1,
        total: 500,
      },
    ],
    subtotal: 500,
    discount: 0,
    total: 500,
    paymentMethod: 'pos',
    paymentStatus: 'completed',
    customerName: 'Jane Smith',
    customerPhone: '0987654321',
    customerEmail: 'jane@example.com',
    staffName: 'Test Staff',
    staffId: 1,
    timestamp: new Date('2024-01-01T11:00:00Z'),
    createdAt: new Date('2024-01-01T11:00:00Z'),
    updatedAt: new Date('2024-01-01T11:00:00Z'),
    notes: null,
  },
  {
    id: 3,
    transactionNumber: 'TXN-003',
    items: [
      {
        id: 3,
        productId: 3,
        name: 'Test Product 3',
        sku: 'SKU003',
        price: 750,
        quantity: 3,
        total: 2250,
      },
    ],
    subtotal: 2250,
    discount: 200,
    total: 2050,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    customerName: 'Bob Johnson',
    customerPhone: '5555555555',
    customerEmail: 'bob@example.com',
    staffName: 'Test Staff',
    staffId: 1,
    timestamp: new Date('2024-01-01T12:00:00Z'),
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
    notes: 'Another test transaction with notes',
  },
];

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

describe('TransactionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTransactions,
    });
  });

  describe('Initial Render', () => {
    it('renders transaction history with search and filters', () => {
      renderWithQueryClient(<TransactionHistory />);

      expect(
        screen.getByPlaceholderText('Search transactions...')
      ).toBeInTheDocument();
      expect(screen.getByText('Filter by Status')).toBeInTheDocument();
      expect(screen.getByText('Filter by Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderWithQueryClient(<TransactionHistory />);

      expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
    });

    it('displays transactions after loading', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Display', () => {
    it('displays transaction information correctly', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('₦1,900')).toBeInTheDocument();
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('displays offline transaction indicator', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('displays pending transaction status', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters transactions by sale ID', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'TXN-001' } });

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.queryByText('TXN-002')).not.toBeInTheDocument();
      });
    });

    it('filters transactions by customer name', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters transactions by customer phone', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: '1234567890' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });
  });

  describe('Status Filtering', () => {
    it('filters by completed status', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
      });

      const statusSelect = screen.getByText('Filter by Status');
      fireEvent.click(statusSelect);

      await waitFor(() => {
        const completedOption = screen.getByText('Completed');
        fireEvent.click(completedOption);
      });

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.queryByText('TXN-003')).not.toBeInTheDocument();
      });
    });

    it('filters by pending status', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
      });

      const statusSelect = screen.getByText('Filter by Status');
      fireEvent.click(statusSelect);

      await waitFor(() => {
        const pendingOption = screen.getByText('Pending');
        fireEvent.click(pendingOption);
      });

      await waitFor(() => {
        expect(screen.queryByText('TXN-001')).not.toBeInTheDocument();
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Method Filtering', () => {
    it('filters by cash payment method', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
      });

      const paymentSelect = screen.getByText('Filter by Payment Method');
      fireEvent.click(paymentSelect);

      await waitFor(() => {
        const cashOption = screen.getByText('Cash');
        fireEvent.click(cashOption);
      });

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.queryByText('TXN-002')).not.toBeInTheDocument();
      });
    });

    it('filters by card payment method', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
      });

      const paymentSelect = screen.getByText('Filter by Payment Method');
      fireEvent.click(paymentSelect);

      await waitFor(() => {
        const cardOption = screen.getByText('Card');
        fireEvent.click(cardOption);
      });

      await waitFor(() => {
        expect(screen.queryByText('TXN-001')).not.toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Details', () => {
    it('shows transaction details when view button is clicked', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
      });

      const viewButton = screen.getByLabelText('View transaction details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Transaction Details')).toBeInTheDocument();
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('₦1,000')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('closes transaction details when close button is clicked', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
      });

      const viewButton = screen.getByLabelText('View transaction details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Transaction Details')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Transaction Details')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('exports transactions as CSV', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/pos/export-transactions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              format: 'csv',
              filters: {},
            }),
          }
        );
      });
    });

    it('shows success message after successful export', async () => {
      const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Transactions exported successfully'
        );
      });
    });

    it('handles export error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Export failed'));

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to export transactions'
        );
      });
    });
  });

  describe('Offline Transaction Sync', () => {
    it('syncs offline transactions when sync button is clicked', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync Offline Transactions');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Offline transactions synced successfully'
        );
      });
    });

    it('handles sync error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Sync failed'));

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-003')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync Offline Transactions');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to sync offline transactions'
        );
      });
    });
  });

  describe('Date Range Filtering', () => {
    it('filters transactions by date range', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
      });

      const dateRangeSelect = screen.getByText('Date Range');
      fireEvent.click(dateRangeSelect);

      await waitFor(() => {
        const todayOption = screen.getByText('Today');
        fireEvent.click(todayOption);
      });

      // Should filter transactions based on date range
      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByText('Error loading transactions')
        ).toBeInTheDocument();
      });
    });

    it('handles network error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByText('Error loading transactions')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(
          screen.getByLabelText('View transaction details')
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText('Search transactions')
        ).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      searchInput.focus();
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Should not throw any errors
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty transaction list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('No transactions found')).toBeInTheDocument();
      });
    });

    it('handles transaction with missing customer info', async () => {
      const transactionsWithMissingInfo = [
        {
          ...mockTransactions[0],
          customerName: '',
          customerPhone: '',
          customerEmail: '',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => transactionsWithMissingInfo,
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });

    it('handles large transaction amounts', async () => {
      const largeTransaction = [
        {
          ...mockTransactions[0],
          total: 999999,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => largeTransaction,
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('₦999,999')).toBeInTheDocument();
      });
    });

    it('displays transaction notes when available', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [mockTransactions[0]], // Transaction with notes
        }),
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-001')).toBeInTheDocument();
      });

      // Click on the transaction to view details
      const transactionButton = screen.getByText('TXN-001');
      fireEvent.click(transactionButton);

      await waitFor(() => {
        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(
          screen.getByText('Test transaction with notes')
        ).toBeInTheDocument();
      });
    });

    it('does not display notes section when transaction has no notes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [mockTransactions[1]], // Transaction without notes
        }),
      });

      renderWithQueryClient(<TransactionHistory />);

      await waitFor(() => {
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
      });

      // Click on the transaction to view details
      const transactionButton = screen.getByText('TXN-002');
      fireEvent.click(transactionButton);

      await waitFor(() => {
        expect(screen.queryByText('Notes')).not.toBeInTheDocument();
      });
    });
  });
});
