const mockAuditLogCreate = jest.fn();
const mockAuditLogFindMany = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
      findMany: (...args: unknown[]) => mockAuditLogFindMany(...args),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

jest.mock('@/lib/utils/error-sanitizer', () => ({
  ErrorSanitizer: {
    logError: jest.fn(),
  },
}));

import { AuditLogger } from '@/lib/utils/audit-logger';
import { AuditLogAction } from '@/types/audit';

describe('AuditLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes structured auth metadata instead of stringified JSON', async () => {
    mockAuditLogCreate.mockResolvedValue({ id: 1 });

    await AuditLogger.logAuthEvent(
      {
        action: AuditLogAction.LOGIN_FAILED,
        userEmail: 'User@Example.com',
        success: false,
        errorMessage: 'Invalid password',
        details: {
          reason: 'INVALID_CREDENTIALS',
        },
      },
      {
        headers: new Headers({
          'x-forwarded-for': '203.0.113.9',
          'user-agent': 'jest-agent',
        }),
        method: 'POST',
        url: 'http://localhost/api/auth/login',
      }
    );

    const createArgs = mockAuditLogCreate.mock.calls[0][0];

    expect(createArgs.data).toMatchObject({
      action: AuditLogAction.LOGIN_FAILED,
      table_name: 'auth',
      ip_address: '203.0.113.9',
      user_agent: 'jest-agent',
      new_values: {
        success: false,
        userEmail: 'user@example.com',
        errorMessage: 'Invalid password',
        details: {
          reason: 'INVALID_CREDENTIALS',
        },
      },
    });
    expect(typeof createArgs.data.new_values).toBe('object');
  });

  it('counts only failed login attempts since the last successful login', async () => {
    mockAuditLogFindMany.mockResolvedValue([
      {
        action: AuditLogAction.LOGIN_FAILED,
        created_at: new Date('2026-04-25T10:03:00.000Z'),
      },
      {
        action: AuditLogAction.LOGIN_FAILED,
        created_at: new Date('2026-04-25T10:02:00.000Z'),
      },
      {
        action: AuditLogAction.LOGIN_SUCCESS,
        created_at: new Date('2026-04-25T10:01:00.000Z'),
      },
      {
        action: AuditLogAction.LOGIN_FAILED,
        created_at: new Date('2026-04-25T10:00:00.000Z'),
      },
    ]);

    const failedAttempts = await AuditLogger.getFailedLoginAttempts(
      'unknown',
      'user@example.com',
      24
    );

    expect(failedAttempts).toBe(2);
    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          action: {
            in: [AuditLogAction.LOGIN_FAILED, AuditLogAction.LOGIN_SUCCESS],
          },
          AND: [
            {
              new_values: {
                path: ['userEmail'],
                equals: 'user@example.com',
              },
            },
          ],
        }),
        orderBy: { created_at: 'desc' },
      })
    );
  });

  it('returns the latest failed login timestamp from the active failure streak', async () => {
    const latestFailure = new Date('2026-04-25T11:30:00.000Z');

    mockAuditLogFindMany.mockResolvedValue([
      {
        action: AuditLogAction.LOGIN_FAILED,
        created_at: latestFailure,
      },
      {
        action: AuditLogAction.LOGIN_SUCCESS,
        created_at: new Date('2026-04-25T11:00:00.000Z'),
      },
    ]);

    const lastFailedAttempt = await AuditLogger.getLastFailedLoginAttempt(
      '203.0.113.4'
    );

    expect(lastFailedAttempt).toEqual(latestFailure);
  });
});
