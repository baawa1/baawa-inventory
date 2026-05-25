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

jest.mock('@/lib/db', () => ({
  prisma: {
    salesTransaction: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { GET as getReceivables } from '@/app/api/finance/receivables/route';

describe('GET /api/finance/receivables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-05-10T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds receivables from ledger and split payments while excluding debt splits', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        transaction_number: 'SALE-001',
        total_amount: '500',
        payment_status: 'PARTIAL',
        created_at: new Date('2026-04-01T12:00:00.000Z'),
        customer: {
          id: 10,
          name: 'Acme Ltd',
          email: 'accounts@acme.test',
          phone: '08000000000',
        },
        users: {
          id: 7,
          firstName: 'Jane',
          lastName: 'Doe',
        },
        transaction_payments: [
          {
            amount: '100',
            payment_date: new Date('2026-04-03T12:00:00.000Z'),
            created_at: new Date('2026-04-03T12:00:00.000Z'),
            payment_method: 'cash',
          },
        ],
        split_payments: [
          {
            amount: '150',
            payment_method: 'cash',
            created_at: new Date('2026-04-01T12:00:00.000Z'),
          },
          {
            amount: '250',
            payment_method: 'debt',
            created_at: new Date('2026-04-01T12:00:00.000Z'),
          },
        ],
      },
      {
        id: 2,
        transaction_number: 'SALE-002',
        total_amount: '700',
        payment_status: 'PENDING',
        created_at: new Date('2025-12-01T12:00:00.000Z'),
        customer: {
          id: 11,
          name: 'Older Debt Ltd',
          email: 'finance@older-debt.test',
          phone: '08000000001',
        },
        users: {
          id: 8,
          firstName: 'John',
          lastName: 'Doe',
        },
        transaction_payments: [],
        split_payments: [],
      },
    ]);

    const response = await getReceivables({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/receivables?agingDays=90',
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data.summary).toMatchObject({
      totalOutstanding: 950,
      totalTransactions: 2,
      averageDaysOutstanding: 100,
      estimatedCollectable: 410,
      collectionProbability: 43,
    });
    expect(payload.data.receivables[0]).toMatchObject({
      transactionNumber: 'SALE-001',
      paidAmount: 250,
      outstandingAmount: 250,
      agingBucket: '31-60',
    });
    expect(payload.data.receivables[1]).toMatchObject({
      transactionNumber: 'SALE-002',
      paidAmount: 0,
      outstandingAmount: 700,
      agingBucket: '90+',
    });
    expect(payload.data.topDebtors[0]).toMatchObject({
      totalOwed: 700,
      transactionCount: 1,
    });
    expect(payload.data.aging['90+']).toMatchObject({
      count: 1,
      amount: 700,
    });
  });

  it('does not count future legacy payments that have no payment date', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 3,
        transaction_number: 'SALE-003',
        total_amount: '500',
        payment_status: 'PARTIAL',
        created_at: new Date('2026-04-01T12:00:00.000Z'),
        customer: {
          id: 12,
          name: 'Future Payment Ltd',
          email: 'future@example.test',
          phone: '08000000002',
        },
        users: {
          id: 9,
          firstName: 'Ada',
          lastName: 'Doe',
        },
        transaction_payments: [
          {
            amount: '300',
            payment_date: null,
            created_at: new Date('2026-05-20T12:00:00.000Z'),
            payment_method: 'cash',
          },
        ],
        split_payments: [],
      },
    ]);

    const response = await getReceivables({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/receivables',
    } as any);

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data.summary.totalOutstanding).toBe(500);
    expect(payload.data.receivables[0]).toMatchObject({
      transactionNumber: 'SALE-003',
      paidAmount: 0,
      outstandingAmount: 500,
    });
  });

  it('returns a validation error for invalid aging windows', async () => {
    const response = await getReceivables({
      user: {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
      url: 'http://localhost/api/finance/receivables?agingDays=0',
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Aging days must be at least 1',
      code: 'VALIDATION_ERROR',
    });
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
