// Shared setup for integration tests
// This must be imported BEFORE any imports that might import auth.ts

// Mock environment configuration first
jest.mock('@/lib/config/env-validation');

// Mock NextAuth before any other imports
jest.mock('#root/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

// Mock API middleware
jest.mock('@/lib/api-middleware', () => ({
  withPermission: (roles: string[], handler: Function) => handler,
  withAuth: (handler: Function) => (req: any, params?: any) => {
    // Add mock user to request for tests
    req.user = {
      id: 1,
      email: 'test@example.com',
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true,
    };
    return handler(req, params);
  },
}));

// Mock logger to prevent console output in tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock security headers
jest.mock('@/lib/security-headers', () => ({
  generateSecurityHeaders: jest.fn(() => ({
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'",
  })),
  applySecurityHeaders: jest.fn((response) => response),
}));

// Standard Prisma mock for integration tests
export const createPrismaMock = (additionalMethods: any = {}) => {
  return jest.mock('@/lib/db', () => ({
    prisma: {
      // User methods
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...additionalMethods.user,
      },
      // Product methods
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...additionalMethods.product,
      },
      // Category methods
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...additionalMethods.category,
      },
      // Brand methods
      brand: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...additionalMethods.brand,
      },
      // Supplier methods
      supplier: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...additionalMethods.supplier,
      },
      // Coupon methods
      coupon: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...additionalMethods.coupon,
      },
      // Sales methods
      sale: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...additionalMethods.sale,
      },
      // Add any additional methods
      ...additionalMethods,
    },
  }));
};

// Create mock request helper
export const createMockRequest = (url: string, method: string = 'GET', body?: any, user?: any) => {
  return {
    url,
    method,
    json: jest.fn().mockResolvedValue(body),
    nextUrl: new URL(url),
    user: user || { id: '1', role: 'ADMIN', status: 'APPROVED' },
  } as any;
};

// Create mock auth session
export const createMockSession = (overrides?: any) => ({
  user: {
    id: '1',
    email: 'test@example.com',
    role: 'ADMIN',
    status: 'APPROVED',
    isEmailVerified: true,
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  },
});