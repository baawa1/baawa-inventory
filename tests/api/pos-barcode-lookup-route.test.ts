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
    product: {
      findFirst: jest.fn(),
    },
  },
}));

import { GET } from '@/app/api/pos/barcode-lookup/route';
import { prisma } from '@/lib/db';

const prismaMock = prisma as unknown as {
  product: {
    findFirst: jest.Mock;
  };
};

describe('GET /api/pos/barcode-lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (barcode: string) =>
    ({
      url: `http://localhost/api/pos/barcode-lookup?barcode=${encodeURIComponent(barcode)}`,
      headers: new Headers(),
      user: { id: '1', role: 'STAFF' },
    }) as any;

  it('returns the exact active product match for a barcode', async () => {
    prismaMock.product.findFirst.mockResolvedValue({
      id: 7,
      name: 'Barcode Product',
      sku: 'BAR-007',
      barcode: '1234567890128',
      price: 3500,
      stock: 4,
      status: 'ACTIVE',
      description: 'Scannable item',
      images: [{ url: 'https://example.com/item.jpg' }],
      updatedAt: new Date('2026-04-26T08:00:00.000Z'),
      category: { id: 1, name: 'Accessories' },
      brand: { id: 2, name: 'Baawa' },
    });

    const response = await GET(createRequest('1234567890128'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'ACTIVE',
          sku: {
            equals: '1234567890128',
            mode: 'insensitive',
          },
        },
      })
    );
    expect(payload).toEqual(
      expect.objectContaining({
        id: 7,
        name: 'Barcode Product',
        sku: 'BAR-007',
        barcode: '1234567890128',
        category: 'Accessories',
        brand: 'Baawa',
      })
    );
  });

  it('returns 404 when no active product matches the barcode', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null);

    const response = await GET(createRequest('0000000000000'));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Product not found' });
  });
});
