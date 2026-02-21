import React from 'react';
import { render, screen } from '@testing-library/react';
import { SimpleDashboard } from '@/components/dashboard/SimpleDashboard';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Bar: () => <div />,
}));

jest.mock('@/hooks/api/transactions', () => ({
  useTransactionStats: jest.fn(),
}));

jest.mock('@/hooks/api/inventory', () => ({
  useInventoryStats: jest.fn(),
}));

jest.mock('@/hooks/api/useFinancialAnalytics', () => ({
  useFinancialAnalyticsSummary: jest.fn(),
}));

jest.mock('@/hooks/api/useSalesTrends', () => ({
  useSalesTrends: jest.fn(),
}));

jest.mock('@/hooks/api/useTopProducts', () => ({
  useTopProducts: jest.fn(),
}));

jest.mock('@/hooks/api/useRecentTransactions', () => ({
  useRecentTransactions: jest.fn(),
}));

const mockUser = {
  firstName: 'Test',
  name: 'Test User',
};

describe('SimpleDashboard', () => {
  beforeEach(() => {
    const { useTransactionStats } = jest.requireMock(
      '@/hooks/api/transactions'
    );
    const { useInventoryStats } = jest.requireMock('@/hooks/api/inventory');
    const { useFinancialAnalyticsSummary } = jest.requireMock(
      '@/hooks/api/useFinancialAnalytics'
    );
    const { useSalesTrends } = jest.requireMock('@/hooks/api/useSalesTrends');
    const { useTopProducts } = jest.requireMock('@/hooks/api/useTopProducts');
    const { useRecentTransactions } = jest.requireMock(
      '@/hooks/api/useRecentTransactions'
    );

    useTransactionStats.mockReturnValue({
      data: {
        totalSales: 25000,
        totalTransactions: 12,
        averageOrderValue: 2083.33,
        salesChange: 5.2,
      },
      isLoading: false,
    });

    useInventoryStats.mockReturnValue({
      data: {
        totalProducts: 120,
        lowStockItems: 5,
        inStockItems: 100,
        outOfStockItems: 15,
      },
      isLoading: false,
    });

    useFinancialAnalyticsSummary.mockReturnValue({
      data: {
        netProfit: 15000,
        totalRevenue: 60000,
        totalExpenses: 45000,
      },
      isLoading: false,
    });

    useSalesTrends.mockReturnValue({
      data: [
        { day: 'Mon', sales: 1000, transactions: 2, date: '2025-01-01' },
      ],
      isLoading: false,
    });

    useTopProducts.mockReturnValue({
      data: [
        { name: 'Product A', sales: 10 },
      ],
      isLoading: false,
    });

    useRecentTransactions.mockReturnValue({
      data: [
        {
          id: 1,
          customerName: 'Jane Doe',
          totalAmount: 500,
          totalItems: 2,
          firstItem: 'Product A',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    });
  });

  test('renders key dashboard sections with data', () => {
    render(<SimpleDashboard user={mockUser as any} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('POS')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Sales Trend (Last 7 Days)')).toBeInTheDocument();
    expect(screen.getByText('Top Products')).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});
