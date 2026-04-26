jest.mock('@/lib/db', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn(),
}));

import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { InventoryService } from '@/lib/inventory-service';
import { AuditLogAction } from '@/types/audit';

const prismaMock = prisma as unknown as {
  $transaction: jest.Mock;
};

const createAuditLogMock = createAuditLog as jest.MockedFunction<
  typeof createAuditLog
>;

describe('InventoryService.deleteSalesTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restores stock, creates stock trace, reverses coupon usage, audits, and deletes the sale', async () => {
    const txMock = {
      salesTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          transaction_number: 'TXN-10',
          sales_items: [
            {
              id: 1,
              quantity: 2,
              coupon_id: 8,
              products: {
                id: 5,
                name: 'Widget',
                sku: 'W-001',
                stock: 4,
                isService: false,
              },
            },
            {
              id: 2,
              quantity: 1,
              coupon_id: null,
              products: {
                id: 5,
                name: 'Widget',
                sku: 'W-001',
                stock: 4,
                isService: false,
              },
            },
          ],
          split_payments: [{ id: 1, amount: 500, payment_method: 'cash' }],
          transaction_payments: [{ id: 1, amount: 500, payment_method: 'cash' }],
          transaction_fees: [{ id: 1, amount: 50, feeType: 'SERVICE' }],
          customer: { id: 3, name: 'Jane Doe' },
          users: { id: 7, firstName: 'Admin', lastName: 'User' },
        }),
        delete: jest.fn().mockResolvedValue({ id: 10 }),
      },
      product: {
        update: jest.fn().mockResolvedValue({}),
      },
      stockTransaction: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      coupon: {
        findUnique: jest.fn().mockResolvedValue({
          id: 8,
          currentUses: 5,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaMock.$transaction.mockImplementation(async handler => handler(txMock));

    const result = await InventoryService.deleteSalesTransaction(
      10,
      7,
      'Duplicate order'
    );

    expect(txMock.salesTransaction.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
      })
    );
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        stock: {
          increment: 3,
        },
      },
    });
    expect(txMock.stockTransaction.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: 5,
          quantity: 3,
          type: 'RETURN',
          referenceType: 'SalesTransaction',
          referenceId: 10,
          previousStock: 4,
          newStock: 7,
          reason: 'Deleted sale reversal: TXN-10',
          userId: 7,
        }),
      ],
    });
    expect(txMock.coupon.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { currentUses: 4 },
    });
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tx: txMock,
        userId: 7,
        action: AuditLogAction.SALE_VOIDED,
        tableName: 'sales_transactions',
        recordId: 10,
      })
    );
    expect(txMock.salesTransaction.delete).toHaveBeenCalledWith({
      where: { id: 10 },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 10,
        transactionNumber: 'TXN-10',
        reason: 'Duplicate order',
        couponReversed: {
          id: 8,
          previousUses: 5,
          newUses: 4,
        },
        stockRestorations: [
          {
            productId: 5,
            productName: 'Widget',
            sku: 'W-001',
            quantity: 3,
            previousStock: 4,
            newStock: 7,
          },
        ],
      })
    );
  });

  it('ignores service items and clamps coupon usage at zero', async () => {
    const txMock = {
      salesTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 11,
          transaction_number: 'TXN-11',
          sales_items: [
            {
              id: 1,
              quantity: 1,
              coupon_id: 9,
              products: {
                id: 6,
                name: 'Consulting',
                sku: 'S-001',
                stock: 0,
                isService: true,
              },
            },
            {
              id: 2,
              quantity: 2,
              coupon_id: null,
              products: {
                id: 7,
                name: 'Hardware',
                sku: 'H-001',
                stock: 10,
                isService: false,
              },
            },
          ],
          split_payments: [],
          transaction_payments: [
            { id: 1, amount: 1000, payment_method: 'debt' },
          ],
          transaction_fees: [],
          customer: null,
          users: { id: 7, firstName: 'Admin', lastName: 'User' },
        }),
        delete: jest.fn().mockResolvedValue({ id: 11 }),
      },
      product: {
        update: jest.fn().mockResolvedValue({}),
      },
      stockTransaction: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      coupon: {
        findUnique: jest.fn().mockResolvedValue({
          id: 9,
          currentUses: 0,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    prismaMock.$transaction.mockImplementation(async handler => handler(txMock));

    const result = await InventoryService.deleteSalesTransaction(
      11,
      7,
      'Customer asked to remove it'
    );

    expect(txMock.product.update).toHaveBeenCalledTimes(1);
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        stock: {
          increment: 2,
        },
      },
    });
    expect(txMock.coupon.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { currentUses: 0 },
    });
    expect(result.stockRestorations).toEqual([
      {
        productId: 7,
        productName: 'Hardware',
        sku: 'H-001',
        quantity: 2,
        previousStock: 10,
        newStock: 12,
      },
    ]);
  });

  it('throws when the sales transaction does not exist', async () => {
    const txMock = {
      salesTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    prismaMock.$transaction.mockImplementation(async handler => handler(txMock));

    await expect(
      InventoryService.deleteSalesTransaction(404, 7, 'Cleanup')
    ).rejects.toThrow('Sales transaction not found');
  });
});
