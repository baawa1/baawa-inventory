import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route';

const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockHash = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSendPasswordResetConfirmationEmail = jest.fn();
const mockLogAuthEvent = jest.fn();
const mockLogPasswordResetRequest = jest.fn();
const mockLogPasswordResetSuccess = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      findFirst: (...args: any[]) => mockFindFirst(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

jest.mock('@/lib/email/service', () => ({
  emailService: {
    sendPasswordResetEmail: (...args: any[]) =>
      mockSendPasswordResetEmail(...args),
    sendPasswordResetConfirmationEmail: (...args: any[]) =>
      mockSendPasswordResetConfirmationEmail(...args),
  },
}));

jest.mock('@/lib/utils/audit-logger', () => ({
  AuditLogger: {
    logAuthEvent: (...args: any[]) => mockLogAuthEvent(...args),
    logPasswordResetRequest: (...args: any[]) =>
      mockLogPasswordResetRequest(...args),
    logPasswordResetSuccess: (...args: any[]) =>
      mockLogPasswordResetSuccess(...args),
  },
}));

jest.mock('@/lib/utils', () => ({
  getAppBaseUrl: () => 'http://localhost:3000',
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('a'.repeat(32))),
}));

jest.mock('bcryptjs', () => ({
  hash: (...args: any[]) => mockHash(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: any[]) => mockLoggerError(...args),
    security: jest.fn(),
  },
}));

describe('Password Route Rate Limit Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
    mockFindFirst.mockResolvedValue(null);
    mockLogAuthEvent.mockResolvedValue(undefined);
    mockLogPasswordResetRequest.mockResolvedValue(undefined);
    mockLogPasswordResetSuccess.mockResolvedValue(undefined);
  });

  const createRequest = (body: unknown, ip: string) =>
    ({
      json: async () => body,
      headers: new Headers({
        'x-forwarded-for': ip,
        'user-agent': 'jest-rate-limit',
        'content-type': 'application/json',
      }),
    }) as any;

  it('throttles forgot-password after the third request from the same IP', async () => {
    const ip = '203.0.113.31';

    for (let i = 0; i < 3; i += 1) {
      const response = await forgotPasswordPOST(
        createRequest({ email: 'rate-limit@example.com' }, ip)
      );

      expect(response.status).toBe(200);
    }

    const throttledResponse = await forgotPasswordPOST(
      createRequest({ email: 'rate-limit@example.com' }, ip)
    );
    const payload = await throttledResponse.json();

    expect(throttledResponse.status).toBe(429);
    expect(payload.error).toBe('Too many requests');
    expect(payload.message).toBe('Rate limit exceeded. Please try again later.');
    expect(payload.retryAfter).toBeGreaterThan(0);
  });

  it('throttles repeated failed reset-password attempts after the fifth request', async () => {
    const ip = '198.51.100.41';
    const requestBody = {
      token: 'invalid-token',
      password: 'Abcd123.',
      confirmPassword: 'Abcd123.',
    };

    for (let i = 0; i < 5; i += 1) {
      const response = await resetPasswordPOST(createRequest(requestBody, ip));
      expect(response.status).toBe(400);
    }

    const throttledResponse = await resetPasswordPOST(
      createRequest(requestBody, ip)
    );
    const payload = await throttledResponse.json();

    expect(throttledResponse.status).toBe(429);
    expect(payload.error).toBe('Too many requests');
    expect(payload.retryAfter).toBeGreaterThan(0);
  });
});
