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

const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    financialReport: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { GET as getReportDetail } from '@/app/api/finance/reports/[id]/route';
import { GET as compareReports } from '@/app/api/finance/reports/compare/route';

const generatedByUser = {
  id: 1,
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
};

function buildReport(id: number, netProfit: number) {
  return {
    id,
    reportType: 'FINANCIAL_SUMMARY',
    reportName: `Financial Summary ${id}`,
    periodStart: new Date('2026-04-01T00:00:00.000Z'),
    periodEnd: new Date('2026-04-30T00:00:00.000Z'),
    generatedAt: new Date('2026-05-01T10:00:00.000Z'),
    generatedByUser,
    reportData: {
      summary: {
        totalIncome: netProfit + 100,
        totalExpenses: 100,
        grossProfit: netProfit + 60,
        netProfit,
        totalTransactions: id,
      },
      trading: {
        salesRevenue: netProfit + 100,
        operatingRevenue: netProfit + 100,
        costOfGoodsSold: 40,
        operatingExpenses: 60,
        netProfit,
      },
      cashMovement: {
        cashReceived: netProfit + 100,
        cashSpent: 100,
        ownerFunding: 0,
        stockPurchases: 40,
        netCashMovement: netProfit,
      },
      businessPosition: {
        inventoryValueOnHand: 1000 + id,
        receivablesOutstanding: 500,
        inventoryUnitsOnHand: 10,
        customersWithBalances: 1,
      },
      methodology: {
        status: 'exact',
      },
    },
  };
}

describe('saved financial report APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns saved report detail for admins', async () => {
    mockFindFirst.mockResolvedValue(buildReport(7, 500));

    const response = await getReportDetail(
      {
        user: {
          id: '1',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '7' }) }
    );

    expect(response.status).toBe(200);
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 7,
        }),
      })
    );
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        id: 7,
        reportName: 'Financial Summary 7',
        generatedBy: {
          name: 'Admin User',
        },
        methodologyStatus: 'exact',
        reportData: {
          summary: {
            netProfit: 500,
          },
        },
      },
    });
  });

  it('blocks saved report detail access for managers', async () => {
    const response = await getReportDetail(
      {
        user: {
          id: '2',
          role: 'MANAGER',
          email: 'manager@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '7' }) }
    );

    expect(response.status).toBe(403);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('compares two saved reports and returns grouped deltas', async () => {
    mockFindMany.mockResolvedValue([buildReport(1, 400), buildReport(2, 550)]);

    const response = await compareReports({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/reports/compare?baseId=1&comparisonId=2',
    } as any);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      success: true,
      data: {
        base: {
          id: 1,
        },
        comparison: {
          id: 2,
        },
        deltas: {
          summary: {
            netProfit: {
              base: 400,
              comparison: 550,
              delta: 150,
            },
          },
          cashMovement: {
            netCashMovement: {
              delta: 150,
            },
          },
        },
      },
    });
    expect(body.data.base).not.toHaveProperty('reportData');
    expect(body.data.comparison).not.toHaveProperty('reportData');
  });

  it('blocks saved report comparison access for managers', async () => {
    const response = await compareReports({
      user: {
        id: '2',
        role: 'MANAGER',
        email: 'manager@example.com',
      },
      url: 'http://localhost/api/finance/reports/compare?baseId=1&comparisonId=2',
    } as any);

    expect(response.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('returns not found when a comparison snapshot is missing', async () => {
    mockFindMany.mockResolvedValue([buildReport(1, 400)]);

    const response = await compareReports({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/reports/compare?baseId=1&comparisonId=999',
    } as any);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Financial report not found',
    });
  });

  it('rejects comparison requests with matching report ids', async () => {
    const response = await compareReports({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/reports/compare?baseId=1&comparisonId=1',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Choose two different report snapshots to compare',
    });
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
