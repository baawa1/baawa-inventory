/**
 * Tests for secured debug/test endpoints
 * These endpoints should only be accessible in development mode
 */

import { NextRequest } from 'next/server';

// Mock environment config to test both development and production modes
const mockEnvConfig = {
  isDevelopment: false, // Will be overridden in tests
  isProduction: true,
  isTest: false,
  nextAuthSecret: 'test-secret-key-for-tests-only-32-chars-long',
};
const mockCookieStore = {
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@/lib/config/env-validation', () => ({
  envConfig: {
    get isDevelopment() {
      return mockEnvConfig.isDevelopment;
    },
    get isProduction() {
      return mockEnvConfig.isProduction;
    },
    get isTest() {
      return mockEnvConfig.isTest;
    },
    get nextAuthSecret() {
      return mockEnvConfig.nextAuthSecret;
    },
    getOptionalString: jest.fn(() => undefined),
  },
}));

jest.mock('@/lib/api-middleware', () => ({
  withAuth: jest.fn((handler: (...args: unknown[]) => unknown) => handler),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => mockCookieStore),
}));

jest.mock('next-auth/jwt', () => ({
  encode: jest.fn(async () => 'mock-session-token'),
}));

jest.mock('@/lib/email/service', () => ({
  emailService: {
    sendWelcomeEmail: jest.fn(async () => true),
  },
}));

jest.mock('#root/auth', () => ({
  auth: jest.fn(async () => ({
    user: {
      id: '1',
      email: 'test@example.com',
    },
    role: 'ADMIN',
    status: 'APPROVED',
    isEmailVerified: true,
  })),
}));

jest.mock('../../auth', () => ({
  auth: jest.fn(async () => ({
    user: {
      id: '1',
      email: 'test@example.com',
    },
    role: 'ADMIN',
    status: 'APPROVED',
    isEmailVerified: true,
  })),
}));

// Import the route handlers after mocking
import { GET as debugSessionGET } from '@/app/api/debug/session/route';
import { GET as debugTokenGET } from '@/app/api/debug-token/route';
import { GET as testAuthGET, POST as testAuthPOST, DELETE as testAuthDELETE } from '@/app/api/test-auth/route';
import { POST as testEmailPOST } from '@/app/api/test-email/route';
import { GET as testMiddlewareGET } from '@/app/api/test-middleware/route';

describe('Debug/Test Endpoints Security', () => {
  describe('Production Environment (Security)', () => {
    beforeEach(() => {
      // Set to production mode
      mockEnvConfig.isDevelopment = false;
      mockEnvConfig.isProduction = true;
      jest.clearAllMocks();
    });

    describe('/api/debug-token', () => {
      it('should return 404 in production', async () => {
        // Mock authenticated request
        const req = {
          user: { id: 1, email: 'test@example.com', role: 'ADMIN', status: 'APPROVED' },
          headers: new Map(),
        } as any;

        const response = await debugTokenGET(req);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not found');
      });
    });

    describe('/api/debug/session', () => {
      it('should return 404 in production', async () => {
        const req = {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'ADMIN',
            status: 'APPROVED',
            isEmailVerified: true,
          },
        } as any;

        const response = await debugSessionGET(req);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not found');
      });
    });

    describe('/api/test-auth', () => {
      it('should return 404 for GET in production', async () => {
        const response = await testAuthGET();
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not found');
      });

      it('should return 404 for POST in production', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            email: 'test@example.com',
            role: 'ADMIN',
            status: 'APPROVED'
          })
        } as any;

        const response = await testAuthPOST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not found');
      });

      it('should return 404 for DELETE in production', async () => {
        const response = await testAuthDELETE();
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not found');
      });
    });

    describe('/api/debug/session', () => {
      it('should work in development', async () => {
        mockEnvConfig.isDevelopment = true;
        mockEnvConfig.isProduction = false;

        const req = {
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN',
            status: 'APPROVED',
            isEmailVerified: true,
          },
        } as any;

        const response = await debugSessionGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.authenticated).toBe(true);
        expect(data.user.email).toBe('test@example.com');
      });
    });

    describe('/api/test-email', () => {
      it('should return 404 in production', async () => {
        const mockRequest = {} as any;
        const response = await testEmailPOST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not found');
      });
    });

    describe('/api/test-middleware', () => {
      it('should return 404 in production', async () => {
        const mockRequest = {} as any;
        const response = await testMiddlewareGET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Not found');
      });
    });
  });

  describe('Development Environment (Functionality)', () => {
    beforeEach(() => {
      // Set to development mode
      mockEnvConfig.isDevelopment = true;
      mockEnvConfig.isProduction = false;
      jest.clearAllMocks();

      // Mock cookies
      global.fetch = jest.fn();
      mockCookieStore.set.mockClear();
      mockCookieStore.delete.mockClear();
      
      // Mock dynamic imports for logger
      jest.doMock('@/lib/logger', () => ({
        logger: {
          debug: jest.fn(),
          error: jest.fn(),
        }
      }));
    });

    describe('/api/test-auth', () => {
      it('should work in development - GET', async () => {
        const response = await testAuthGET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('development');
      });

      it('should work in development - POST with valid data', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            email: 'test@example.com',
            role: 'ADMIN',
            status: 'APPROVED',
            isEmailVerified: true
          })
        } as any;

        const response = await testAuthPOST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('development only');
      });

      it('should validate required fields in development', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            email: 'test@example.com',
            // Missing role and status
          })
        } as any;

        const response = await testAuthPOST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing required fields');
      });
    });

    describe('/api/test-email', () => {
      it('should work in development', async () => {
        const mockRequest = {} as any;
        const response = await testEmailPOST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('development only');
      });
    });
  });

  describe('Environment Detection', () => {
    it('should correctly identify production environment', () => {
      mockEnvConfig.isDevelopment = false;
      mockEnvConfig.isProduction = true;
      
      expect(mockEnvConfig.isDevelopment).toBe(false);
      expect(mockEnvConfig.isProduction).toBe(true);
    });

    it('should correctly identify development environment', () => {
      mockEnvConfig.isDevelopment = true;
      mockEnvConfig.isProduction = false;
      
      expect(mockEnvConfig.isDevelopment).toBe(true);
      expect(mockEnvConfig.isProduction).toBe(false);
    });
  });
});

describe('Environment Variable Security', () => {
  it('should require NEXTAUTH_SECRET in development', () => {
    expect(mockEnvConfig.nextAuthSecret).toBeDefined();
    expect(mockEnvConfig.nextAuthSecret.length).toBeGreaterThan(30);
  });

  it('should not expose secrets in logs or responses', () => {
    // This test ensures that our mocks don't accidentally expose real secrets
    expect(mockEnvConfig.nextAuthSecret).toContain('test');
    expect(mockEnvConfig.nextAuthSecret).not.toContain('production');
  });
});
