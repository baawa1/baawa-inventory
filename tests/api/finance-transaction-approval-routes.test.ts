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

const mockTransaction = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const mockCreateAuditLog = jest.fn();
jest.mock('@/lib/audit', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { POST as approveTransaction } from '@/app/api/finance/transactions/[id]/approve/route';
import { POST as rejectTransaction } from '@/app/api/finance/transactions/[id]/reject/route';
import { AuditLogAction } from '@/types/audit';

describe('finance transaction approval routes', () => {
  const tx = {
    financialTransaction: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const baseTransaction = {
    id: 7,
    status: 'PENDING',
    createdByUser: {
      id: 3,
      firstName: 'Creator',
      lastName: 'User',
      email: 'creator@example.com',
    },
    expenseDetails: null,
    incomeDetails: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async callback => callback(tx));
  });

  it('approves a transaction and writes the audit log inside the transaction', async () => {
    const approvedTransaction = {
      ...baseTransaction,
      status: 'APPROVED',
      approvedBy: 1,
      approvedByUser: {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
      },
    };

    tx.financialTransaction.findUnique.mockResolvedValue(baseTransaction);
    tx.financialTransaction.update.mockResolvedValue(approvedTransaction);
    mockCreateAuditLog.mockResolvedValue({ id: 10 });

    const response = await approveTransaction(
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
    expect(tx.financialTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({
          status: 'APPROVED',
          approvedBy: 1,
          approvedAt: expect.any(Date),
        }),
      })
    );
    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tx,
        userId: 1,
        action: AuditLogAction.FINANCE_TRANSACTION_APPROVED,
        tableName: 'financial_transactions',
        recordId: 7,
        oldValues: baseTransaction,
        newValues: approvedTransaction,
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      message: 'Transaction approved successfully',
      data: {
        id: 7,
        status: 'APPROVED',
      },
    });
  });

  it('blocks approval for non-admin users before starting a transaction', async () => {
    const response = await approveTransaction(
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
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Only administrators can approve financial transactions',
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockCreateAuditLog).not.toHaveBeenCalled();
  });

  it('rejects a transaction and writes the audit log inside the transaction', async () => {
    const rejectedTransaction = {
      ...baseTransaction,
      status: 'REJECTED',
      rejectionReason: 'Duplicate submission',
      approvedBy: 2,
      approvedByUser: {
        id: 2,
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@example.com',
      },
    };

    tx.financialTransaction.findUnique.mockResolvedValue(baseTransaction);
    tx.financialTransaction.update.mockResolvedValue(rejectedTransaction);
    mockCreateAuditLog.mockResolvedValue({ id: 11 });

    const response = await rejectTransaction(
      {
        json: async () => ({ reason: 'Duplicate submission' }),
        user: {
          id: '2',
          role: 'MANAGER',
          email: 'manager@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '7' }) }
    );

    expect(response.status).toBe(200);
    expect(tx.financialTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({
          status: 'REJECTED',
          approvedBy: 2,
          approvedAt: expect.any(Date),
          rejectionReason: 'Duplicate submission',
        }),
      })
    );
    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tx,
        userId: 2,
        action: AuditLogAction.FINANCE_TRANSACTION_REJECTED,
        tableName: 'financial_transactions',
        recordId: 7,
        oldValues: baseTransaction,
        newValues: rejectedTransaction,
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      message: 'Transaction rejected successfully',
      data: {
        id: 7,
        status: 'REJECTED',
        rejectionReason: 'Duplicate submission',
      },
    });
  });

  it('validates the rejection request before opening a transaction', async () => {
    const response = await rejectTransaction(
      {
        json: async () => ({ reason: '' }),
        user: {
          id: '2',
          role: 'MANAGER',
          email: 'manager@example.com',
        },
      } as any,
      { params: Promise.resolve({ id: '7' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Invalid request data',
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockCreateAuditLog).not.toHaveBeenCalled();
  });
});
