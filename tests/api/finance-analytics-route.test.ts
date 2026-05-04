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

jest.mock('@/lib/finance/aggregation', () => ({
  buildFinanceRange: (...args: unknown[]) => mockBuildFinanceRange(...args),
  getPreviousFinanceRange: (...args: unknown[]) =>
    mockGetPreviousFinanceRange(...args),
  getFinanceAggregate: (...args: unknown[]) => mockGetFinanceAggregate(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { GET as getFinanceAnalytics } from '@/app/api/finance/analytics/route';

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

const currentAggregate = {
  transactions: [
    {
      id: 'pos-1',
      source: 'POS_SALE',
      sourceId: 1,
      transactionNumber: 'POS-001',
      type: 'INCOME',
      amount: 1000,
      date: new Date('2026-04-01T10:00:00.000Z'),
      paymentMethod: 'CASH',
      description: 'POS sale',
      category: 'POS_SALE',
      categoryLabel: 'POS Sales',
      status: 'COMPLETED',
      flaggedOverlap: false,
    },
    {
      id: 'inc-1',
      source: 'MANUAL',
      sourceId: 2,
      transactionNumber: 'FIN-002',
      type: 'INCOME',
      amount: 200,
      date: new Date('2026-04-02T10:00:00.000Z'),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Service income',
      category: 'SERVICES',
      categoryLabel: 'Services',
      status: 'APPROVED',
      flaggedOverlap: false,
    },
    {
      id: 'inv-1',
      source: 'MANUAL',
      sourceId: 3,
      transactionNumber: 'FIN-003',
      type: 'INCOME',
      amount: 300,
      date: new Date('2026-04-03T10:00:00.000Z'),
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
      sourceId: 4,
      transactionNumber: 'FIN-004',
      type: 'EXPENSE',
      amount: 250,
      date: new Date('2026-04-04T10:00:00.000Z'),
      paymentMethod: 'CASH',
      description: 'Rent',
      category: 'RENT_UTILITIES',
      categoryLabel: 'Rent & Utilities',
      status: 'APPROVED',
      flaggedOverlap: false,
    },
    {
      id: 'stock-1',
      source: 'STOCK_PURCHASE',
      sourceId: 5,
      transactionNumber: 'PO-005',
      type: 'EXPENSE',
      amount: 400,
      date: new Date('2026-04-05T10:00:00.000Z'),
      paymentMethod: null,
      description: 'Stock purchase',
      category: 'PURCHASE',
      categoryLabel: 'Stock Purchase',
      status: 'COMPLETED',
      flaggedOverlap: false,
    },
  ],
  summary: {
    totalIncome: 1500,
    totalExpenses: 650,
    netProfit: 850,
    totalTransactions: 5,
    averageTransactionValue: 430,
    topPaymentMethod: 'CASH',
  },
  paymentMethodDistribution: [
    { method: 'CASH', count: 2, amount: 1250 },
    { method: 'BANK_TRANSFER', count: 2, amount: 500 },
  ],
  dailyTrends: [],
  expenseBreakdown: {
    RENT_UTILITIES: 250,
  },
  topVendors: [],
};

const previousAggregate = {
  transactions: [
    {
      id: 'pos-2',
      source: 'POS_SALE',
      sourceId: 6,
      transactionNumber: 'POS-010',
      type: 'INCOME',
      amount: 800,
      date: new Date('2026-03-01T10:00:00.000Z'),
      paymentMethod: 'CASH',
      description: 'POS sale',
      category: 'POS_SALE',
      categoryLabel: 'POS Sales',
      status: 'COMPLETED',
      flaggedOverlap: false,
    },
    {
      id: 'inc-2',
      source: 'MANUAL',
      sourceId: 7,
      transactionNumber: 'FIN-012',
      type: 'INCOME',
      amount: 100,
      date: new Date('2026-03-02T10:00:00.000Z'),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Service income',
      category: 'SERVICES',
      categoryLabel: 'Services',
      status: 'APPROVED',
      flaggedOverlap: false,
    },
    {
      id: 'inv-2',
      source: 'MANUAL',
      sourceId: 8,
      transactionNumber: 'FIN-013',
      type: 'INCOME',
      amount: 100,
      date: new Date('2026-03-03T10:00:00.000Z'),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Owner investment',
      category: 'INVESTMENTS',
      categoryLabel: 'Investments',
      status: 'APPROVED',
      flaggedOverlap: false,
    },
    {
      id: 'exp-2',
      source: 'MANUAL',
      sourceId: 9,
      transactionNumber: 'FIN-014',
      type: 'EXPENSE',
      amount: 150,
      date: new Date('2026-03-04T10:00:00.000Z'),
      paymentMethod: 'CASH',
      description: 'Fuel',
      category: 'TRANSPORTATION',
      categoryLabel: 'Transportation',
      status: 'APPROVED',
      flaggedOverlap: false,
    },
    {
      id: 'stock-2',
      source: 'STOCK_PURCHASE',
      sourceId: 10,
      transactionNumber: 'PO-015',
      type: 'EXPENSE',
      amount: 300,
      date: new Date('2026-03-05T10:00:00.000Z'),
      paymentMethod: null,
      description: 'Stock purchase',
      category: 'PURCHASE',
      categoryLabel: 'Stock Purchase',
      status: 'COMPLETED',
      flaggedOverlap: false,
    },
  ],
  summary: {
    totalIncome: 1000,
    totalExpenses: 450,
    netProfit: 550,
    totalTransactions: 5,
    averageTransactionValue: 290,
    topPaymentMethod: 'CASH',
  },
  paymentMethodDistribution: [],
  dailyTrends: [],
  expenseBreakdown: {},
  topVendors: [],
};

describe('GET /api/finance/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildFinanceRange.mockReturnValue(currentRange);
    mockGetPreviousFinanceRange.mockReturnValue(previousRange);
    mockGetFinanceAggregate
      .mockResolvedValueOnce(currentAggregate)
      .mockResolvedValueOnce(previousAggregate);
  });

  it('computes revenue trends from operating revenue only', async () => {
    const response = await getFinanceAnalytics({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/analytics?groupBy=day',
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data.summary.totalRevenue).toBe(1200);
    expect(payload.data.summary.netProfit).toBe(550);
    expect(payload.data.summary.revenueGrowth).toBeCloseTo(33.3333, 3);

    expect(payload.data.charts.dailyTrends).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: '2026-04-03',
          revenue: 0,
          transactions: 1,
        }),
      ])
    );
  });

  it('returns a validation error for malformed analytics dates', async () => {
    const response = await getFinanceAnalytics({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/analytics?dateFrom=not-a-date',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Invalid date',
      code: 'VALIDATION_ERROR',
    });
    expect(mockGetFinanceAggregate).not.toHaveBeenCalled();
  });
});
