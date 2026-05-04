import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FinanceOverview } from '@/components/finance/FinanceOverview';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

jest.mock('@/components/ui/date-range-picker-with-presets', () => ({
  DateRangePickerWithPresets: () => <div data-testid="date-range-picker" />,
}));

describe('FinanceOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-05-10T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads the finance summary on the client without server prefetch hydration', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          currentMonth: {
            income: 1200,
            expenses: 650,
            netIncome: 550,
            transactionCount: 5,
          },
          previousMonth: {
            income: 900,
            expenses: 450,
            netIncome: 450,
            transactionCount: 4,
          },
          recentTransactions: [
            {
              id: 'sale-1',
              transactionNumber: 'POS-001',
              amount: 1000,
              description: 'POS sale',
              transactionDate: '2026-05-09T12:00:00.000Z',
              paymentMethod: 'CASH',
              source: 'POS_SALE',
              type: 'INCOME',
            },
          ],
        },
      }),
    });

    global.fetch = fetchMock as any;

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FinanceOverview
          user={{
            id: '1',
            email: 'admin@example.com',
            role: 'ADMIN',
          } as any}
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText('₦1,200.00')).toBeInTheDocument();
    expect(screen.getByText('Operating Revenue')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/finance/summary?startDate=2026-05-01&endDate=2026-05-10'
      );
    });
  });
});
