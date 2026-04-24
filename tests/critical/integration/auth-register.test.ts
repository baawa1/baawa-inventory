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

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed-password'),
}));

import { POST } from '@/app/api/auth/register/route';
const prismaMock = (jest.requireMock('@/lib/db') as { prisma: any }).prisma;
const validPassword = 'Abcd123.';

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
        password: validPassword,
        confirmPassword: validPassword,
      })
    );

    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.error).toBe('User with this email already exists');
  });

  it('returns 400 for weak passwords', async () => {
    const response = await POST(
      createRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Invalid input data');
  });

  it('creates a user with a valid 8-character password', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      userStatus: 'PENDING',
      role: 'STAFF',
      createdAt: new Date(),
    });
    prismaMock.user.findMany.mockResolvedValueOnce([]);

    const response = await POST(
      createRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: validPassword,
        confirmPassword: validPassword,
      })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'john@example.com',
          password: 'hashed-password',
        }),
      })
    );
  });
});
