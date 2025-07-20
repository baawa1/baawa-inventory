// Setup environment variables for product tests
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Mock Web APIs for NextRequest
global.Request = class MockRequest {} as any;
global.Response = class MockResponse {} as any;
global.Headers = class MockHeaders {} as any;

// Mock global fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
  }),
  usePathname: () => "/test",
}));

// Mock Next.js image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return {
      type: "img",
      props: { src, alt: alt || "Image", ...rest },
    };
  },
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    brand: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Mock auth
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock TanStack Query
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}));

// Mock custom hooks
jest.mock("@/hooks/api/categories", () => ({
  useCategories: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCategory: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useTopLevelCategories: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useSubcategories: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCategoriesWithHierarchy: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateCategory: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useUpdateCategory: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useDeleteCategory: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useCategoryOptions: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/api/brands", () => ({
  useBrands: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/api/suppliers", () => ({
  useSuppliers: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/api/products", () => ({
  useProducts: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useProduct: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useCreateProduct: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useUpdateProduct: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useDeleteProduct: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/api/useWebhookSync", () => ({
  useSyncEntity: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/api/brands", () => ({
  useBrands: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useBrand: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useBrandById: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useCreateBrand: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useUpdateBrand: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useDeleteBrand: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useBrandOptions: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/api/suppliers", () => ({
  useSuppliers: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useSupplier: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useCreateSupplier: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useUpdateSupplier: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useDeleteSupplier: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useSupplierOptions: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock file upload
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.size = bits.length;
    this.type = options?.type || "text/plain";
    this.lastModified = options?.lastModified || Date.now();
  }
} as any;

global.FileReader = class MockFileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  result: string | ArrayBuffer | null = null;

  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      if (this.onload) {
        this.result = "data:text/plain;base64,dGVzdA==";
        this.onload.call(this, {} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsText(blob: Blob) {
    setTimeout(() => {
      if (this.onload) {
        this.result = "test content";
        this.onload.call(this, {} as ProgressEvent<FileReader>);
      }
    }, 0);
  }
} as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

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

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
        args[0].includes("Warning: componentWillReceiveProps") ||
        args[0].includes("Warning: componentWillUpdate"))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
        args[0].includes("Warning: componentWillReceiveProps") ||
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
