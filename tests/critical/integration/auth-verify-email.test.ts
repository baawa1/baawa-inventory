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
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email/service', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
  },
}));

jest.mock('@/lib/utils/audit-logger', () => ({
  AuditLogger: {
    logAuthEvent: jest.fn(),
  },
}));

import { POST, PUT } from '@/app/api/auth/verify-email/route';

const prismaMock = (jest.requireMock('@/lib/db') as { prisma: any }).prisma;
const emailServiceMock = (
  jest.requireMock('@/lib/email/service') as {
    emailService: any;
  }
).emailService;

describe('/api/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: unknown) =>
    ({
      json: async () => body,
      headers: new Headers({ 'x-forwarded-for': '127.0.0.1' }),
    }) as any;

  it('verifies a pending user and returns the login redirect contract', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 42,
      email: 'verified@example.com',
      firstName: 'Verified',
      emailVerificationExpires: new Date(Date.now() + 60_000),
      userStatus: 'PENDING',
      emailVerified: false,
    });
    prismaMock.user.update.mockResolvedValueOnce({
      id: 42,
      email: 'verified@example.com',
      firstName: 'Verified',
      userStatus: 'VERIFIED',
      emailVerified: true,
    });

    const response = await POST(createRequest({ token: 'valid-token' }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.email).toBe('verified@example.com');
    expect(payload.redirectTo).toBe('/login');
    expect(payload.requiresLogin).toBe(true);
    expect(payload.user.status).toBe('VERIFIED');
  });

  it('returns 400 when the verification payload is invalid', async () => {
    const response = await POST(createRequest({ token: '' }));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Invalid input data');
  });

  it('resends a verification email for a pending user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 7,
      firstName: 'Pending',
      email: 'pending@example.com',
      userStatus: 'PENDING',
      emailVerified: false,
      isActive: true,
    });

    const response = await PUT(createRequest({ email: 'pending@example.com' }));

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
      'pending@example.com',
      expect.objectContaining({
        firstName: 'Pending',
        verificationLink: expect.stringContaining('/verify-email?token='),
      })
    );

    const payload = await response.json();
    expect(payload.email).toBe('pending@example.com');
    expect(payload.verificationEmailSent).toBe(true);
  });
});
