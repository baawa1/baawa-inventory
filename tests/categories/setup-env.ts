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
  createMockCategory: (overrides = {}) => ({
    id: 1,
    name: "Test Category",
    description: "A test category",
    image: "https://example.com/test.jpg",
    isActive: true,
    parentId: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }),

  createMockCategoryList: (count = 5) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Category ${i + 1}`,
      description: `Description for category ${i + 1}`,
      image: `https://example.com/category${i + 1}.jpg`,
      isActive: true,
      parentId: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      parent: null,
      children: [],
      _count: {
        products: Math.floor(Math.random() * 10),
        children: Math.floor(Math.random() * 5),
      },
    })),

  createMockCategoryHierarchy: () => ({
    parent: {
      id: 1,
      name: "Parent Category",
      description: "A parent category",
      image: "https://example.com/parent.jpg",
      isActive: true,
      parentId: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    child: {
      id: 2,
      name: "Child Category",
      description: "A child category",
      image: "https://example.com/child.jpg",
      isActive: true,
      parentId: 1,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    },
    grandchild: {
      id: 3,
      name: "Grandchild Category",
      description: "A grandchild category",
      image: "https://example.com/grandchild.jpg",
      isActive: true,
      parentId: 2,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
    },
  }),

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
    createMockCategory: (overrides?: any) => any;
    createMockCategoryList: (count?: number) => any[];
    createMockCategoryHierarchy: () => any;
    createMockUser: (overrides?: any) => any;
    createMockSession: (overrides?: any) => any;
  };
}
