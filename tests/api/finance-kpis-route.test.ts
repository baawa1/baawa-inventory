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

import { GET as getFinanceKpis } from '@/app/api/finance/kpis/route';

const periodRange = {
  startDate: new Date('2026-04-01T00:00:00.000Z'),
  endDate: new Date('2026-04-30T23:59:59.999Z'),
  groupBy: 'month',
};

const periodAggregate = {
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
};

describe('GET /api/finance/kpis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-04-15T12:00:00.000Z'));
    mockBuildFinanceRange.mockReturnValue(periodRange);
    mockGetFinanceAggregate
      .mockResolvedValueOnce(periodAggregate)
      .mockResolvedValueOnce(periodAggregate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses operating revenue for profit metrics and cash flow for runway', async () => {
    const response = await getFinanceKpis({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/kpis?months=1',
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data.summary).toMatchObject({
      totalIncome: 1200,
      totalExpenses: 650,
      netProfit: 550,
      profitMargin: 45.83,
    });
    expect(payload.data.runway).toMatchObject({
      estimatedCashPosition: 850,
      months: 1.3,
      status: 'critical',
    });
    expect(payload.data.efficiency).toMatchObject({
      operatingExpenseRatio: 20.83,
      dailyRevenue: 40,
    });
    const [startDate, endDate, groupBy] = mockBuildFinanceRange.mock.calls[0];
    expect(startDate).toBeInstanceOf(Date);
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(3);
    expect(startDate.getDate()).toBe(1);
    expect(endDate).toEqual(new Date('2026-04-15T12:00:00.000Z'));
    expect(groupBy).toBe('month');
  });

  it('returns a validation error for invalid KPI month counts', async () => {
    const response = await getFinanceKpis({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/kpis?months=0',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Months must be at least 1',
      code: 'VALIDATION_ERROR',
    });
    expect(mockGetFinanceAggregate).not.toHaveBeenCalled();
  });
});
