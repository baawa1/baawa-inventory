describe('Password Route Rate Limit Config', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('configures forgot-password rate limiting by IP', () => {
    let capturedConfig: any;

    jest.isolateModules(() => {
      jest.doMock('@/lib/rate-limiting', () => ({
        withRateLimit: (config: any) => {
          capturedConfig = config;
          return (handler: any) => handler;
        },
      }));
      jest.doMock('@/lib/db', () => ({
        prisma: { user: { findUnique: jest.fn(), update: jest.fn() } },
      }));
      jest.doMock('@/lib/email/service', () => ({
        emailService: { sendPasswordResetEmail: jest.fn() },
      }));
      jest.doMock('@/lib/utils/audit-logger', () => ({
        AuditLogger: {
          logPasswordResetRequest: jest.fn(),
          logAuthEvent: jest.fn(),
        },
      }));
      jest.doMock('@/lib/utils', () => ({
        getAppBaseUrl: () => 'http://localhost:3000',
      }));
      jest.doMock('crypto', () => ({
        randomBytes: jest.fn(),
      }));

      require('@/app/api/auth/forgot-password/route');
    });

    expect(capturedConfig.windowMs).toBe(60 * 60 * 1000);
    expect(capturedConfig.maxRequests).toBe(3);
    expect(
      capturedConfig.keyGenerator({
        headers: new Headers({
          'x-forwarded-for': '203.0.113.10',
        }),
      })
    ).toBe('forgot-password:203.0.113.10');
  });

  it('configures reset-password rate limiting by IP', () => {
    let capturedConfig: any;

    jest.isolateModules(() => {
      jest.doMock('@/lib/rate-limiting', () => ({
        withRateLimit: (config: any) => {
          capturedConfig = config;
          return (handler: any) => handler;
        },
      }));
      jest.doMock('@/lib/db', () => ({
        prisma: { user: { findFirst: jest.fn(), update: jest.fn() } },
      }));
      jest.doMock('@/lib/email/service', () => ({
        emailService: {
          sendPasswordResetConfirmationEmail: jest.fn(),
        },
      }));
      jest.doMock('@/lib/utils/audit-logger', () => ({
        AuditLogger: {
          logAuthEvent: jest.fn(),
          logPasswordResetSuccess: jest.fn(),
        },
      }));
      jest.doMock('bcryptjs', () => ({
        hash: jest.fn(),
      }));
      jest.doMock('@/lib/logger', () => ({
        logger: { error: jest.fn() },
      }));

      require('@/app/api/auth/reset-password/route');
    });

    expect(capturedConfig.windowMs).toBe(60 * 60 * 1000);
    expect(capturedConfig.maxRequests).toBe(5);
    expect(
      capturedConfig.keyGenerator({
        headers: new Headers({
          'x-real-ip': '198.51.100.8',
        }),
      })
    ).toBe('reset-password:198.51.100.8');
  });
});
