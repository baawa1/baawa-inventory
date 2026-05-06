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

jest.mock('@/lib/finance/ledger', () => {
  const dateRange = jest.requireActual('@/lib/finance/date-range');

  return {
    buildFinanceRange: dateRange.buildFinanceRange,
    getFinanceAggregate: (...args: unknown[]) => mockGetFinanceAggregate(...args),
  };
});

jest.mock('@/lib/db', () => ({
  prisma: {
    financialReport: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { GET as getFinanceReports } from '@/app/api/finance/reports/route';

const aggregate = {
  transactions: [],
  summary: {
    totalIncome: 1200,
    totalExpenses: 650,
    netProfit: 550,
    totalTransactions: 5,
    averageTransactionValue: 430,
    topPaymentMethod: 'CASH',
  },
  paymentMethodDistribution: [],
  dailyTrends: [],
  expenseBreakdown: {},
  topVendors: [],
  trading: {
    salesRevenue: 1000,
    manualOperatingIncome: 200,
    operatingRevenue: 1200,
    costOfGoodsSold: 400,
    operatingExpenses: 250,
    grossProfit: 800,
    netProfit: 550,
  },
  cashMovement: {
    cashReceived: 1500,
    cashSpent: 650,
    customerCollections: 1000,
    ownerFunding: 300,
    stockPurchases: 400,
    operatingExpensePayments: 250,
    manualIncomeCollections: 200,
    netCashMovement: 850,
  },
  businessPosition: {
    inventoryValueOnHand: 2500,
    inventoryUnitsOnHand: 20,
    inventorySkusTracked: 4,
    receivablesOutstanding: 600,
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

describe('GET /api/finance/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFinanceAggregate.mockResolvedValue(aggregate);
  });

  it('returns ledger-based financial report data for admins', async () => {
    const response = await getFinanceReports({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/reports?period=monthly&dateFrom=2026-04-01&dateTo=2026-04-30',
    } as any);

    expect(response.status).toBe(200);
    expect(mockGetFinanceAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        type: 'all',
      }),
      { groupBy: 'day' }
    );

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        summary: {
          totalIncome: 1200,
          totalExpenses: 650,
          grossProfit: 800,
          netProfit: 550,
        },
        cashFlowStatement: {
          ownerFunding: 300,
          stockPurchaseCashOut: 400,
          netCashMovement: 850,
        },
      },
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
