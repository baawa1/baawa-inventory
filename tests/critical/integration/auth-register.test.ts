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

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email/service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendVerificationEmailWithId: jest.fn(),
    sendAdminNewUserNotification: jest.fn(),
  },
}));

jest.mock('@/lib/utils/audit-logger', () => ({
  AuditLogger: {
    logRegistration: jest.fn(),
    logAuthEvent: jest.fn(),
  },
}));

import { POST } from '@/app/api/auth/register/route';
const prismaMock = (jest.requireMock('@/lib/db') as { prisma: any }).prisma;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: unknown) =>
    ({
      json: async () => body,
      headers: new Headers({ 'x-forwarded-for': '127.0.0.1' }),
    }) as any;

  it('returns 400 for invalid input', async () => {
    const response = await POST(createRequest({}));
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Invalid input data');
  });

  it('returns 409 when verified user already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 1,
      emailVerified: true,
    });

    const response = await POST(
      createRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      })
    );

    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.error).toBe('User with this email already exists');
  });
});
