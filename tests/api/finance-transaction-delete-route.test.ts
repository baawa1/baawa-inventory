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

const mockFindUnique = jest.fn();
const mockTransaction = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    financialTransaction: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const mockCreateAuditLog = jest.fn();
jest.mock('@/lib/audit', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { DELETE as deleteFinanceTransaction } from '@/app/api/finance/transactions/[id]/route';
import { AuditLogAction } from '@/types/audit';

describe('DELETE /api/finance/transactions/[id]', () => {
  const tx = {
    financialTransaction: {
      delete: jest.fn(),
    },
  };

  const existingTransaction = {
    id: 12,
    transactionNumber: 'FIN-0012',
    type: 'INCOME',
    amount: 5000,
    description: 'Adjustment',
    transactionDate: new Date('2026-04-26'),
    paymentMethod: 'CASH',
    status: 'COMPLETED',
    createdBy: 7,
    createdAt: new Date('2026-04-26T10:00:00.000Z'),
    updatedAt: new Date('2026-04-26T10:00:00.000Z'),
    createdByUser: {
      id: 7,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
    },
    approvedByUser: null,
    expenseDetails: null,
    incomeDetails: {
      id: 3,
      transactionId: 12,
      incomeSource: 'OTHER',
      payerName: 'John Doe',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async callback => callback(tx));
    tx.financialTransaction.delete.mockResolvedValue({ id: 12 });
  });

  it('deletes a finance transaction for admins and writes the audit log', async () => {
    mockFindUnique.mockResolvedValue(existingTransaction);
    mockCreateAuditLog.mockResolvedValue({ id: 44 });

    const response = await deleteFinanceTransaction(
      {
        json: async () => ({ reason: 'Duplicate income entry' }),
        user: {
          id: '7',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 12 },
      })
    );
    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tx,
        userId: 7,
        action: AuditLogAction.FINANCE_TRANSACTION_DELETED,
        tableName: 'financial_transactions',
        recordId: 12,
        oldValues: existingTransaction,
        newValues: expect.objectContaining({
          deleted: true,
          deletedBy: 7,
          reason: 'Duplicate income entry',
          transactionNumber: 'FIN-0012',
          type: 'INCOME',
        }),
      })
    );
    expect(tx.financialTransaction.delete).toHaveBeenCalledWith({
      where: { id: 12 },
    });

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      message: 'Financial transaction deleted successfully',
      data: {
        id: 12,
        transactionNumber: 'FIN-0012',
        type: 'INCOME',
        deletedBy: 7,
        reason: 'Duplicate income entry',
      },
    });
  });

  it('returns 403 for non-admin users', async () => {
    const response = await deleteFinanceTransaction(
      {
        json: async () => ({ reason: 'Cleanup' }),
        user: {
          id: '8',
          role: 'MANAGER',
          email: 'manager@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(403);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Only administrators can delete financial transactions',
    });
  });

  it('returns 400 when the delete reason is missing', async () => {
    const response = await deleteFinanceTransaction(
      {
        json: async () => ({}),
        user: {
          id: '7',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(400);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Delete reason is required',
    });
  });

  it('returns 400 when the transaction is approved or rejected', async () => {
    mockFindUnique.mockResolvedValue({
      ...existingTransaction,
      status: 'APPROVED',
    });

    const response = await deleteFinanceTransaction(
      {
        json: async () => ({ reason: 'Cleanup' }),
        user: {
          id: '7',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockCreateAuditLog).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Cannot delete a transaction that is approved or rejected',
    });
  });

  it('returns 404 when the finance transaction no longer exists', async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await deleteFinanceTransaction(
      {
        json: async () => ({ reason: 'Cleanup' }),
        user: {
          id: '7',
          role: 'ADMIN',
          email: 'admin@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '12' }) }
    );

    expect(response.status).toBe(404);
    expect(mockTransaction).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Financial transaction not found',
    });
  });
});
