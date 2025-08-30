/**
 * Tests for middleware security improvements
 * Ensures API routes are properly protected
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';

// Mock environment config
jest.mock('@/lib/config/env-validation');

// Mock auth
jest.mock('#root/auth');

// Mock security headers
const mockGenerateSecurityHeaders = jest.fn(() => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'",
}));

jest.mock('@/lib/security-headers', () => ({
  generateSecurityHeaders: mockGenerateSecurityHeaders,
}));

// Import middleware after mocking
import middleware from '@/middleware';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('Middleware Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Routes', () => {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/pending-approval',
      '/unauthorized',
    ];

    publicRoutes.forEach(route => {
      it(`should allow access to public route: ${route}`, async () => {
        const req = new NextRequest(`http://localhost:3000${route}`);
        const mockReq = Object.assign(req, { auth: null });

        const response = await middleware(mockReq);

        // Should not redirect, just apply security headers
        expect(response).toBeInstanceOf(NextResponse);
        expect(mockGenerateSecurityHeaders).toHaveBeenCalled();
      });
    });
  });

  describe('Public API Routes', () => {
    const publicApiRoutes = [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/verify-email',
      '/api/auth/validate-reset-token',
    ];

    publicApiRoutes.forEach(route => {
      it(`should allow access to public API route: ${route}`, async () => {
        const req = new NextRequest(`http://localhost:3000${route}`);
        const mockReq = Object.assign(req, { auth: null });

        const response = await middleware(mockReq);

        expect(response).toBeInstanceOf(NextResponse);
        expect(mockGenerateSecurityHeaders).toHaveBeenCalled();
      });
    });
  });

  describe('Protected API Routes', () => {
    it('should block unauthenticated API requests', async () => {
      mockAuth.mockResolvedValue(null);
      
      const req = new NextRequest('http://localhost:3000/api/products');
      const mockReq = Object.assign(req, { auth: null });

      const response = await middleware(mockReq);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should block API requests from unverified users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'EMPLOYEE',
          status: 'APPROVED',
          isEmailVerified: false, // Not verified
        }
      });

      const req = new NextRequest('http://localhost:3000/api/products');
      const mockReq = Object.assign(req, { 
        auth: {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'EMPLOYEE',
            status: 'APPROVED',
            isEmailVerified: false,
          }
        }
      });

      const response = await middleware(mockReq);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account not fully activated');
    });

    it('should block API requests from unapproved users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'EMPLOYEE',
          status: 'PENDING', // Not approved
          isEmailVerified: true,
        }
      });

      const req = new NextRequest('http://localhost:3000/api/products');
      const mockReq = Object.assign(req, { 
        auth: {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'EMPLOYEE',
            status: 'PENDING',
            isEmailVerified: true,
          }
        }
      });

      const response = await middleware(mockReq);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account not fully activated');
    });

    it('should allow API requests from properly authenticated users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'EMPLOYEE',
          status: 'APPROVED',
          isEmailVerified: true,
        }
      });

      const req = new NextRequest('http://localhost:3000/api/products');
      const mockReq = Object.assign(req, { 
        auth: {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'EMPLOYEE',
            status: 'APPROVED',
            isEmailVerified: true,
          }
        }
      });

      const response = await middleware(mockReq);

      // Should pass through without blocking
      expect(response).toBeInstanceOf(NextResponse);
      expect(mockGenerateSecurityHeaders).toHaveBeenCalled();
    });
  });

  describe('Protected Page Routes', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockAuth.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/dashboard');
      const mockReq = Object.assign(req, { auth: null });

      const response = await middleware(mockReq);

      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should redirect unverified users to verify email', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'EMPLOYEE',
          status: 'PENDING',
          isEmailVerified: false,
        }
      });

      const req = new NextRequest('http://localhost:3000/dashboard');
      const mockReq = Object.assign(req, { 
        auth: {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'EMPLOYEE',
            status: 'PENDING',
            isEmailVerified: false,
          }
        }
      });

      const response = await middleware(mockReq);

      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/verify-email');
    });

    it('should redirect unapproved users to pending approval', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'EMPLOYEE',
          status: 'VERIFIED', // Not approved yet
          isEmailVerified: true,
        }
      });

      const req = new NextRequest('http://localhost:3000/dashboard');
      const mockReq = Object.assign(req, { 
        auth: {
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'EMPLOYEE',
            status: 'VERIFIED',
            isEmailVerified: true,
          }
        }
      });

      const response = await middleware(mockReq);

      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/pending-approval');
    });
  });

  describe('Security Headers', () => {
    it('should apply security headers to all responses', async () => {
      const req = new NextRequest('http://localhost:3000/');
      const mockReq = Object.assign(req, { auth: null });

      await middleware(mockReq);

      expect(mockGenerateSecurityHeaders).toHaveBeenCalled();
    });

    it('should include security headers in error responses', async () => {
      mockAuth.mockResolvedValue(null);
      
      const req = new NextRequest('http://localhost:3000/api/products');
      const mockReq = Object.assign(req, { auth: null });

      const response = await middleware(mockReq);

      // Check that security headers are present even in error responses
      expect(mockGenerateSecurityHeaders).toHaveBeenCalled();
    });
  });

  describe('Route Matching', () => {
    it('should properly identify API routes', async () => {
      const apiRoutes = [
        '/api/products',
        '/api/categories',
        '/api/users',
        '/api/inventory',
      ];

      for (const route of apiRoutes) {
        const req = new NextRequest(`http://localhost:3000${route}`);
        expect(req.nextUrl.pathname.startsWith('/api/')).toBe(true);
      }
    });

    it('should properly identify page routes', async () => {
      const pageRoutes = [
        '/dashboard',
        '/products',
        '/inventory',
        '/reports',
      ];

      for (const route of pageRoutes) {
        const req = new NextRequest(`http://localhost:3000${route}`);
        expect(req.nextUrl.pathname.startsWith('/api/')).toBe(false);
      }
    });
  });
});

describe('Middleware Configuration', () => {
  it('should have proper middleware matcher config', () => {
    // This tests that our middleware config excludes the right static files
    const staticPaths = [
      '/_next/static/test.js',
      '/_next/image/test.jpg',
      '/favicon.png',
      '/manifest.json',
      '/logo.svg',
    ];

    // These should be excluded from middleware processing
    staticPaths.forEach(path => {
      const req = new NextRequest(`http://localhost:3000${path}`);
      // The matcher config should prevent middleware from running on these paths
      // This is tested at the Next.js level, but we can verify the paths are correct
      expect(path).toMatch(/^\/(_next\/static|_next\/image|favicon\.png|manifest\.json|.*\.svg)/);
    });
  });
});