jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

const mockSendPasswordResetEmail = jest.fn();
jest.mock('@/lib/email/service', () => ({
  emailService: {
    sendPasswordResetEmail: (...args: any[]) =>
      mockSendPasswordResetEmail(...args),
  },
}));

const mockLogPasswordResetRequest = jest.fn();
const mockLogAuthEvent = jest.fn();
jest.mock('@/lib/utils/audit-logger', () => ({
  AuditLogger: {
    logPasswordResetRequest: (...args: any[]) =>
      mockLogPasswordResetRequest(...args),
    logAuthEvent: (...args: any[]) => mockLogAuthEvent(...args),
  },
}));

jest.mock('@/lib/rate-limiting', () => ({
  withRateLimit: jest.fn(() => (handler: any) => handler),
}));

jest.mock('@/lib/utils', () => ({
  getAppBaseUrl: () => 'http://localhost:3000',
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('a'.repeat(32))),
}));

import { POST } from '@/app/api/auth/forgot-password/route';

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: unknown) =>
    ({
      json: async () => body,
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'jest',
      }),
    }) as any;

  it('returns 400 for invalid email input', async () => {
    const response = await POST(createRequest({ email: 'bad-email' }));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Invalid email format');
  });

  it('sends a reset email for an eligible user', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      isActive: true,
      userStatus: 'APPROVED',
      emailVerified: true,
    });
    mockUpdate.mockResolvedValueOnce({});
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);
    mockLogPasswordResetRequest.mockResolvedValueOnce(undefined);

    const response = await POST(createRequest({ email: 'jane@example.com' }));

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        resetToken: expect.any(String),
        resetTokenExpires: expect.any(Date),
      },
    });
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      'jane@example.com',
      expect.objectContaining({
        firstName: 'Jane',
        resetLink: expect.stringContaining(
          'http://localhost:3000/reset-password?token='
        ),
        expiresInHours: 2,
      })
    );
    expect(mockLogPasswordResetRequest).toHaveBeenCalled();

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
  });

  it('returns the generic success message for ineligible users without sending email', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 2,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      isActive: false,
      userStatus: 'SUSPENDED',
      emailVerified: true,
    });
    mockLogAuthEvent.mockResolvedValueOnce(undefined);

    const response = await POST(createRequest({ email: 'jane@example.com' }));

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    expect(mockLogAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PASSWORD_RESET_REQUEST',
        userEmail: 'jane@example.com',
        success: false,
      }),
      expect.anything()
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.message).toBe(
      'If an account with this email exists, a password reset link has been sent.'
    );
  });

  it('returns 500 when the route throws unexpectedly', async () => {
    mockFindUnique.mockRejectedValueOnce(new Error('Database failed'));
    mockLogAuthEvent.mockResolvedValueOnce(undefined);

    const response = await POST(createRequest({ email: 'jane@example.com' }));

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toBe(
      'Failed to process password reset request. Please try again.'
    );
  });
});
