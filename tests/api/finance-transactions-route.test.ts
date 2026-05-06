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

const mockGetNormalizedFinanceTransactions = jest.fn();

jest.mock('@/lib/finance/ledger', () => ({
  getNormalizedFinanceTransactions: (...args: unknown[]) =>
    mockGetNormalizedFinanceTransactions(...args),
  normalizeFinancePaymentMethod: (method?: string | null) =>
    method ? method.toUpperCase() : null,
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    financialTransaction: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn(),
}));

import { GET as getFinanceTransactions } from '@/app/api/finance/transactions/route';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

describe('GET /api/finance/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNormalizedFinanceTransactions.mockResolvedValue([
      {
        id: 2000001,
        rowId: 'SalesTransaction-1-POS_CASH_SALE',
        transactionNumber: 'POS-001',
        type: 'INCOME',
        amount: 1000,
        date: new Date('2026-04-30T15:45:00.000Z'),
        paymentMethod: 'CASH',
        description: 'POS sale',
        source: 'POS',
        eventType: 'POS_CASH_SALE',
        cashIn: 1000,
        cashOut: 0,
        profitIn: 1000,
        profitOut: 300,
      },
    ]);
  });

  it('normalizes inclusive end dates before reading unified ledger events', async () => {
    const response = await getFinanceTransactions({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/transactions?startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10',
    } as any);

    expect(response.status).toBe(200);
    expect(mockGetNormalizedFinanceTransactions).toHaveBeenCalledTimes(1);

    const [filters] = mockGetNormalizedFinanceTransactions.mock.calls[0];
    expect(formatFinanceDateInput(filters.startDate)).toBe('2026-04-01');
    expect(filters.startDate.getHours()).toBe(0);
    expect(formatFinanceDateInput(filters.endDate)).toBe('2026-04-30');
    expect(filters.endDate.getHours()).toBe(23);
    expect(filters.endDate.getMinutes()).toBe(59);
    expect(filters.endDate.getSeconds()).toBe(59);
    expect(filters.endDate.getMilliseconds()).toBe(999);

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
      data: [
        expect.objectContaining({
          transactionNumber: 'POS-001',
          transactionDate: '2026-04-30T15:45:00.000Z',
        }),
      ],
    });
  });

  it('returns a validation error for reversed date ranges', async () => {
    const response = await getFinanceTransactions({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/transactions?startDate=2026-04-30&endDate=2026-04-01',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Start date must be before end date',
      code: 'VALIDATION_ERROR',
    });
    expect(mockGetNormalizedFinanceTransactions).not.toHaveBeenCalled();
  });

  it('returns a validation error for invalid dates', async () => {
    const response = await getFinanceTransactions({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/transactions?startDate=not-a-date',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Invalid date',
      code: 'VALIDATION_ERROR',
    });
    expect(mockGetNormalizedFinanceTransactions).not.toHaveBeenCalled();
  });
});
