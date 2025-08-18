/**
 * Test Provider Utilities
 * Wraps components with necessary providers for testing
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

// All providers wrapper for testing - simplified for now
export const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders queryClient={queryClient}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Hook wrapper for testing hooks
export const createHookWrapper = (
  queryClient: QueryClient = createTestQueryClient()
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders queryClient={queryClient}>
      {children}
    </AllProviders>
  );
  return Wrapper;
};

// Utility for creating isolated query client for each test
export const createIsolatedQueryClient = () => {
  const queryClient = createTestQueryClient();
  
  // Clear all caches after each test
  afterEach(() => {
    queryClient.clear();
  });

  return queryClient;
};

// Mock implementations for common Next.js hooks
export const mockNextRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

export const mockSearchParams = {
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(),
};

// Export re-exports for convenience
export { render, screen, waitFor, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export type { RenderResult } from '@testing-library/react';