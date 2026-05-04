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

const mockGetFinanceAggregate = jest.fn();

jest.mock('@/lib/finance/aggregation', () => ({
  getFinanceAggregate: (...args: unknown[]) => mockGetFinanceAggregate(...args),
}));

import { GET as getProfitMargins } from '@/app/api/finance/profit-margins/route';

const aprilAggregate = {
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

const mayAggregate = {
  transactions: [
    {
      id: 'pos-2',
      source: 'POS_SALE',
      sourceId: 6,
      transactionNumber: 'POS-010',
      type: 'INCOME',
      amount: 800,
      date: new Date('2026-05-01T10:00:00.000Z'),
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
      date: new Date('2026-05-02T10:00:00.000Z'),
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
      date: new Date('2026-05-03T10:00:00.000Z'),
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
      date: new Date('2026-05-04T10:00:00.000Z'),
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
      date: new Date('2026-05-05T10:00:00.000Z'),
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
};

describe('GET /api/finance/profit-margins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-05-15T12:00:00.000Z'));
    mockGetFinanceAggregate
      .mockResolvedValueOnce(aprilAggregate)
      .mockResolvedValueOnce(mayAggregate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('excludes investments from revenue sources and margin calculations', async () => {
    const response = await getProfitMargins({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/profit-margins?months=2',
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data.bySource).toEqual([
      {
        source: 'POS_SALES',
        revenue: 1800,
        transactionCount: 2,
      },
      {
        source: 'SERVICES',
        revenue: 300,
        transactionCount: 2,
      },
    ]);
    expect(payload.data.trends).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          revenue: 1200,
          grossMargin: 66.67,
          netMargin: 45.83,
          operatingMargin: 45.83,
        }),
      ])
    );
    expect(payload.data.summary).toMatchObject({
      totalRevenue: 2100,
      totalGrossProfit: 1400,
      totalNetProfit: 1000,
      averageGrossMargin: 66.67,
      averageNetMargin: 47.62,
    });
  });

  it('returns a validation error for invalid month counts', async () => {
    const response = await getProfitMargins({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/profit-margins?months=0',
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
