import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Mock global objects
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: componentWillReceiveProps") ||
        args[0].includes("Warning: componentWillUpdate"))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: jest.fn(),
});

// Mock window.getComputedStyle
Object.defineProperty(window, "getComputedStyle", {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-url");

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = jest.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => "test-uuid"),
  },
});

// Mock process.env
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Setup test database functions
export const setupTestDatabase = async () => {
  // This would be implemented to set up a test database
  // For now, we'll just log that it's being called
  console.log("Setting up test database...");
};

export const cleanupTestDatabase = async () => {
  // This would be implemented to clean up the test database
  // For now, we'll just log that it's being called
  console.log("Cleaning up test database...");
};

// Mock Prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    brand: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock authentication
jest.mock("@/lib/auth", () => ({
  getServerSession: jest.fn(),
  getSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock email service
jest.mock("@/lib/email", () => ({
  sendEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// Mock upload service
jest.mock("@/lib/upload", () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
}));

// Mock notifications
jest.mock("@/lib/notifications", () => ({
  showNotification: jest.fn(),
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

// Setup test utilities
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: "ADMIN",
  userStatus: "APPROVED",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBrand = (overrides = {}) => ({
  id: "test-brand-id",
  name: "Test Brand",
  description: "Test Description",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCategory = (overrides = {}) => ({
  id: "test-category-id",
  name: "Test Category",
  description: "Test Description",
  isActive: true,
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: "test-product-id",
  name: "Test Product",
  description: "Test Description",
  sku: "TEST-SKU-001",
  price: 1000,
  costPrice: 500,
  stockQuantity: 100,
  minStockLevel: 10,
  brandId: "test-brand-id",
  categoryId: "test-category-id",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Setup test environment variables
process.env.TEST_DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.TEST_API_URL = "http://localhost:3001/api";
process.env.TEST_ADMIN_EMAIL = "admin@test.com";
process.env.TEST_ADMIN_PASSWORD = "password123";

// Export test configuration
export const testConfig = {
  database: {
    url: process.env.TEST_DATABASE_URL,
  },
  api: {
    url: process.env.TEST_API_URL,
  },
  auth: {
    adminEmail: process.env.TEST_ADMIN_EMAIL,
    adminPassword: process.env.TEST_ADMIN_PASSWORD,
  },
};
