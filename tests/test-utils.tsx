import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { APIUser } from "@/hooks/api/users";

// Mock toast globally
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Create a default user for tests
const createMockUser = (overrides: Partial<APIUser> = {}): APIUser => ({
  id: 1,
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "ADMIN",
  userStatus: "APPROVED",
  isActive: true,
  emailVerified: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Mock next-auth session
const createMockSession = (userOverrides: Partial<APIUser> = {}) => {
  const user = createMockUser(userOverrides);
  return {
    user: {
      id: user.id.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.userStatus,
      emailVerified: user.emailVerified,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
};

interface TestWrapperProps {
  user?: APIUser | null;
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
  user?: APIUser | null;
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
export { createMockUser, createMockSession };
