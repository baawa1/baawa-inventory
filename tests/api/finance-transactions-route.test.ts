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

const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    financialTransaction: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import { GET as getFinanceTransactions } from '@/app/api/finance/transactions/route';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

describe('GET /api/finance/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes payment filters, keeps inclusive end dates, and returns pagination metadata', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 4,
        transactionNumber: 'FTX-004',
        type: 'INCOME',
        amount: 45000,
        description: 'POS settlement',
        transactionDate: new Date('2026-04-30T15:45:00.000Z'),
        paymentMethod: 'POS_MACHINE',
        status: 'PENDING',
        createdAt: new Date('2026-04-30T16:00:00.000Z'),
        updatedAt: new Date('2026-04-30T16:00:00.000Z'),
        createdBy: 12,
        approvedBy: null,
        approvedAt: null,
        createdByUser: {
          id: 12,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
        approvedByUser: null,
        expenseDetails: null,
        incomeDetails: {
          incomeSource: 'SERVICES',
          payerName: 'Customer',
        },
      },
    ]);
    mockCount.mockResolvedValue(1);

    const response = await getFinanceTransactions({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/transactions?paymentMethod=POS&startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10',
    } as any);

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockCount).toHaveBeenCalledTimes(1);

    const findManyArgs = mockFindMany.mock.calls[0][0];
    const countArgs = mockCount.mock.calls[0][0];

    expect(findManyArgs.where.paymentMethod).toBe('POS_MACHINE');
    expect(countArgs.where.paymentMethod).toBe('POS_MACHINE');
    expect(formatFinanceDateInput(findManyArgs.where.transactionDate.gte)).toBe(
      '2026-04-01'
    );
    expect(findManyArgs.where.transactionDate.gte.getHours()).toBe(0);
    expect(formatFinanceDateInput(findManyArgs.where.transactionDate.lte)).toBe(
      '2026-04-30'
    );
    expect(findManyArgs.where.transactionDate.lte.getHours()).toBe(23);
    expect(findManyArgs.where.transactionDate.lte.getMinutes()).toBe(59);
    expect(findManyArgs.where.transactionDate.lte.getSeconds()).toBe(59);
    expect(findManyArgs.where.transactionDate.lte.getMilliseconds()).toBe(999);

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
          transactionNumber: 'FTX-004',
          paymentMethod: 'POS_MACHINE',
          createdByName: 'Jane Doe',
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
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCount).not.toHaveBeenCalled();
  });
});
