import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { SimpleDashboard } from '@/components/dashboard/SimpleDashboard';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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

jest.mock('@/components/ui/date-range-picker-with-presets', () => ({
  DateRangePickerWithPresets: ({
    onDateChange,
  }: {
    onDateChange?: (_range: any) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onDateChange?.({
          from: new Date('2026-02-01T00:00:00.000Z'),
          to: new Date('2026-02-07T23:59:59.999Z'),
        })
      }
    >
      Change Range
    </button>
  ),
}));

jest.mock('@/hooks/api/useDashboard', () => ({
  useDashboardAnalytics: jest.fn(),
  useDashboardOperations: jest.fn(),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

type DashboardRole = 'ADMIN' | 'MANAGER' | 'STAFF';

const adminUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  firstName: 'Admin',
  role: 'ADMIN',
  status: 'APPROVED',
  isEmailVerified: true,
};

const managerUser = {
  ...adminUser,
  id: '2',
  email: 'manager@example.com',
  name: 'Manager User',
  firstName: 'Manager',
  role: 'MANAGER',
};

const staffUser = {
  ...adminUser,
  id: '3',
  email: 'staff@example.com',
  name: 'Staff User',
  firstName: 'Staff',
  role: 'STAFF',
};

const mockAnalyticsRefetch = jest.fn();
const mockOperationsRefetch = jest.fn();

let currentRole: DashboardRole = 'ADMIN';
let analyticsMode: 'success' | 'error' = 'success';

function buildAnalyticsResponse(
  role: DashboardRole,
  label: string
) {
  const isAdmin = role === 'ADMIN';
  const canReadTransactions = role !== 'STAFF';

  return {
    period: {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-15T23:59:59.999Z',
      comparisonFrom: '2025-12-17T00:00:00.000Z',
      comparisonTo: '2025-12-31T23:59:59.999Z',
      label,
      comparisonLabel: 'Compared with the previous 15-day period',
      days: 15,
    },
    permissions: {
      role,
      canViewRevenue: isAdmin,
      canViewFinanceAnalytics: isAdmin,
      canReadFinanceTransactions: canReadTransactions,
      canManageProducts: role !== 'STAFF',
      canManageUsers: isAdmin,
      canAccessReports: role !== 'STAFF',
    },
    hasData: true,
    kpis: isAdmin
      ? [
          {
            id: 'operating-revenue',
            title: 'Operating Revenue',
            value: 250000,
            format: 'currency',
            description: 'Revenue across POS and manual income',
            delta: 14.2,
            deltaLabel: 'vs previous period',
            tone: 'green',
          },
        ]
      : [
          {
            id: 'items-sold',
            title: 'Items Sold',
            value: 84,
            format: 'number',
            description: 'Units sold across completed transactions',
            delta: 8.5,
            deltaLabel: 'vs previous period',
            tone: 'green',
          },
        ],
    charts: {
      primaryTrend: {
        title: isAdmin ? 'Revenue Trend' : 'Sales Activity Trend',
        description: 'Trend description',
        series: isAdmin
          ? [
              {
                key: 'sales',
                label: 'Revenue',
                color: '#2563eb',
                format: 'currency',
              },
            ]
          : [
              {
                key: 'transactions',
                label: 'Transactions',
                color: '#2563eb',
                format: 'number',
              },
            ],
        data: [
          {
            date: '2026-01-01',
            label: 'Jan 1',
            sales: 1000,
            transactions: 4,
            items: 10,
          },
        ],
      },
      topProducts: {
        title: 'Top Products',
        description: 'Top description',
        metricLabel: isAdmin ? 'Revenue' : 'Units sold',
        data: [
          {
            id: 1,
            name: 'Product A',
            sku: 'SKU-A',
            value: isAdmin ? 50000 : 12,
            valueFormat: isAdmin ? 'currency' : 'number',
            secondaryLabel: isAdmin ? 'Units sold' : 'Sale lines',
            secondaryValue: isAdmin ? 12 : 4,
          },
        ],
      },
    },
    modules: [
      {
        id: 'pos',
        title: 'POS',
        description: 'Run checkout and review sales activity.',
        href: '/pos',
        tone: 'blue',
        badge: '12 completed sales',
        caption: '84 items sold in the selected period',
      },
      {
        id: 'inventory',
        title: 'Inventory',
        description: 'Monitor stock levels and keep products moving.',
        href: '/inventory',
        tone: 'green',
        badge: '3 low-stock items',
        caption: '120 active products',
      },
      {
        id: 'finance',
        title: 'Finance',
        description: 'Finance entry point',
        href: isAdmin ? '/finance' : '/finance/transactions',
        tone: 'purple',
        badge: 'Finance badge',
        caption: 'Finance caption',
      },
      {
        id: 'admin',
        title: 'Admin',
        description: 'Admin entry point',
        href: '/admin',
        tone: 'slate',
        badge: 'Admin badge',
        caption: 'Admin caption',
      },
    ],
  };
}

const operationsData = {
  inventoryHealth: {
    totalProducts: 120,
    inStockItems: 100,
    lowStockItems: 15,
    outOfStockItems: 5,
  },
  recentTransactions: [
    {
      id: 1,
      transactionNumber: 'TX-001',
      customerName: 'Jane Doe',
      totalAmount: 12500,
      totalItems: 3,
      firstItem: 'Product A',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
  ],
  quickActions: [
    {
      id: 'open-pos',
      label: 'Open POS',
      href: '/pos',
      description: 'Start checkout and process sales',
    },
    {
      id: 'inventory-overview',
      label: 'Inventory',
      href: '/inventory',
      description: 'Review stock levels and product health',
    },
    {
      id: 'add-product',
      label: 'Add Product',
      href: '/inventory/products/add',
      description: 'Create a new product listing',
    },
    {
      id: 'finance-overview',
      label: 'Finance Overview',
      href: '/finance',
      description: 'Review profitability and cash flow',
    },
    {
      id: 'finance-transactions',
      label: 'Finance Transactions',
      href: '/finance/transactions',
      description: 'Review income and expense records',
    },
    {
      id: 'finance-reports',
      label: 'Finance Reports',
      href: '/finance/reports',
      description: 'Open financial reports and exports',
    },
    {
      id: 'transaction-history',
      label: 'Transaction History',
      href: '/pos/history',
      description: 'Review recent checkout activity',
    },
    {
      id: 'admin-settings',
      label: 'Admin',
      href: '/admin',
      description: 'Manage users, approvals, and settings',
    },
  ],
};

describe('SimpleDashboard', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
    jest.clearAllMocks();
    currentRole = 'ADMIN';
    analyticsMode = 'success';

    const { useDashboardAnalytics, useDashboardOperations } = jest.requireMock(
      '@/hooks/api/useDashboard'
    );
    const { usePermissions } = jest.requireMock('@/hooks/usePermissions');

    useDashboardAnalytics.mockImplementation((dateRange?: any) => {
      if (analyticsMode === 'error') {
        return {
          data: undefined,
          isLoading: false,
          isError: true,
          refetch: mockAnalyticsRefetch,
        };
      }

      const label =
        dateRange?.from?.getMonth?.() === 1
          ? 'Feb 1 - Feb 7, 2026'
          : 'Jan 1 - Jan 15, 2026';

      return {
        data: buildAnalyticsResponse(currentRole, label),
        isLoading: false,
        isError: false,
        refetch: mockAnalyticsRefetch,
      };
    });

    useDashboardOperations.mockReturnValue({
      data: operationsData,
      isLoading: false,
      isError: false,
      refetch: mockOperationsRefetch,
    });

    usePermissions.mockReturnValue({
      canManageProducts: false,
      canReadTransactions: false,
      canAccessFinancialReports: false,
      canManageUsers: false,
      canAccessPOS: false,
      isAdmin: false,
      isManager: false,
      isStaff: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders admin finance and admin actions', () => {
    currentRole = 'ADMIN';

    render(<SimpleDashboard user={adminUser as any} />);

    expect(screen.getByText('Operating Revenue')).toBeInTheDocument();
    expect(screen.getByText(/^Finance$/)).toBeInTheDocument();
    expect(screen.getAllByText(/^Admin$/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Finance Overview')).toBeInTheDocument();
    expect(screen.getByText('Finance Reports')).toBeInTheDocument();
    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  test('renders manager-safe content without admin or finance report links', () => {
    currentRole = 'MANAGER';

    render(<SimpleDashboard user={managerUser as any} />);

    expect(screen.getByText('Items Sold')).toBeInTheDocument();
    expect(screen.queryByText('Operating Revenue')).not.toBeInTheDocument();
    expect(screen.getByText(/^Finance$/)).toBeInTheDocument();
    expect(screen.getByText('Finance Transactions')).toBeInTheDocument();
    expect(screen.getByText('Add Product')).toBeInTheDocument();
    expect(screen.queryByText('Finance Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance Reports')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Admin$/)).not.toBeInTheDocument();
  });

  test('hides finance and product-management actions for staff', () => {
    currentRole = 'STAFF';

    render(<SimpleDashboard user={staffUser as any} />);

    expect(screen.getByText('Items Sold')).toBeInTheDocument();
    expect(screen.queryByText(/^Finance$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Add Product')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Admin$/)).not.toBeInTheDocument();
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
  });

  test('shows analytics retry state instead of zeros on analytics failure', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    analyticsMode = 'error';

    render(<SimpleDashboard user={adminUser as any} />);

    expect(screen.getByText('Analytics unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockAnalyticsRefetch).toHaveBeenCalled();
  });

  test('updates filtered analytics when the date range changes while operations remain visible', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<SimpleDashboard user={adminUser as any} />);

    expect(screen.getByText('Jan 1 - Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Open POS')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change Range' }));

    expect(screen.getByText('Feb 1 - Feb 7, 2026')).toBeInTheDocument();
    expect(screen.getByText('Open POS')).toBeInTheDocument();
  });
});
