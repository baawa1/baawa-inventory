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

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { GET as getFinanceReports } from '@/app/api/finance/reports/route';

const reportRange = {
  startDate: new Date('2026-04-01T00:00:00.000Z'),
  endDate: new Date('2026-04-30T23:59:59.999Z'),
  groupBy: 'month',
};

const aggregate = {
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
  expenseBreakdown: {},
  topVendors: [],
};

describe('GET /api/finance/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildFinanceRange.mockReturnValue(reportRange);
    mockGetFinanceAggregate.mockResolvedValue(aggregate);
  });

  it('keeps investments out of revenue and profit while preserving financing cash flow', async () => {
    const response = await getFinanceReports({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/reports?period=monthly',
    } as any);

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.data.profitLoss).toMatchObject({
      revenue: {
        sales: 1000,
        otherIncome: 200,
        totalRevenue: 1200,
      },
      expenses: {
        costOfGoods: 400,
        operatingExpenses: 250,
        totalExpenses: 650,
      },
      grossProfit: 800,
      netProfit: 550,
    });
    expect(payload.data.cashFlow.financingActivities).toMatchObject({
      loans: 300,
      netFinancingCashFlow: 300,
    });
    expect(payload.data.totalCashFlow).toBe(850);
    expect(payload.data.summary).toMatchObject({
      totalIncome: 1200,
      totalExpenses: 650,
      netProfit: 550,
      grossProfit: 800,
    });
  });

  it('returns a validation error for reversed report date ranges', async () => {
    const response = await getFinanceReports({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/reports?dateFrom=2026-04-30&dateTo=2026-04-01',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Start date must be before end date',
      code: 'VALIDATION_ERROR',
    });
    expect(mockGetFinanceAggregate).not.toHaveBeenCalled();
  });
});
