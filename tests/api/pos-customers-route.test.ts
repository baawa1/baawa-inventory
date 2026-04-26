jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

jest.mock('../../auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  USER_ROLES: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    STAFF: 'STAFF',
  },
  hasRole: jest.fn(() => true),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    customer: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { auth } from '../../auth';
import { GET } from '@/app/api/pos/customers/route';
import { prisma } from '@/lib/db';

const authMock = auth as jest.Mock;
const prismaMock = prisma as unknown as {
  customer: {
    findMany: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
};

describe('GET /api/pos/customers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: '1',
        role: 'STAFF',
      },
    });
  });

  it('excludes staff records from checkout search by default', async () => {
    prismaMock.customer.findMany.mockResolvedValue([
      {
        id: 5,
        name: 'Real Customer',
        email: 'customer@example.com',
        phone: '+2347000000000',
        salesTransactions: [],
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    ]);

    const response = await GET(
      new Request('http://localhost/api/pos/customers?search=customer&fields=basic&limit=20')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    expect(payload).toEqual([
      expect.objectContaining({
        id: '5',
        name: 'Real Customer',
        type: 'customer',
      }),
    ]);
  });
});
