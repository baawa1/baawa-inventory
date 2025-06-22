import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// Mock Prisma client for tests
export const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  supplier: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  salesTransaction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  salesItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productVariant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  stockAdjustment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  purchaseOrder: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  purchaseOrderItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  aiContent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  webflowSync: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

// Mock Supabase client for tests
export const mockSupabase = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  })),
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: "test@example.com",
  name: "Test User",
  role: "STAFF" as const,
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 1,
  name: "Test Product",
  description: "A test product",
  sku: "TEST-001",
  barcode: "123456789",
  category: "Test Category",
  brand: "Test Brand",
  cost: 10.0,
  price: 20.0,
  stock: 100,
  minStock: 10,
  maxStock: 500,
  unit: "pcs",
  weight: 0.5,
  dimensions: "10x10x10",
  color: "Red",
  size: "M",
  material: "Plastic",
  status: "ACTIVE" as const,
  hasVariants: false,
  isArchived: false,
  images: null,
  tags: [],
  metaTitle: null,
  metaDescription: null,
  seoKeywords: [],
  supplierId: 1,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockSupplier = (overrides = {}) => ({
  id: 1,
  name: "Test Supplier",
  contactName: "John Doe",
  email: "supplier@example.com",
  phone: "+1234567890",
  address: "123 Test St",
  notes: "Test supplier notes",
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockSalesTransaction = (overrides = {}) => ({
  id: 1,
  transactionCode: "TXN-001",
  total: 100.0,
  subtotal: 90.0,
  tax: 10.0,
  discount: 0.0,
  discountType: "AMOUNT" as const,
  paymentMethod: "CASH" as const,
  paymentStatus: "PAID" as const,
  customerName: "Test Customer",
  customerEmail: "customer@example.com",
  customerPhone: "+1234567890",
  notes: null,
  receiptNumber: "RCP-001",
  isRefund: false,
  refundReason: null,
  syncedToWebflow: false,
  syncedAt: null,
  cashierId: 1,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const createMockSalesItem = (overrides = {}) => ({
  id: 1,
  quantity: 2,
  unitPrice: 20.0,
  totalPrice: 40.0,
  discount: 0.0,
  transactionId: 1,
  productId: 1,
  variantId: null,
  createdAt: new Date("2024-01-01"),
  ...overrides,
});

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Utility to wait for async operations
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock API response helpers
export const mockApiSuccess = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, data }),
});

export const mockApiError = (message: string, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ success: false, error: message }),
});

// Database connection test utilities
export const testDatabaseConnection = async () => {
  try {
    await mockPrisma.$connect();
    return { success: true, message: "Database connection successful" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Reset all mocks utility
export const resetAllMocks = () => {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockClear();
        }
      });
    }
  });

  Object.values(mockSupabase).forEach((service) => {
    if (typeof service === "object" && service !== null) {
      Object.values(service).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockClear();
        }
      });
    }
  });
};
