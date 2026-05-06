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
const mockGetManualFinanceOverlapEntries = jest.fn();

jest.mock('@/lib/finance/ledger', () => ({
  buildFinanceRange: (...args: unknown[]) => mockBuildFinanceRange(...args),
  getManualFinanceOverlapEntries: (...args: unknown[]) =>
    mockGetManualFinanceOverlapEntries(...args),
}));

import { GET as getOverlapAudit } from '@/app/api/finance/overlap-audit/route';

describe('GET /api/finance/overlap-audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks managers from overlap audit data', async () => {
    const response = await getOverlapAudit({
      user: {
        id: '2',
        role: 'MANAGER',
        email: 'manager@example.com',
      },
      url: 'http://localhost/api/finance/overlap-audit',
    } as any);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Insufficient permissions to view overlap audit',
    });
    expect(mockGetManualFinanceOverlapEntries).not.toHaveBeenCalled();
  });

  it('returns flagged overlap totals for admins', async () => {
    const range = {
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
      groupBy: 'year',
    };

    mockBuildFinanceRange.mockReturnValue(range);
    mockGetManualFinanceOverlapEntries.mockResolvedValue([
      {
        id: 11,
        amount: 40000,
        category: 'SALES',
        description: 'Manual sales entry',
      },
      {
        id: 12,
        amount: 120000,
        category: 'INVENTORY_PURCHASES',
        description: 'Manual inventory purchase entry',
      },
      {
        id: 13,
        amount: 10000,
        category: 'SALES',
        description: 'Duplicate sales correction',
      },
    ]);

    const response = await getOverlapAudit({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/overlap-audit?startDate=2026-01-01&endDate=2026-12-31',
    } as any);

    expect(response.status).toBe(200);
    expect(mockBuildFinanceRange).toHaveBeenCalledTimes(1);
    expect(mockGetManualFinanceOverlapEntries).toHaveBeenCalledWith(range);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        summary: {
          totalFlaggedEntries: 3,
          totalFlaggedAmount: 170000,
          categories: {
            SALES: {
              count: 2,
              amount: 50000,
            },
            INVENTORY_PURCHASES: {
              count: 1,
              amount: 120000,
            },
          },
        },
        entries: [
          { id: 11, category: 'SALES' },
          { id: 12, category: 'INVENTORY_PURCHASES' },
          { id: 13, category: 'SALES' },
        ],
      },
    });
  });
});
