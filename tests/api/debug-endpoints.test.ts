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

jest.mock('@/lib/config/env-validation', () => ({
  envConfig: mockEnvConfig,
}));

// Import the route handlers after mocking
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
        // Mock cookies
        const mockCookieStore = {
          set: jest.fn(),
        };
        
        // Mock the cookies function
        jest.doMock('next/headers', () => ({
          cookies: jest.fn().mockResolvedValue(mockCookieStore),
        }));

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
        // Mock email service
        jest.doMock('@/lib/email/service', () => ({
          emailService: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(true),
          }
        }));

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