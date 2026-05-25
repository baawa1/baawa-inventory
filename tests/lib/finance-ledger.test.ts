const mockFinancialTransactionFindMany = jest.fn();
const mockSalesTransactionFindMany = jest.fn();
const mockStockAdditionFindMany = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    financialTransaction: {
      findMany: (...args: unknown[]) => mockFinancialTransactionFindMany(...args),
    },
    salesTransaction: {
      findMany: (...args: unknown[]) => mockSalesTransactionFindMany(...args),
    },
    stockAddition: {
      findMany: (...args: unknown[]) => mockStockAdditionFindMany(...args),
    },
  },
}));

import {
  buildPaymentMethodDistribution,
  getNormalizedFinanceTransactions,
  summarizeFinanceTransactions,
} from '@/lib/finance/ledger';

function buildSale(overrides: Record<string, unknown> = {}) {
  const saleDate = new Date('2026-04-10T10:00:00.000Z');

  return {
    id: 1,
    total_amount: 1000,
    payment_method: 'cash',
    payment_status: 'paid',
    created_at: saleDate,
    transaction_number: 'POS-001',
    user_id: 3,
    users: {
      firstName: 'Cashier',
      lastName: 'One',
    },
    customer: null,
    sales_items: [
      {
        quantity: 2,
        unit_price: 500,
        total_price: 1000,
        unit_cost: 200,
        total_cost: 400,
        cost_is_estimated: false,
        products: {
          name: 'Product',
          cost: 225,
          isService: false,
        },
      },
    ],
    split_payments: [],
    transaction_payments: [
      {
        id: 10,
        amount: 1000,
        payment_method: 'cash',
        payment_date: saleDate,
        created_at: saleDate,
        recordedBy: null,
      },
    ],
    ...overrides,
  };
}

describe('finance ledger normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFinancialTransactionFindMany.mockResolvedValue([]);
    mockSalesTransactionFindMany.mockResolvedValue([]);
    mockStockAdditionFindMany.mockResolvedValue([]);
  });

  it('keeps only current-period debt payment events for prior-period debt sales', async () => {
    mockSalesTransactionFindMany.mockResolvedValue([
      buildSale({
        id: 7,
        total_amount: 1000,
        payment_method: 'debt',
        payment_status: 'partial',
        created_at: new Date('2026-03-15T10:00:00.000Z'),
        transaction_number: 'POS-DEBT-001',
        transaction_payments: [
          {
            id: 44,
            amount: 400,
            payment_method: 'cash',
            payment_date: new Date('2026-04-12T12:00:00.000Z'),
            created_at: new Date('2026-04-12T12:00:00.000Z'),
            recordedBy: null,
          },
        ],
      }),
    ]);

    const transactions = await getNormalizedFinanceTransactions({
      source: 'POS',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      eventType: 'POS_DEBT_PAYMENT_COLLECTED',
      amount: 400,
      cashIn: 400,
      profitIn: 400,
      receivableDecrease: 400,
    });
  });

  it('uses payment created_at for legacy debt payments with no payment date', async () => {
    const startDate = new Date('2026-04-01T00:00:00.000Z');
    const endDate = new Date('2026-04-30T23:59:59.999Z');

    mockSalesTransactionFindMany.mockResolvedValue([
      buildSale({
        id: 8,
        total_amount: 1000,
        payment_method: 'debt',
        payment_status: 'partial',
        created_at: new Date('2026-03-15T10:00:00.000Z'),
        transaction_number: 'POS-DEBT-002',
        transaction_payments: [
          {
            id: 45,
            amount: 350,
            payment_method: 'cash',
            payment_date: null,
            created_at: new Date('2026-04-18T09:30:00.000Z'),
            recordedBy: null,
          },
        ],
      }),
    ]);

    const transactions = await getNormalizedFinanceTransactions({
      source: 'POS',
      startDate,
      endDate,
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      eventType: 'POS_DEBT_PAYMENT_COLLECTED',
      amount: 350,
      date: new Date('2026-04-18T09:30:00.000Z'),
    });

    const salesQuery = mockSalesTransactionFindMany.mock.calls[0][0];
    expect(salesQuery.where.OR).toEqual(
      expect.arrayContaining([
        {
          transaction_payments: {
            some: {
              OR: expect.arrayContaining([
                {
                  payment_date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                {
                  payment_date: null,
                  created_at: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              ]),
            },
          },
        },
      ])
    );
    expect(salesQuery.include.transaction_payments.where.OR).toEqual(
      expect.arrayContaining([
        {
          payment_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          payment_date: null,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      ])
    );
  });

  it('uses stored cost-at-sale snapshots when available', async () => {
    mockSalesTransactionFindMany.mockResolvedValue([buildSale()]);

    const transactions = await getNormalizedFinanceTransactions({
      source: 'POS',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
    });

    expect(transactions[0]).toMatchObject({
      eventType: 'POS_CASH_SALE',
      profitOut: 400,
      inventoryValueOut: 400,
      estimated: false,
    });
  });

  it('falls back to estimated product cost when old sales have no cost snapshot', async () => {
    mockSalesTransactionFindMany.mockResolvedValue([
      buildSale({
        sales_items: [
          {
            quantity: 2,
            unit_price: 500,
            total_price: 1000,
            unit_cost: null,
            total_cost: null,
            cost_is_estimated: false,
            products: {
              name: 'Product',
              cost: 250,
              isService: false,
            },
          },
        ],
      }),
    ]);

    const transactions = await getNormalizedFinanceTransactions({
      source: 'POS',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
    });

    expect(transactions[0]).toMatchObject({
      profitOut: 500,
      inventoryValueOut: 500,
      estimated: true,
    });
  });

  it('keeps owner funding out of profit while increasing cash', async () => {
    mockFinancialTransactionFindMany.mockResolvedValue([
      {
        id: 20,
        transactionNumber: 'FIN-020',
        type: 'INCOME',
        amount: 5000,
        description: 'Owner cash injection',
        transactionDate: new Date('2026-04-05T00:00:00.000Z'),
        paymentMethod: 'BANK_TRANSFER',
        status: 'COMPLETED',
        createdBy: 1,
        createdByUser: {
          firstName: 'Admin',
          lastName: 'User',
        },
        incomeDetails: {
          incomeSource: 'INVESTMENTS',
          payerName: 'Owner',
        },
        expenseDetails: null,
      },
    ]);

    const transactions = await getNormalizedFinanceTransactions({
      source: 'MANUAL',
    });

    expect(transactions[0]).toMatchObject({
      eventType: 'OWNER_FUNDING_IN',
      cashIn: 5000,
      profitIn: 0,
      netProfitImpact: 0,
    });
  });

  it('treats stock purchases as cash out and inventory in, not immediate profit loss', async () => {
    mockStockAdditionFindMany.mockResolvedValue([
      {
        id: 30,
        totalCost: 2500,
        purchaseDate: new Date('2026-04-07T00:00:00.000Z'),
        createdAt: new Date('2026-04-07T00:00:00.000Z'),
        referenceNo: 'PO-030',
        createdById: 1,
        createdBy: {
          firstName: 'Admin',
          lastName: 'User',
        },
        product: {
          name: 'Stock Item',
        },
        supplier: {
          name: 'Supplier',
        },
      },
    ]);

    const transactions = await getNormalizedFinanceTransactions({
      source: 'STOCK',
    });

    expect(transactions[0]).toMatchObject({
      eventType: 'STOCK_PURCHASE',
      cashOut: 2500,
      inventoryValueIn: 2500,
      profitOut: 0,
    });
  });

  it('includes legacy approved manual finance transactions in reportable queries', async () => {
    await getNormalizedFinanceTransactions({
      source: 'MANUAL',
    });

    expect(mockFinancialTransactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            in: ['COMPLETED', 'APPROVED'],
          },
        }),
      })
    );
  });

  it('counts only collected cash in payment method aggregates for debt sales', async () => {
    mockSalesTransactionFindMany.mockResolvedValue([
      buildSale({
        id: 9,
        total_amount: 1000,
        payment_method: 'split',
        payment_status: 'partial',
        transaction_number: 'POS-DEBT-003',
        split_payments: [
          {
            id: 91,
            amount: 250,
            payment_method: 'cash',
            created_at: new Date('2026-04-10T10:00:00.000Z'),
          },
          {
            id: 92,
            amount: 750,
            payment_method: 'debt',
            created_at: new Date('2026-04-10T10:00:00.000Z'),
          },
        ],
        transaction_payments: [],
      }),
    ]);

    const transactions = await getNormalizedFinanceTransactions({
      source: 'POS',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
    });

    expect(transactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'POS_DEBT_SALE_ISSUED',
          paymentMethod: 'SPLIT',
          amount: 1000,
          cashIn: 0,
          receivableIncrease: 750,
        }),
        expect.objectContaining({
          eventType: 'POS_DEBT_PAYMENT_COLLECTED',
          paymentMethod: 'CASH',
          amount: 250,
          cashIn: 250,
        }),
      ])
    );

    expect(buildPaymentMethodDistribution(transactions)).toEqual([
      {
        method: 'CASH',
        count: 1,
        amount: 250,
      },
    ]);
    expect(summarizeFinanceTransactions(transactions).topPaymentMethod).toBe(
      'Cash'
    );
  });
});
