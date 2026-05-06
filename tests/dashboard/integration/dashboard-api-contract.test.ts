let currentRole: 'ADMIN' | 'MANAGER' | 'STAFF' = 'ADMIN';

const mockGetFinanceAggregate = jest.fn();
const mockSummarizeCanonicalFinanceAggregate = jest.fn();

const prismaMock = {
  salesTransaction: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  salesItem: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
} as any;

jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

jest.mock('@/lib/api-middleware', () => ({
  withAuth: (handler: Function) => async (request: any, ...args: any[]) => {
    request.user = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: currentRole,
      status: 'APPROVED',
      isEmailVerified: true,
    };

    return handler(request, ...args);
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/finance/ledger', () => ({
  getFinanceAggregate: (...args: any[]) => mockGetFinanceAggregate(...args),
}));

jest.mock('@/lib/finance/metrics', () => ({
  summarizeCanonicalFinanceAggregate: (...args: any[]) =>
    mockSummarizeCanonicalFinanceAggregate(...args),
}));

describe('Dashboard analytics and operations APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.salesTransaction.count.mockReset();
    prismaMock.salesTransaction.aggregate.mockReset();
    prismaMock.salesTransaction.findMany.mockReset();
    prismaMock.salesItem.aggregate.mockReset();
    prismaMock.salesItem.groupBy.mockReset();
    prismaMock.product.findMany.mockReset();
    prismaMock.$queryRaw.mockReset();
    mockGetFinanceAggregate.mockReset();
    mockSummarizeCanonicalFinanceAggregate.mockReset();
    currentRole = 'ADMIN';

    prismaMock.salesTransaction.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(8);
    prismaMock.salesTransaction.aggregate
      .mockResolvedValueOnce({ _sum: { total_amount: 240000 } })
      .mockResolvedValueOnce({ _sum: { total_amount: 160000 } });
    prismaMock.salesItem.aggregate
      .mockResolvedValueOnce({ _sum: { quantity: 84 } })
      .mockResolvedValueOnce({ _sum: { quantity: 56 } });
    prismaMock.salesItem.groupBy.mockResolvedValue([
      {
        product_id: 1,
        _sum: { quantity: 12, total_price: 50000 },
        _count: { id: 4 },
      },
    ]);
    prismaMock.product.findMany.mockResolvedValue([
      { id: 1, name: 'Product A', sku: 'SKU-1' },
    ]);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        {
          day: new Date('2026-01-01T00:00:00.000Z'),
          total_sales: '50000.00',
          transactions: 4,
        },
        {
          day: new Date('2026-01-03T00:00:00.000Z'),
          total_sales: '190000.00',
          transactions: 8,
        },
      ])
      .mockResolvedValueOnce([
        {
          day: new Date('2026-01-01T00:00:00.000Z'),
          items: '20',
        },
        {
          day: new Date('2026-01-03T00:00:00.000Z'),
          items: '64',
        },
      ])
      .mockResolvedValueOnce([
        {
          total_products: BigInt(120),
          low_stock_items: BigInt(15),
          out_of_stock_items: BigInt(5),
          in_stock_items: BigInt(100),
        },
      ]);
  });

  test('analytics omits restricted finance metrics for managers and applies the selected range consistently', async () => {
    currentRole = 'MANAGER';

    const { GET } = await import('@/app/api/dashboard/analytics/route');
    const response = await GET({
      url: 'http://localhost:3000/api/dashboard/analytics?dateFrom=2026-01-01&dateTo=2026-01-03',
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.permissions.canViewRevenue).toBe(false);
    expect(payload.data.permissions.canReadFinanceTransactions).toBe(true);
    expect(payload.data.kpis.map((item: any) => item.title)).toContain(
      'Completed Sales'
    );
    expect(payload.data.kpis.map((item: any) => item.title)).not.toContain(
      'Operating Revenue'
    );
    expect(payload.data.modules.find((item: any) => item.id === 'finance').href).toBe(
      '/finance/transactions'
    );
    expect(payload.data.charts.primaryTrend.series).toEqual([
      expect.objectContaining({ key: 'transactions', format: 'number' }),
      expect.objectContaining({ key: 'items', format: 'number' }),
    ]);
    expect(payload.data.charts.primaryTrend.data).toHaveLength(3);
    expect(
      payload.data.charts.primaryTrend.data.find(
        (item: any) => item.date === '2026-01-02'
      )
    ).toMatchObject({
      transactions: 0,
      items: 0,
    });
    expect(payload.data.charts.topProducts.metricLabel).toBe('Units sold');
    expect(mockGetFinanceAggregate).not.toHaveBeenCalled();

    const currentWhere = prismaMock.salesTransaction.count.mock.calls[0][0].where;
    const previousWhere = prismaMock.salesTransaction.count.mock.calls[1][0].where;

    const normalizeToDay = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const currentDays =
      Math.floor(
        (normalizeToDay(currentWhere.created_at.lte).getTime() -
          normalizeToDay(currentWhere.created_at.gte).getTime()) /
          (24 * 60 * 60 * 1000)
      ) + 1;
    const previousDays =
      Math.floor(
        (normalizeToDay(previousWhere.created_at.lte).getTime() -
          normalizeToDay(previousWhere.created_at.gte).getTime()) /
          (24 * 60 * 60 * 1000)
      ) + 1;

    expect(currentDays).toBe(3);
    expect(previousDays).toBe(3);
    expect(previousWhere.created_at.lte.getTime()).toBeLessThan(
      currentWhere.created_at.gte.getTime()
    );
  });

  test('analytics includes finance KPIs and finance module for admins', async () => {
    currentRole = 'ADMIN';
    mockGetFinanceAggregate
      .mockResolvedValueOnce({ summary: { totalTransactions: 9 }, transactions: [] })
      .mockResolvedValueOnce({ summary: { totalTransactions: 6 }, transactions: [] });
    mockSummarizeCanonicalFinanceAggregate
      .mockReturnValueOnce({
        operatingRevenue: 300000,
        netProfit: 120000,
      })
      .mockReturnValueOnce({
        operatingRevenue: 200000,
        netProfit: 80000,
      });

    const { GET } = await import('@/app/api/dashboard/analytics/route');
    const response = await GET({
      url: 'http://localhost:3000/api/dashboard/analytics?dateFrom=2026-01-01&dateTo=2026-01-03',
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.permissions.canViewRevenue).toBe(true);
    expect(payload.data.kpis.map((item: any) => item.title)).toEqual(
      expect.arrayContaining(['Operating Revenue', 'Net Profit'])
    );
    expect(payload.data.modules.find((item: any) => item.id === 'finance').href).toBe(
      '/finance'
    );
    expect(payload.data.charts.primaryTrend.series[0]).toMatchObject({
      key: 'sales',
      format: 'currency',
    });
    expect(payload.data.charts.topProducts.metricLabel).toBe('Revenue');
    expect(mockGetFinanceAggregate).toHaveBeenCalledTimes(2);
    expect(mockSummarizeCanonicalFinanceAggregate).toHaveBeenCalledTimes(2);
  });

  test('analytics falls back to operational metrics when admin finance aggregation fails', async () => {
    currentRole = 'ADMIN';
    mockGetFinanceAggregate.mockRejectedValueOnce(
      new Error('Database connection exhausted')
    );

    const { GET } = await import('@/app/api/dashboard/analytics/route');
    const response = await GET({
      url: 'http://localhost:3000/api/dashboard/analytics?dateFrom=2026-01-01&dateTo=2026-01-03',
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.permissions.canViewRevenue).toBe(true);
    expect(payload.data.kpis.map((item: any) => item.title)).toContain(
      'Completed Sales'
    );
    expect(payload.data.kpis.map((item: any) => item.title)).not.toContain(
      'Operating Revenue'
    );
    expect(payload.data.modules.find((item: any) => item.id === 'finance')).toMatchObject(
      {
        href: '/finance',
        badge: 'Finance analytics temporarily unavailable',
      }
    );
    expect(payload.data.charts.primaryTrend.series).toEqual([
      expect.objectContaining({ key: 'transactions', format: 'number' }),
      expect.objectContaining({ key: 'items', format: 'number' }),
    ]);
    expect(mockGetFinanceAggregate).toHaveBeenCalledTimes(1);
  });

  test('operations clamps the recent transactions limit and returns role-safe quick actions', async () => {
    currentRole = 'STAFF';
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        total_products: BigInt(140),
        low_stock_items: BigInt(7),
        out_of_stock_items: BigInt(4),
        in_stock_items: BigInt(129),
      },
    ]);
    prismaMock.salesTransaction.findMany.mockResolvedValue([
      {
        id: 2,
        transaction_number: 'TX-002',
        total_amount: 4000,
        created_at: new Date('2026-01-03T10:00:00.000Z'),
        customer: { name: 'Jane Doe' },
        sales_items: [{ products: { name: 'Item B' } }],
      },
      {
        id: 1,
        transaction_number: 'TX-001',
        total_amount: 2500,
        created_at: new Date('2026-01-02T10:00:00.000Z'),
        customer: null,
        sales_items: [{ products: { name: 'Item A' } }],
      },
    ]);
    prismaMock.salesItem.groupBy.mockResolvedValue([
      { transaction_id: 2, _sum: { quantity: 3 } },
      { transaction_id: 1, _sum: { quantity: 1 } },
    ]);

    const { GET } = await import('@/app/api/dashboard/operations/route');
    const response = await GET({
      url: 'http://localhost:3000/api/dashboard/operations?limit=99',
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.salesTransaction.findMany.mock.calls[0][0].take).toBe(8);
    expect(prismaMock.salesTransaction.findMany.mock.calls[0][0].orderBy).toEqual({
      created_at: 'desc',
    });
    expect(payload.data.recentTransactions[0]).toMatchObject({
      id: 2,
      customerName: 'Jane Doe',
      totalItems: 3,
    });
    expect(payload.data.quickActions.map((item: any) => item.label)).toEqual(
      expect.arrayContaining(['Open POS', 'Inventory', 'Transaction History'])
    );
    expect(payload.data.quickActions.map((item: any) => item.label)).not.toContain(
      'Add Product'
    );
    expect(payload.data.quickActions.map((item: any) => item.label)).not.toContain(
      'Finance Overview'
    );
    expect(payload.data.quickActions.map((item: any) => item.label)).not.toContain(
      'Admin'
    );
  });
});
