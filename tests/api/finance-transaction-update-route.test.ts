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
const mockUpdate = jest.fn();
const mockExpenseUpsert = jest.fn();
const mockIncomeUpsert = jest.fn();
const mockFindUnique = jest.fn();
const mockTransaction = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    financialTransaction: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn(),
}));

import { PUT as updateFinanceTransaction } from '@/app/api/finance/transactions/[id]/route';

const transactionFixture = {
  id: 12,
  type: 'EXPENSE',
  status: 'PENDING',
  amount: 100,
  description: 'Original',
  paymentMethod: 'CASH',
  createdBy: 7,
  expenseDetails: {
    expenseType: 'TRANSPORTATION',
    vendorName: 'Vendor A',
  },
  incomeDetails: null,
};

const createTransactionClient = () => ({
  financialTransaction: {
    update: mockUpdate,
    findUnique: mockFindUnique,
  },
  expenseDetail: {
    upsert: mockExpenseUpsert,
    delete: jest.fn(),
  },
  incomeDetail: {
    upsert: mockIncomeUpsert,
    delete: jest.fn(),
  },
});

describe('PUT /api/finance/transactions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async callback => callback(createTransactionClient()));
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

  it('preserves the payment method when a partial update omits it', async () => {
    mockFindFirst.mockResolvedValue(transactionFixture);
    mockUpdate.mockResolvedValue(undefined);
    mockExpenseUpsert.mockResolvedValue(undefined);
    mockFindUnique.mockResolvedValue({
      ...transactionFixture,
      description: 'Updated description',
    });

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

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Updated description',
          paymentMethod: undefined,
        }),
      })
    );
    expect(mockExpenseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          expenseType: 'TRANSPORTATION',
          vendorName: 'Vendor A',
        }),
      })
    );
  });

  it('updates vendor details without requiring the expense type again', async () => {
    mockFindFirst.mockResolvedValue(transactionFixture);
    mockUpdate.mockResolvedValue(undefined);
    mockExpenseUpsert.mockResolvedValue(undefined);
    mockFindUnique.mockResolvedValue({
      ...transactionFixture,
      expenseDetails: {
        expenseType: 'TRANSPORTATION',
        vendorName: 'Vendor B',
      },
    });

    const response = await updateFinanceTransaction(
      {
        json: async () => ({
          id: 12,
          vendorName: 'Vendor B',
        }),
        user: {
          id: '1',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(200);
    expect(mockExpenseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          expenseType: 'TRANSPORTATION',
          vendorName: 'Vendor B',
        }),
      })
    );
  });

  it('rejects a type change that omits the new income detail', async () => {
    mockFindFirst.mockResolvedValue(transactionFixture);

    const response = await updateFinanceTransaction(
      {
        json: async () => ({
          id: 12,
          type: 'INCOME',
        }),
        user: {
          id: '1',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Income source is required when changing a transaction to income',
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('allows same-type partial updates while preserving existing detail rows', async () => {
    mockFindFirst.mockResolvedValue(transactionFixture);
    mockUpdate.mockResolvedValue(undefined);
    mockExpenseUpsert.mockResolvedValue(undefined);
    mockFindUnique.mockResolvedValue({
      ...transactionFixture,
      description: 'Still an expense',
    });

    const response = await updateFinanceTransaction(
      {
        json: async () => ({
          id: 12,
          type: 'EXPENSE',
          description: 'Still an expense',
        }),
        user: {
          id: '1',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(200);
    expect(mockExpenseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          expenseType: 'TRANSPORTATION',
          vendorName: 'Vendor A',
        }),
      })
    );
  });
});
