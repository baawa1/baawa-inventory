import { describe, it, expect } from '@jest/globals';

// Mock NextAuth to avoid ESM import issues
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(),
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
    },
  })),
}));

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'credentials',
    credentials: {},
    authorize: jest.fn(),
  })),
}));

// Mock other dependencies
jest.mock('bcryptjs');
jest.mock('../src/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/utils/account-lockout', () => ({
  AccountLockout: {
    checkLockoutStatus: jest.fn(),
    resetFailedAttempts: jest.fn(),
  },
}));

jest.mock('../src/lib/utils/audit-logger', () => ({
  AuditLogger: {
    logLoginFailed: jest.fn(),
    logLoginSuccess: jest.fn(),
    logLogout: jest.fn(),
  },
}));

// Test that the auth.ts file exports the correct functions
describe('Auth.js v5 Setup', () => {
  it('should have auth.ts file with correct exports', async () => {
    // Dynamic import to test the actual exports
    const authModule = await import('../auth');

    expect(authModule.auth).toBeDefined();
    expect(typeof authModule.auth).toBe('function');

    expect(authModule.handlers).toBeDefined();
    expect(authModule.handlers.GET).toBeDefined();
    expect(authModule.handlers.POST).toBeDefined();
  });

  it('should not export deprecated functions', async () => {
    const authModule = await import('../auth');

    // Should not export signIn/signOut directly (these come from next-auth/react)
    expect((authModule as any).signIn).toBeUndefined();
    expect((authModule as any).signOut).toBeUndefined();
  });
});
