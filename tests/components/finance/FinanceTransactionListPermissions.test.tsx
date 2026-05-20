import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinanceTransactionList } from '@/components/finance/FinanceTransactionList';
import { useFinancialTransactions } from '@/hooks/api/finance';

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
    error: jest.fn(),
  },
}));

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

jest.mock('@/hooks/api/finance', () => ({
  useFinancialTransactions: jest.fn(),
}));

jest.mock('@/components/ui/date-range-picker-with-presets', () => ({
  DateRangePickerWithPresets: () => <div data-testid="date-range-picker" />,
}));

jest.mock('@/components/layouts/DashboardTableLayout', () => ({
  DashboardTableLayout: ({ columns, filters, data, renderCell }: any) => (
    <div>
      <div data-testid="columns">
        {columns.map((column: any) => (
          <span key={column.key}>{column.label}</span>
        ))}
      </div>
      <div data-testid="filters">
        {filters.map((filter: any) => (
          <span key={filter.key}>{filter.label}</span>
        ))}
      </div>
      <div data-testid="rows">
        {data.map((item: any) => (
          <div key={item.rowId || item.id}>
            {columns.map((column: any) => (
              <span key={column.key}>{renderCell(item, column.key)}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
}));

const mockUseFinancialTransactions =
  useFinancialTransactions as jest.MockedFunction<typeof useFinancialTransactions>;

const ledgerRow = {
  id: 2000001,
  rowId: 'SalesTransaction-1-POS_CASH_SALE',
  transactionNumber: 'POS-001',
  type: 'INCOME',
  amount: 1000,
  eventType: 'POS_CASH_SALE',
  displayLabel: 'POS Cash Sale',
  source: 'POS',
  sourceId: 1,
  sourceModel: 'SalesTransaction',
  sourcePath: '/pos/history?search=POS-001',
  description: 'POS sale',
  transactionDate: '2026-04-30T15:45:00.000Z',
  paymentMethod: 'CASH',
  status: 'PAID',
  paymentState: 'PAID',
  category: 'POS_SALES',
  categoryLabel: 'POS Sales',
  cashIn: 1000,
  cashOut: 0,
  profitIn: 1000,
  profitOut: 300,
  inventoryValueIn: 0,
  inventoryValueOut: 300,
  receivableIncrease: 0,
  receivableDecrease: 0,
  netCashImpact: 1000,
  netProfitImpact: 700,
  netInventoryImpact: -300,
  netReceivableImpact: 0,
  editable: false,
  estimated: false,
};

const baseUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'APPROVED',
  isEmailVerified: true,
} as const;

describe('FinanceTransactionList permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFinancialTransactions.mockReturnValue({
      data: {
        data: [ledgerRow],
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
          total: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  it('hides profit and inventory controls for managers', () => {
    render(
      <FinanceTransactionList
        user={{
          ...baseUser,
          id: '2',
          role: 'MANAGER',
          email: 'manager@example.com',
        }}
      />
    );

    expect(screen.getByTestId('columns')).not.toHaveTextContent('Profit');
    expect(screen.getByTestId('columns')).not.toHaveTextContent('Inventory');
    expect(screen.getByTestId('filters')).not.toHaveTextContent('Profit Impact');
    expect(mockUseFinancialTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        profitImpact: undefined,
      }),
      expect.any(Object)
    );
  });

  it('keeps profit and inventory controls visible for admins', () => {
    render(<FinanceTransactionList user={baseUser} />);

    expect(screen.getByTestId('columns')).toHaveTextContent('Profit');
    expect(screen.getByTestId('columns')).toHaveTextContent('Inventory');
    expect(screen.getByTestId('filters')).toHaveTextContent('Profit Impact');
  });
});
