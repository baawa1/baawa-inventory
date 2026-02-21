jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

jest.mock('@/lib/api-middleware', () => ({
  withAuth: (handler: any) => handler,
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { POST } from '@/app/api/auth/refresh-session/route';
const prismaMock = (jest.requireMock('@/lib/db') as { prisma: any }).prisma;

describe('POST /api/auth/refresh-session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (userId: string) =>
    ({
      user: { id: userId },
    }) as any;

  it('returns user data when found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      userStatus: 'APPROVED',
      emailVerified: true,
      isActive: true,
    });

    const response = await POST(createRequest('1'));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.user).toMatchObject({
      id: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  it('returns 404 when user is missing', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const response = await POST(createRequest('2'));
    expect(response.status).toBe(404);

    const payload = await response.json();
    expect(payload.error).toBe('User not found');
  });
});
