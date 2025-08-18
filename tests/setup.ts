import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
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
  }),
}));

// Auth module is mocked via moduleNameMapper in jest.config.js

// Mock Web APIs for Node environment
Object.defineProperty(global, 'Request', {
  value: class Request {
    constructor(public url: string, public init?: RequestInit) {
      this.method = init?.method || 'GET';
    }
    headers = new Map();
    method = 'GET';
    body = null;
    json = jest.fn();
    text = jest.fn();
  },
});

Object.defineProperty(global, 'Response', {
  value: class Response {
    constructor(public body?: any, public init?: ResponseInit) {
      this.status = init?.status || 200;
    }
    status = 200;
    headers = new Map();
    json = jest.fn();
    text = jest.fn();
    
    static json(data: any, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }
  },
});

// Mock NextResponse specifically  
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      headers: new Map([['Content-Type', 'application/json']]),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })),
    redirect: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
