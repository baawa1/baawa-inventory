import "@testing-library/jest-dom";

// Polyfill for jsdom environment
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as any;
}

// Mock environment variables for tests
Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DIRECT_URL: "postgresql://test:test@localhost:5432/test",
  SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test_anon_key",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test_anon_key",
  SUPABASE_SERVICE_ROLE_KEY: "test_service_role_key",
  NEXTAUTH_SECRET: "test_secret",
  NEXTAUTH_URL: "http://localhost:3000",
  OPENAI_API_KEY: "test_openai_key",
  WEBFLOW_API_TOKEN: "test_webflow_token",
  WEBFLOW_SITE_ID: "test_site_id",
  WEBFLOW_COLLECTION_ID: "test_collection_id",
});

// Mock fetch globally for API tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.location
if (typeof window !== "undefined") {
  if (!window.location || typeof window.location.href === "undefined") {
    const locationMock = {
      href: "http://localhost:3000",
      origin: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
    };

    // Only redefine if needed
    if (!Object.getOwnPropertyDescriptor(window, "location")?.configurable) {
      // window.location is not configurable, so we can't redefine it
      Object.assign(window.location, locationMock);
    } else {
      Object.defineProperty(window, "location", {
        value: locationMock,
        writable: true,
        configurable: true,
      });
    }
  }
}

// Mock window.localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    route: "/",
    pathname: "/",
    query: {},
    asPath: "/",
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock next-auth/react hooks
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "ADMIN",
        status: "APPROVED",
        emailVerified: true,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: "authenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Mock admin guard hook
jest.mock("@/hooks/useAdminGuard", () => ({
  useAdminGuard: jest.fn(() => ({
    isAdmin: true,
    isLoading: false,
    session: {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "ADMIN",
      },
    },
  })),
}));

// Mock auth guard hook
jest.mock("@/hooks/useAuthGuard", () => ({
  useAuthGuard: jest.fn(() => ({
    isAuthenticated: true,
    isAuthorized: true,
    user: {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      role: "ADMIN",
    },
    session: {
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "ADMIN",
      },
    },
    isLoading: false,
  })),
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});
