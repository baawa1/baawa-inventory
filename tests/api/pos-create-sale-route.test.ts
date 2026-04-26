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
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/email', () => ({
  emailService: {},
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/utils/phone-utils', () => ({
  normalizeNigerianPhone: jest.fn((phone: string) => ({
    isValid: false,
    normalized: phone,
  })),
  getPhoneSearchPatterns: jest.fn((phone: string) => [phone]),
}));

jest.mock('@/lib/utils/payment-methods', () => ({
  formatPaymentMethodLabel: jest.fn((value: string) => value),
  normalizePaymentMethodForStorage: jest.fn((value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === 'cash') {
      return 'cash';
    }
    if (normalized === 'pos_machine' || normalized === 'pos') {
      return 'pos';
    }
    if (normalized === 'bank_transfer') {
      return 'bank_transfer';
    }
    if (normalized === 'mobile_money') {
      return 'mobile_money';
    }
    if (normalized === 'debt') {
      return 'debt';
    }
    if (normalized === 'split') {
      return 'split';
    }
    return value;
  }),
}));

import { POST } from '@/app/api/pos/create-sale/route';
import { prisma } from '@/lib/db';

const prismaMock = prisma as unknown as {
  $transaction: jest.Mock;
};

describe('POST /api/pos/create-sale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: unknown) =>
    ({
      json: async () => body,
      user: { id: '1', role: 'STAFF' },
    }) as any;

  it('accepts a fully discounted sale with a zero total', async () => {
    const txMock = {
      customer: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Test Product',
            stock: 10,
            isService: false,
          },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      salesTransaction: {
        create: jest.fn().mockResolvedValue({
          id: 42,
          transaction_number: 'TXN-TEST-0001',
        }),
      },
      salesItem: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      stockTransaction: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      coupon: {
        update: jest.fn(),
      },
      splitPayment: {
        createMany: jest.fn(),
      },
      transactionPayment: {
        create: jest.fn().mockResolvedValue({
          id: 7,
          amount: 0,
          payment_method: 'cash',
          note: null,
          payment_date: new Date('2026-04-25T10:00:00.000Z'),
          recorded_by: 1,
          created_at: new Date('2026-04-25T10:00:00.000Z'),
          recordedBy: {
            id: 1,
            firstName: 'Test',
            lastName: 'Staff',
            email: 'staff@example.com',
          },
        }),
      },
      transactionFee: {
        createMany: jest.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async handler => handler(txMock));

    const response = await POST(
      createRequest({
        items: [
          {
            productId: 1,
            quantity: 1,
            price: 5000,
            total: 5000,
          },
        ],
        subtotal: 5000,
        discount: 5000,
        total: 0,
        paymentMethod: 'CASH',
        customerPhone: '+2347087367278',
        amountPaid: 0,
      })
    );

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.paymentStatus).toBe('PAID');
    expect(payload.amountPaid).toBe(0);
    expect(payload.balanceDue).toBe(0);
    expect(txMock.salesTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 5000,
          discount_amount: 5000,
          total_amount: 0,
          payment_status: 'PAID',
        }),
      })
    );
  });
});
