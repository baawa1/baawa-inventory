import { config } from "dotenv";

// Load environment variables for testing
config({ path: ".env.test" });

// Set up global test environment
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console.log and console.error during tests
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Global test utilities
global.testUtils = {
  createMockBrand: (overrides = {}) => ({
    id: 1,
    name: "Test Brand",
    description: "A test brand",
    image: "https://example.com/test.jpg",
    website: "https://testbrand.com",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }),

  createMockBrandList: (count = 5) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Brand ${i + 1}`,
      description: `Description for brand ${i + 1}`,
      image: `https://example.com/brand${i + 1}.jpg`,
      website: `https://brand${i + 1}.com`,
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      _count: { products: Math.floor(Math.random() * 10) },
    })),

  createMockUser: (overrides = {}) => ({
    id: 1,
    email: "test@example.com",
    role: "ADMIN",
    status: "APPROVED",
    ...overrides,
  }),

  createMockSession: (overrides = {}) => ({
    user: global.testUtils.createMockUser(),
    ...overrides,
  }),
};

// Type declarations for global test utilities
declare global {
  var testUtils: {
    createMockBrand: (overrides?: any) => any;
    createMockBrandList: (count?: number) => any[];
    createMockUser: (overrides?: any) => any;
    createMockSession: (overrides?: any) => any;
  };
}
