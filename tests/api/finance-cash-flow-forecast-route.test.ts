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
const mockGetFinanceAggregate = jest.fn();

jest.mock('@/lib/finance/aggregation', () => ({
  buildFinanceRange: (...args: unknown[]) => mockBuildFinanceRange(...args),
  getFinanceAggregate: (...args: unknown[]) => mockGetFinanceAggregate(...args),
}));

import { GET as getCashFlowForecast } from '@/app/api/finance/cash-flow-forecast/route';

const historicalRange = {
  startDate: new Date('2026-05-01T00:00:00.000Z'),
  endDate: new Date('2026-05-10T23:59:59.999Z'),
  groupBy: 'month',
};

const forecastAggregate = {
  transactions: [
    {
      id: 'pos-1',
      source: 'POS_SALE',
      sourceId: 1,
      transactionNumber: 'POS-001',
      type: 'INCOME',
      amount: 100,
      date: new Date('2026-05-01T10:00:00.000Z'),
      paymentMethod: 'CASH',
      description: 'POS sale',
      category: 'POS_SALE',
      categoryLabel: 'POS Sales',
      status: 'COMPLETED',
      flaggedOverlap: false,
    },
    {
      id: 'inv-1',
      source: 'MANUAL',
      sourceId: 2,
      transactionNumber: 'FIN-002',
      type: 'INCOME',
      amount: 300,
      date: new Date('2026-05-02T10:00:00.000Z'),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Owner investment',
      category: 'INVESTMENTS',
      categoryLabel: 'Investments',
      status: 'APPROVED',
      flaggedOverlap: false,
    },
    {
      id: 'exp-1',
      source: 'MANUAL',
      sourceId: 3,
      transactionNumber: 'FIN-003',
      type: 'EXPENSE',
      amount: 50,
      date: new Date('2026-05-03T10:00:00.000Z'),
      paymentMethod: 'CASH',
      description: 'Expense',
      category: 'OTHER',
      categoryLabel: 'Other',
      status: 'APPROVED',
      flaggedOverlap: false,
    },
  ],
  summary: {
    totalIncome: 400,
    totalExpenses: 50,
    netProfit: 350,
    totalTransactions: 3,
    averageTransactionValue: 150,
    topPaymentMethod: 'CASH',
  },
  paymentMethodDistribution: [],
  dailyTrends: [],
  expenseBreakdown: {},
  topVendors: [],
};

describe('GET /api/finance/cash-flow-forecast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-05-10T12:00:00.000Z'));
    mockBuildFinanceRange.mockReturnValue(historicalRange);
    mockGetFinanceAggregate
      .mockResolvedValueOnce(forecastAggregate)
      .mockResolvedValueOnce(forecastAggregate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps financing inflows in cash position but out of average daily income', async () => {
    const response = await getCashFlowForecast({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/cash-flow-forecast?days=10&historicalMonths=1',
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data.metrics.current).toMatchObject({
      cashPosition: 350,
      date: '2026-05-10',
    });
    expect(payload.data.metrics.averages).toMatchObject({
      dailyIncome: 10,
      dailyExpense: 5,
      dailyNetCashFlow: 5,
    });
  });

  it('returns a validation error for invalid forecast day counts', async () => {
    const response = await getCashFlowForecast({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/cash-flow-forecast?days=0',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Forecast days must be at least 1',
      code: 'VALIDATION_ERROR',
    });
    expect(mockGetFinanceAggregate).not.toHaveBeenCalled();
  });
});
