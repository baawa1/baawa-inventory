// Import integration setup FIRST to ensure proper mocking
import '../../integration-setup';
import { createPrismaMock } from '../../integration-setup';

// Create Prisma mock
createPrismaMock();

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Dashboard API Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction = jest.fn(async (callback: any) =>
      callback(mockPrisma)
    );
    mockPrisma.$queryRaw = jest.fn();
  });

  it('uses dateFrom/dateTo and computes previous period range for sales stats', async () => {
    mockPrisma.salesTransaction = {
      count: jest.fn().mockResolvedValue(10),
      aggregate: jest
        .fn()
        .mockResolvedValueOnce({ _sum: { total_amount: 100 } })
        .mockResolvedValueOnce({ _sum: { discount_amount: 10 } })
        .mockResolvedValueOnce({ _sum: { total_amount: 80 } })
        .mockResolvedValueOnce({ _sum: { discount_amount: 5 } }),
    } as any;
    mockPrisma.salesItem = {
      aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 20 } }),
    } as any;

    const request = new NextRequest(
      'http://localhost:3000/api/sales/stats?dateFrom=2025-01-10&dateTo=2025-01-20'
    );
    const { GET } = await import('@/app/api/sales/stats/route');
    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    const countCalls = mockPrisma.salesTransaction.count.mock.calls
      .map(call => call[0].where)
      .filter(where => where.created_at?.gte && where.created_at?.lte)
      .map(where => ({
        start: where.created_at.gte as Date,
        end: where.created_at.lte as Date,
      }));

    expect(countCalls).toHaveLength(2);

    const sorted = countCalls.sort((a, b) => a.start.getTime() - b.start.getTime());
    const previousPeriod = sorted[0];
    const currentPeriod = sorted[1];

    const msPerDay = 24 * 60 * 60 * 1000;
    const normalizeToDay = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const currentDays =
      Math.floor(
        (normalizeToDay(currentPeriod.end).getTime() -
          normalizeToDay(currentPeriod.start).getTime()) /
          msPerDay
      ) + 1;
    const previousDays =
      Math.floor(
        (normalizeToDay(previousPeriod.end).getTime() -
          normalizeToDay(previousPeriod.start).getTime()) /
          msPerDay
      ) + 1;

    expect(currentDays).toBe(previousDays);
    expect(previousPeriod.end.getTime()).toBeLessThan(currentPeriod.start.getTime());
  });

  it('aggregates sales trends by day and fills missing days', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        day: new Date('2025-01-10T00:00:00.000Z'),
        sales: '100.00',
        transactions: 2,
      },
      {
        day: new Date('2025-01-12T00:00:00.000Z'),
        sales: '50.00',
        transactions: 1,
      },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/dashboard/sales-trends?dateFrom=2025-01-10&dateTo=2025-01-12'
    );
    const { GET } = await import('@/app/api/dashboard/sales-trends/route');
    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(3);
    expect(data.data[0]).toMatchObject({
      sales: 100,
      transactions: 2,
    });
    expect(data.data[1]).toMatchObject({
      sales: 0,
      transactions: 0,
    });
    expect(data.data[2]).toMatchObject({
      sales: 50,
      transactions: 1,
    });

    const msPerDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(data.data[0].date);
    const secondDate = new Date(data.data[1].date);
    const thirdDate = new Date(data.data[2].date);

    expect(Math.round((secondDate.getTime() - firstDate.getTime()) / msPerDay)).toBe(1);
    expect(Math.round((thirdDate.getTime() - secondDate.getTime()) / msPerDay)).toBe(1);
  });

  it('returns summary only for finance analytics when requested', async () => {
    mockPrisma.financialTransaction = {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 100 } }),
      count: jest.fn().mockResolvedValue(2),
      groupBy: jest.fn().mockResolvedValue([
        { paymentMethod: 'CASH', _count: { paymentMethod: 1 }, _sum: { amount: 100 } },
      ]),
      findMany: jest.fn(),
    } as any;
    mockPrisma.salesTransaction = {
      aggregate: jest.fn().mockResolvedValue({ _sum: { total_amount: 200 } }),
      count: jest.fn().mockResolvedValue(3),
      groupBy: jest.fn().mockResolvedValue([
        { payment_method: 'CASH', _count: { payment_method: 1 }, _sum: { total_amount: 200 } },
      ]),
      findMany: jest.fn(),
    } as any;
    mockPrisma.stockAddition = {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalCost: 50 } }),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn(),
    } as any;
    mockPrisma.expenseDetail = {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    } as any;

    const request = new NextRequest(
      'http://localhost:3000/api/finance/analytics?summaryOnly=1'
    );
    const { GET } = await import('@/app/api/finance/analytics/route');
    const response = await GET(request as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.summary).toBeDefined();
    expect(payload.data.expenseBreakdown).toEqual({});
    expect(payload.data.topVendors).toEqual([]);
    expect(payload.data.charts.dailyTrends).toEqual([]);
    expect(mockPrisma.expenseDetail.groupBy).not.toHaveBeenCalled();
    expect(mockPrisma.expenseDetail.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.financialTransaction.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.salesTransaction.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.stockAddition.findMany).not.toHaveBeenCalled();
  });

  it('uses item aggregates for recent transactions and filters successful payments', async () => {
    mockPrisma.salesTransaction = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          transaction_number: 'TX-1',
          total_amount: 100,
          payment_method: 'cash',
          payment_status: 'PAID',
          created_at: new Date('2025-01-20T10:00:00.000Z'),
          customer: { id: 1, name: 'Alice', email: 'alice@example.com' },
          sales_items: [
            { quantity: 1, products: { name: 'Item A' } },
          ],
        },
      ]),
    } as any;
    mockPrisma.salesItem = {
      groupBy: jest.fn().mockResolvedValue([
        { transaction_id: 1, _sum: { quantity: 5 }, _count: { id: 3 } },
      ]),
    } as any;

    const request = new NextRequest(
      'http://localhost:3000/api/dashboard/recent-transactions?limit=5'
    );
    const { GET } = await import(
      '@/app/api/dashboard/recent-transactions/route'
    );
    const response = await GET(request as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data[0]).toMatchObject({
      id: 1,
      itemCount: 3,
      totalItems: 5,
      firstItem: 'Item A',
    });
    const where = mockPrisma.salesTransaction.findMany.mock.calls[0][0].where;
    expect(where.payment_status).toBeDefined();
  });

  it('filters top products by successful payments and optional date range', async () => {
    mockPrisma.salesItem = {
      groupBy: jest.fn().mockResolvedValue([
        {
          product_id: 1,
          _sum: { quantity: 10, total_price: 500 },
          _count: { id: 2 },
        },
      ]),
    } as any;
    mockPrisma.product = {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, name: 'Product A', sku: 'SKU-1', price: 50, images: [] },
      ]),
    } as any;

    const request = new NextRequest(
      'http://localhost:3000/api/dashboard/top-products?dateFrom=2025-01-01&dateTo=2025-01-31'
    );
    const { GET } = await import('@/app/api/dashboard/top-products/route');
    const response = await GET(request as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    const where = mockPrisma.salesItem.groupBy.mock.calls[0][0].where;
    expect(where.sales_transactions.payment_status).toBeDefined();
    expect(where.sales_transactions.created_at.gte).toBeInstanceOf(Date);
    expect(where.sales_transactions.created_at.lte).toBeInstanceOf(Date);
  });
});
