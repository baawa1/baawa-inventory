import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

// Mock toast globally
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Define the user type for tests
interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  image?: string;
}

export const mockUser: TestUser = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
  role: "STAFF",
  status: "ACTIVE",
  isEmailVerified: true,
  image: "https://example.com/avatar.jpg",
};

export const createMockUser = (
  overrides: Partial<TestUser> = {}
): TestUser => ({
  id: "1",
  email: "test@example.com",
  name: "Test User",
  role: "STAFF",
  status: "ACTIVE",
  isEmailVerified: true,
  image: "https://example.com/avatar.jpg",
  ...overrides,
});

// Mock next-auth session
const createMockSession = (userOverrides: Partial<TestUser> = {}): Session => {
  const user = createMockUser(userOverrides);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      image: user.image,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
};

interface TestWrapperProps {
  user?: TestUser | null;
  children: React.ReactNode;
}

function TestWrapper({ user = createMockUser(), children }: TestWrapperProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const mockSession = user ? createMockSession(user) : null;

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>{children}</SessionProvider>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  user?: TestUser | null;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> => {
  const { user, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper user={user}>{children}</TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
export { createMockSession };
