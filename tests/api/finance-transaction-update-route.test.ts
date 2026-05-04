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

jest.mock('@/lib/validations/finance', () => ({
  updateTransactionSchema: {
    parse: (input: unknown) => input,
  },
}));

const mockFindFirst = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    financialTransaction: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn(),
}));

import { PUT as updateFinanceTransaction } from '@/app/api/finance/transactions/[id]/route';

describe('PUT /api/finance/transactions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('limits managers to editing only their own transactions', async () => {
    mockFindFirst.mockResolvedValue(null);

    const response = await updateFinanceTransaction(
      {
        json: async () => ({
          id: 12,
          description: 'Updated description',
        }),
        user: {
          id: '7',
          role: 'MANAGER',
          email: 'manager@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 12,
          createdBy: 7,
        },
      })
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Financial transaction not found',
    });
  });

  it('does not apply the owner filter for admins', async () => {
    mockFindFirst.mockResolvedValue(null);

    const response = await updateFinanceTransaction(
      {
        json: async () => ({
          id: 12,
          description: 'Updated description',
        }),
        user: {
          id: '1',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 12,
        },
      })
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Financial transaction not found',
    });
  });
});
