jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

jest.mock('@/lib/api-middleware', () => ({
  withAuth: jest.fn((handler: (...args: unknown[]) => unknown) => handler),
}));

const mockBuildFinanceRange = jest.fn();
const mockGetPreviousFinanceRange = jest.fn();
const mockGetFinanceAggregate = jest.fn();
const mockGetRecentFinanceTransactions = jest.fn();

jest.mock('@/lib/finance/aggregation', () => ({
  buildFinanceRange: (...args: unknown[]) => mockBuildFinanceRange(...args),
  getPreviousFinanceRange: (...args: unknown[]) =>
    mockGetPreviousFinanceRange(...args),
  getFinanceAggregate: (...args: unknown[]) => mockGetFinanceAggregate(...args),
  getRecentFinanceTransactions: (...args: unknown[]) =>
    mockGetRecentFinanceTransactions(...args),
}));

import { GET as getFinanceSummary } from '@/app/api/finance/summary/route';

describe('GET /api/finance/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks managers from the finance overview summary', async () => {
    const response = await getFinanceSummary({
      user: {
        id: '2',
        role: 'MANAGER',
        email: 'manager@example.com',
      },
      nextUrl: new URL('http://localhost/api/finance/summary'),
    } as any);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Insufficient permissions to view financial summary',
    });
    expect(mockGetFinanceAggregate).not.toHaveBeenCalled();
  });

  it('returns unified summary data for admins from the shared aggregation service', async () => {
    const currentRange = {
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
      groupBy: 'month',
    };
    const previousRange = {
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.999Z'),
      groupBy: 'month',
    };
    const yearRange = {
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
      groupBy: 'year',
    };

    mockBuildFinanceRange
      .mockReturnValueOnce(currentRange)
      .mockReturnValueOnce(yearRange);
    mockGetPreviousFinanceRange.mockReturnValue(previousRange);

    mockGetFinanceAggregate
      .mockResolvedValueOnce({
        summary: {
          totalIncome: 120000,
          totalExpenses: 45000,
          netProfit: 75000,
          totalTransactions: 18,
        },
      })
      .mockResolvedValueOnce({
        summary: {
          totalIncome: 95000,
          totalExpenses: 30000,
          netProfit: 65000,
          totalTransactions: 14,
        },
      })
      .mockResolvedValueOnce({
        summary: {
          totalIncome: 410000,
          totalExpenses: 180000,
          netProfit: 230000,
          totalTransactions: 63,
        },
      });

    mockGetRecentFinanceTransactions.mockResolvedValue([
      {
        id: 'sale-1',
        transactionNumber: 'POS-001',
        type: 'INCOME',
        amount: 15000,
        description: 'POS sale',
        date: new Date('2026-04-29T12:00:00.000Z'),
        paymentMethod: 'CASH',
        source: 'POS_SALE',
      },
    ]);

    const response = await getFinanceSummary({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      nextUrl: new URL(
        'http://localhost/api/finance/summary?startDate=2026-04-01&endDate=2026-04-30'
      ),
    } as any);

    expect(response.status).toBe(200);
    expect(mockBuildFinanceRange).toHaveBeenCalledTimes(2);
    expect(mockGetPreviousFinanceRange).toHaveBeenCalledWith(currentRange);
    expect(mockGetFinanceAggregate).toHaveBeenNthCalledWith(1, currentRange);
    expect(mockGetFinanceAggregate).toHaveBeenNthCalledWith(2, previousRange);
    expect(mockGetFinanceAggregate).toHaveBeenNthCalledWith(3, yearRange);
    expect(mockGetRecentFinanceTransactions).toHaveBeenCalledWith(10);

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        currentMonth: {
          income: 120000,
          expenses: 45000,
          netIncome: 75000,
          transactionCount: 18,
        },
        previousMonth: {
          income: 95000,
          expenses: 30000,
          netIncome: 65000,
          transactionCount: 14,
        },
        yearToDate: {
          income: 410000,
          expenses: 180000,
          netIncome: 230000,
          transactionCount: 63,
        },
        recentTransactions: [
          {
            transactionNumber: 'POS-001',
            source: 'POS_SALE',
            amount: 15000,
          },
        ],
        dataSources: {
          includeSales: true,
          includePurchases: true,
        },
      },
    });
  });
});
