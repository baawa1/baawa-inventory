import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SalesAnalytics } from '@/components/pos/SalesAnalytics';
import { toast } from 'sonner';

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock the fetch function
global.fetch = jest.fn();

// Mock the DateRangePicker component
jest.mock('@/components/ui/date-range-picker', () => ({
  DateRangePicker: ({ date, onDateChange, placeholder }: any) => (
    <div data-testid="date-range-picker">
      <button
        onClick={() =>
          onDateChange({
            from: new Date('2025-01-01'),
            to: new Date('2025-01-31'),
          })
        }
      >
        {placeholder}
      </button>
      {date?.from && date?.to && (
        <span>
          {date.from.toISOString().split('T')[0]} -{' '}
          {date.to.toISOString().split('T')[0]}
        </span>
      )}
    </div>
  ),
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN',
  status: 'APPROVED',
  isEmailVerified: true,
};

const mockAnalyticsData = {
  totalSales: 50000,
  totalOrders: 25,
  totalCustomers: 20,
  averageOrderValue: 2000,
  salesByPeriod: [
    {
      date: '2025-01-01',
      orders: 5,
      grossSales: 10000,
      returns: 0,
      coupons: 500,
      netSales: 9500,
      taxes: 475,
      shipping: 0,
      totalSales: 9975,
    },
    {
      date: '2025-01-02',
      orders: 8,
      grossSales: 15000,
      returns: 1000,
      coupons: 750,
      netSales: 13250,
      taxes: 662.5,
      shipping: 0,
      totalSales: 13912.5,
    },
  ],
  recentTransactions: [
    {
      id: 1,
      transactionNumber: 'TXN-001',
      customerName: 'John Doe',
      totalAmount: 2000,
      createdAt: '2025-01-01T10:00:00Z',
    },
  ],
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe('SalesAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Date Range Picker Integration', () => {
    test('should render date range picker with default date range', () => {
      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
      expect(screen.getByText('Select date range')).toBeInTheDocument();
    });

    test('should update date range when picker is clicked', async () => {
      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      const datePickerButton = screen.getByText('Select date range');
      fireEvent.click(datePickerButton);

      await waitFor(() => {
        expect(screen.getByText('2025-01-01 - 2025-01-31')).toBeInTheDocument();
      });
    });

    test('should fetch data when date range changes', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      const datePickerButton = screen.getByText('Select date range');
      fireEvent.click(datePickerButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(
            '/api/pos/analytics/overview?fromDate=2025-01-01&toDate=2025-01-31'
          )
        );
      });
    });
  });

  describe('API Integration', () => {
    test('should fetch analytics data on component mount', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/pos/analytics/overview')
        );
      });
    });

    test('should handle API error gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to load sales analytics data'
        );
      });
    });

    test('should display loading state while fetching data', () => {
      (fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      expect(screen.getByText('Loading sales data...')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    test('should display summary metrics when data is loaded', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Gross sales')).toBeInTheDocument();
        expect(screen.getByText('Returns')).toBeInTheDocument();
        expect(screen.getByText('Coupons')).toBeInTheDocument();
        expect(screen.getByText('Net sales')).toBeInTheDocument();
        expect(screen.getByText('Taxes')).toBeInTheDocument();
        expect(screen.getByText('Shipping')).toBeInTheDocument();
        expect(screen.getByText('Total sales')).toBeInTheDocument();
      });
    });

    test('should display sales data table when data is loaded', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Gross sales')).toBeInTheDocument();
        expect(screen.getByText('Returns')).toBeInTheDocument();
        expect(screen.getByText('Coupons')).toBeInTheDocument();
        expect(screen.getByText('Net sales')).toBeInTheDocument();
        expect(screen.getByText('Taxes')).toBeInTheDocument();
        expect(screen.getByText('Shipping')).toBeInTheDocument();
        expect(screen.getByText('Total sales')).toBeInTheDocument();
      });
    });

    test('should display no data message when no sales data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAnalyticsData,
          salesByPeriod: [],
        }),
      });

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      await waitFor(() => {
        expect(
          screen.getByText('No revenue data found for the selected date range')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('should filter data when search term is entered', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Search by date...')
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by date...');
      fireEvent.change(searchInput, { target: { value: '2025-01-01' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('2025-01-01');
      });
    });
  });

  describe('Component Structure', () => {
    test('should render main heading', () => {
      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    test('should render action buttons', () => {
      renderWithQueryClient(<SalesAnalytics user={mockUser} />);

      expect(
        screen.getByRole('button', { name: /download/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dots/i })).toBeInTheDocument();
    });
  });
});
