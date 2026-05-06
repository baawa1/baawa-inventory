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
const mockGetRecentFinanceTransactions = jest.fn();

jest.mock('@/lib/finance/ledger', () => {
  const dateRange = jest.requireActual('@/lib/finance/date-range');

  return {
    buildFinanceRange: dateRange.buildFinanceRange,
    getPreviousFinanceRange: dateRange.getPreviousFinanceRange,
    getFinanceAggregate: (...args: unknown[]) => mockGetFinanceAggregate(...args),
    getRecentFinanceTransactions: (...args: unknown[]) =>
      mockGetRecentFinanceTransactions(...args),
  };
});

import { GET as getFinanceSummary } from '@/app/api/finance/summary/route';

function buildAggregate(netProfit: number, transactionCount: number) {
  return {
    transactions: [],
    summary: {
      totalIncome: netProfit + 100,
      totalExpenses: 100,
      netProfit,
      totalTransactions: transactionCount,
      averageTransactionValue: 100,
      topPaymentMethod: 'CASH',
    },
    paymentMethodDistribution: [],
    dailyTrends: [],
    expenseBreakdown: {},
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
      cashSpent: 100,
      customerCollections: netProfit + 100,
      ownerFunding: 0,
      stockPurchases: 40,
      operatingExpensePayments: 60,
      manualIncomeCollections: 0,
      netCashMovement: netProfit,
    },
    businessPosition: {
      inventoryValueOnHand: 0,
      inventoryUnitsOnHand: 0,
      inventorySkusTracked: 0,
      receivablesOutstanding: 0,
      receivableTransactions: 0,
      customersWithBalances: 0,
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

  it('returns unified summary data for admins from the ledger service', async () => {
    mockGetFinanceAggregate
      .mockResolvedValueOnce(buildAggregate(75000, 18))
      .mockResolvedValueOnce(buildAggregate(65000, 14))
      .mockResolvedValueOnce(buildAggregate(230000, 63));

    mockGetRecentFinanceTransactions.mockResolvedValue([
      {
        id: 2000001,
        transactionNumber: 'POS-001',
        type: 'INCOME',
        eventType: 'POS_CASH_SALE',
        displayLabel: 'POS Cash Sale',
        amount: 15000,
        description: 'POS sale',
        date: new Date('2026-04-29T12:00:00.000Z'),
        paymentMethod: 'CASH',
        source: 'POS',
        cashIn: 15000,
        cashOut: 0,
        profitIn: 15000,
        profitOut: 5000,
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
    expect(mockGetFinanceAggregate).toHaveBeenCalledTimes(3);
    expect(mockGetRecentFinanceTransactions).toHaveBeenCalledWith(10);

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        currentMonth: {
          netIncome: 75000,
          transactionCount: 18,
        },
        previousMonth: {
          netIncome: 65000,
          transactionCount: 14,
        },
        yearToDate: {
          netIncome: 230000,
          transactionCount: 63,
        },
        recentTransactions: [
          {
            transactionNumber: 'POS-001',
            source: 'POS',
            amount: 15000,
          },
        ],
      },
    });
  });
});
