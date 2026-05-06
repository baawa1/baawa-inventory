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
const mockGetReceivablesSnapshot = jest.fn();

jest.mock('@/lib/finance/ledger', () => {
  const dateRange = jest.requireActual('@/lib/finance/date-range');

  return {
    buildFinanceRange: dateRange.buildFinanceRange,
    getPreviousFinanceRange: dateRange.getPreviousFinanceRange,
    getFinanceAggregate: (...args: unknown[]) => mockGetFinanceAggregate(...args),
    getReceivablesSnapshot: (...args: unknown[]) =>
      mockGetReceivablesSnapshot(...args),
  };
});

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { GET as getFinanceAnalytics } from '@/app/api/finance/analytics/route';

function buildAggregate(netProfit: number) {
  return {
    transactions: [
      {
        source: 'POS',
        eventType: 'POS_CASH_SALE',
        category: 'POS_SALES',
        date: new Date('2026-04-10T10:00:00.000Z'),
        profitIn: netProfit + 100,
        profitOut: 40,
        cashIn: netProfit + 100,
        cashOut: 0,
        netCashImpact: netProfit + 100,
      },
      {
        source: 'MANUAL',
        eventType: 'MANUAL_OPERATING_EXPENSE',
        category: 'RENT_UTILITIES',
        date: new Date('2026-04-11T10:00:00.000Z'),
        profitIn: 0,
        profitOut: 60,
        cashIn: 0,
        cashOut: 60,
        netCashImpact: -60,
      },
    ],
    summary: {
      totalIncome: netProfit + 100,
      totalExpenses: 100,
      netProfit,
      totalTransactions: 2,
      averageTransactionValue: 100,
      topPaymentMethod: 'CASH',
    },
    paymentMethodDistribution: [],
    dailyTrends: [],
    expenseBreakdown: {
      RENT_UTILITIES: 60,
    },
    topVendors: [],
    trading: {
      salesRevenue: netProfit + 100,
      manualOperatingIncome: 0,
      operatingRevenue: netProfit + 100,
      costOfGoodsSold: 40,
      operatingExpenses: 60,
      grossProfit: netProfit + 60,
      netProfit,
    },
    cashMovement: {
      cashReceived: netProfit + 100,
      cashSpent: 60,
      customerCollections: netProfit + 100,
      ownerFunding: 0,
      stockPurchases: 0,
      operatingExpensePayments: 60,
      manualIncomeCollections: 0,
      netCashMovement: netProfit + 40,
    },
    businessPosition: {
      inventoryValueOnHand: 1000,
      inventoryUnitsOnHand: 10,
      inventorySkusTracked: 3,
      receivablesOutstanding: 500,
      receivableTransactions: 1,
      customersWithBalances: 1,
      estimated: false,
      estimatedReasons: [],
    },
    methodology: {
      status: 'exact',
      estimated: false,
      rebuiltFromOperationalData: true,
      historicalRebuild: 'best_effort',
      reasons: [],
    },
  };
}

describe('GET /api/finance/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFinanceAggregate
      .mockResolvedValueOnce(buildAggregate(550))
      .mockResolvedValueOnce(buildAggregate(450));
    mockGetReceivablesSnapshot.mockResolvedValue({
      receivables: [
        {
          customer: {
            name: 'Customer One',
          },
          outstandingAmount: 500,
          agingBucket: '0-30',
        },
      ],
      summary: {
        totalOutstanding: 500,
        totalTransactions: 1,
        averageDaysOutstanding: 5,
        customersWithBalances: 1,
      },
    });
  });

  it('blocks managers from financial analytics', async () => {
    const response = await getFinanceAnalytics({
      user: {
        id: '2',
        role: 'MANAGER',
        email: 'manager@example.com',
      },
      url: 'http://localhost/api/finance/analytics',
    } as any);

    expect(response.status).toBe(403);
    expect(mockGetFinanceAggregate).not.toHaveBeenCalled();
  });

  it('returns ledger-based analytics for admins', async () => {
    const response = await getFinanceAnalytics({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/analytics?dateFrom=2026-04-01&dateTo=2026-04-30&groupBy=day',
    } as any);

    expect(response.status).toBe(200);
    expect(mockGetFinanceAggregate).toHaveBeenCalledTimes(2);
    expect(mockGetReceivablesSnapshot).toHaveBeenCalledWith({
      asOfDate: expect.any(Date),
    });

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        overview: {
          trading: {
            netProfit: 550,
          },
          businessPosition: {
            receivablesOutstanding: 500,
          },
        },
        receivables: {
          summary: {
            totalOutstanding: 500,
          },
        },
      },
    });
  });
});
