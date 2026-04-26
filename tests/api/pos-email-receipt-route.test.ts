jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

jest.mock('@/lib/api-auth-middleware', () => ({
  withPOSAuth: (handler: any) => handler,
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    salesTransaction: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  emailService: {
    sendReceiptEmail: jest.fn(),
  },
}));

import { POST } from '@/app/api/pos/email-receipt/route';
import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email';

const prismaMock = prisma as unknown as {
  salesTransaction: {
    findUnique: jest.Mock;
  };
};

const emailServiceMock = emailService as unknown as {
  sendReceiptEmail: jest.Mock;
};

describe('POST /api/pos/email-receipt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: unknown) =>
    ({
      json: async () => body,
      user: { id: '1', role: 'STAFF' },
    }) as any;

  it('uses canonical transaction totals and breakdown even when receiptData is provided', async () => {
    prismaMock.salesTransaction.findUnique.mockResolvedValue({
      id: 42,
      subtotal: 3000,
      discount_amount: 500,
      total_amount: 2500,
      payment_method: 'split',
      created_at: new Date('2026-04-26T08:00:00.000Z'),
      notes: 'Follow up next week',
      sales_items: [
        {
          quantity: 2,
          unit_price: 1000,
          total_price: 2000,
          products: { name: 'Item A' },
        },
        {
          quantity: 1,
          unit_price: 1000,
          total_price: 1000,
          products: { name: 'Item B' },
        },
      ],
      users: {
        firstName: 'Ada',
        lastName: 'Cashier',
      },
      customer: {
        name: 'Canonical Customer',
      },
      split_payments: [
        { amount: 600, payment_method: 'cash' },
        { amount: 400, payment_method: 'pos' },
        { amount: 1500, payment_method: 'debt' },
      ],
      transaction_payments: [],
      transaction_fees: [
        {
          feeType: 'Processing Fee',
          description: 'POS surcharge',
          amount: 50,
        },
      ],
    });
    emailServiceMock.sendReceiptEmail.mockResolvedValue(true);

    const response = await POST(
      createRequest({
        saleId: '42',
        customerEmail: 'buyer@example.com',
        receiptData: {
          items: [
            {
              name: 'Wrong Item',
              quantity: 99,
              price: 9999,
              total: 9999,
            },
          ],
          subtotal: 9999,
          discount: 0,
          total: 9999,
          paymentMethod: 'cash',
          timestamp: '2026-04-26T09:00:00.000Z',
          staffName: 'Wrong Staff',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(emailServiceMock.sendReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@example.com',
        customerName: 'Canonical Customer',
        saleId: '42',
        subtotal: 3000,
        discount: 500,
        total: 2500,
        paymentMethod: 'split',
        amountPaid: 1000,
        balanceDue: 1500,
        fees: [
          {
            type: 'Processing Fee',
            description: 'POS surcharge',
            amount: 50,
          },
        ],
        transactionPayments: [
          {
            amount: 600,
            method: 'cash',
            note: null,
            paymentDate: null,
          },
          {
            amount: 400,
            method: 'pos',
            note: null,
            paymentDate: null,
          },
          {
            amount: 1500,
            method: 'debt',
            note: null,
            paymentDate: null,
          },
        ],
      })
    );
  });
});
