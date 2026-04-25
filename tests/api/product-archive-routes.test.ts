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
  withPermission: jest.fn(
    (_roles: string[], handler: (...args: unknown[]) => unknown) => handler
  ),
}));

const mockFindMany = jest.fn();
const mockTransaction = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const mockCreateAuditLog = jest.fn();
jest.mock('@/lib/audit', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { AuditLogAction } from '@/types/audit';

describe('product archive routes', () => {
  const tx = {
    product: {
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async callback => callback(tx));
  });

  it('bulk archives products and writes one audit log per changed product inside the transaction', async () => {
    const { POST: bulkProductArchive } = await import(
      '@/app/api/products/archive/route'
    );
    mockFindMany.mockResolvedValue([
      { id: 1, name: 'Product 1', isArchived: false },
      { id: 2, name: 'Product 2', isArchived: false },
    ]);
    tx.product.updateMany.mockResolvedValue({ count: 2 });
    mockCreateAuditLog.mockResolvedValue({ id: 12 });

    const response = await bulkProductArchive({
      json: async () => ({ productIds: [1, 2], action: 'archive' }),
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    } as any);

    expect(response.status).toBe(200);
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
      data: { isArchived: true },
    });
    expect(mockCreateAuditLog).toHaveBeenCalledTimes(2);
    expect(mockCreateAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        tx,
        userId: 1,
        action: AuditLogAction.PRODUCT_ARCHIVED,
        recordId: 1,
      })
    );
    expect(mockCreateAuditLog).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        tx,
        userId: 1,
        action: AuditLogAction.PRODUCT_ARCHIVED,
        recordId: 2,
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      updated: 2,
      skipped: 0,
      products: [
        { id: 1, action: 'archive' },
        { id: 2, action: 'archive' },
      ],
    });
  });
});
