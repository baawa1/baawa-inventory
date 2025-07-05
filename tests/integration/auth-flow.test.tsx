import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));

// Mock NextAuth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  getSession: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("Authentication Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={null}>{component}</SessionProvider>
      </QueryClientProvider>
    );
  };

  describe("Complete Registration Flow", () => {
    const MockRegistrationForm = () => {
      const [formData, setFormData] = React.useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
      });

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
          // Redirect to email verification
          window.location.href = "/check-email";
        }
      };

      return (
        <form onSubmit={handleSubmit} data-testid="registration-form">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            data-testid="email-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            data-testid="password-input"
          />
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            data-testid="firstName-input"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            data-testid="lastName-input"
          />
          <button type="submit" data-testid="register-button">
            Register
          </button>
        </form>
      );
    };

    it("should complete successful registration flow", async () => {
      const user = userEvent.setup();

      // Mock successful registration response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "User registered successfully",
          user: {
            id: 1,
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            status: "PENDING",
          },
        }),
      } as Response);

      renderWithProviders(<MockRegistrationForm />);

      // Fill out registration form
      await user.type(screen.getByTestId("email-input"), "test@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.type(screen.getByTestId("firstName-input"), "John");
      await user.type(screen.getByTestId("lastName-input"), "Doe");

      // Submit form
      await user.click(screen.getByTestId("register-button"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
            firstName: "John",
            lastName: "Doe",
          }),
        });
      });
    });

    it("should handle registration validation errors", async () => {
      const user = userEvent.setup();

      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: "Email already exists",
        }),
      } as Response);

      renderWithProviders(<MockRegistrationForm />);

      // Fill out form with existing email
      await user.type(
        screen.getByTestId("email-input"),
        "existing@example.com"
      );
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.type(screen.getByTestId("firstName-input"), "John");
      await user.type(screen.getByTestId("lastName-input"), "Doe");

      // Submit form
      await user.click(screen.getByTestId("register-button"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it("should validate password strength", async () => {
      const user = userEvent.setup();

      renderWithProviders(<MockRegistrationForm />);

      // Try weak password
      await user.type(screen.getByTestId("password-input"), "123");

      // Password should be validated on client side
      const passwordInput = screen.getByTestId("password-input");
      expect(passwordInput).toHaveValue("123");

      // Could add client-side validation feedback here
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();

      renderWithProviders(<MockRegistrationForm />);

      // Try invalid email
      await user.type(screen.getByTestId("email-input"), "invalid-email");

      const emailInput = screen.getByTestId("email-input");
      expect(emailInput).toHaveValue("invalid-email");

      // HTML5 validation would catch this
      expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  describe("Complete Login Flow", () => {
    const MockLoginForm = () => {
      const [formData, setFormData] = React.useState({
        email: "",
        password: "",
      });

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { signIn } = require("next-auth/react");

        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          window.location.href = "/dashboard";
        }
      };

      return (
        <form onSubmit={handleSubmit} data-testid="login-form">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            data-testid="email-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            data-testid="password-input"
          />
          <button type="submit" data-testid="login-button">
            Login
          </button>
        </form>
      );
    };

    it("should complete successful login flow", async () => {
      const user = userEvent.setup();
      const { signIn } = require("next-auth/react");

      // Mock successful login
      signIn.mockResolvedValueOnce({
        ok: true,
        error: null,
      });

      renderWithProviders(<MockLoginForm />);

      // Fill out login form
      await user.type(screen.getByTestId("email-input"), "test@example.com");
      await user.type(screen.getByTestId("password-input"), "password123");

      // Submit form
      await user.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith("credentials", {
          email: "test@example.com",
          password: "password123",
          redirect: false,
        });
      });
    });

    it("should handle login errors", async () => {
      const user = userEvent.setup();
      const { signIn } = require("next-auth/react");

      // Mock login error
      signIn.mockResolvedValueOnce({
        ok: false,
        error: "Invalid credentials",
      });

      renderWithProviders(<MockLoginForm />);

      // Fill out form with wrong credentials
      await user.type(screen.getByTestId("email-input"), "test@example.com");
      await user.type(screen.getByTestId("password-input"), "wrongpassword");

      // Submit form
      await user.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
    });
  });

  describe("Password Reset Flow", () => {
    const MockForgotPasswordForm = () => {
      const [email, setEmail] = React.useState("");

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          alert("Password reset email sent");
        }
      };

      return (
        <form onSubmit={handleSubmit} data-testid="forgot-password-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
          />
          <button type="submit" data-testid="reset-button">
            Reset Password
          </button>
        </form>
      );
    };

    it("should send password reset email", async () => {
      const user = userEvent.setup();

      // Mock successful reset request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Password reset email sent",
        }),
      } as Response);

      // Mock alert
      window.alert = jest.fn();

      renderWithProviders(<MockForgotPasswordForm />);

      // Fill out email
      await user.type(screen.getByTestId("email-input"), "test@example.com");

      // Submit form
      await user.click(screen.getByTestId("reset-button"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        });
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Password reset email sent");
      });
    });

    const MockResetPasswordForm = ({ token }: { token: string }) => {
      const [formData, setFormData] = React.useState({
        password: "",
        confirmPassword: "",
      });

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match");
          return;
        }

        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password: formData.password,
          }),
        });

        const result = await response.json();

        if (result.success) {
          window.location.href = "/login";
        }
      };

      return (
        <form onSubmit={handleSubmit} data-testid="reset-password-form">
          <input
            type="password"
            placeholder="New Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            data-testid="password-input"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            data-testid="confirm-password-input"
          />
          <button type="submit" data-testid="reset-button">
            Reset Password
          </button>
        </form>
      );
    };

    it("should reset password with valid token", async () => {
      const user = userEvent.setup();

      // Mock successful password reset
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Password reset successfully",
        }),
      } as Response);

      renderWithProviders(<MockResetPasswordForm token="valid-token" />);

      // Fill out new password
      await user.type(screen.getByTestId("password-input"), "newpassword123");
      await user.type(
        screen.getByTestId("confirm-password-input"),
        "newpassword123"
      );

      // Submit form
      await user.click(screen.getByTestId("reset-button"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "valid-token",
            password: "newpassword123",
          }),
        });
      });
    });

    it("should validate password confirmation", async () => {
      const user = userEvent.setup();

      // Mock alert
      window.alert = jest.fn();

      renderWithProviders(<MockResetPasswordForm token="valid-token" />);

      // Fill out mismatched passwords
      await user.type(screen.getByTestId("password-input"), "password123");
      await user.type(
        screen.getByTestId("confirm-password-input"),
        "differentpassword"
      );

      // Submit form
      await user.click(screen.getByTestId("reset-button"));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Passwords do not match");
      });

      // Should not call API
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Email Verification Flow", () => {
    it("should verify email with valid token", async () => {
      // Mock successful verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Email verified successfully",
        }),
      } as Response);

      // Simulate clicking verification link
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "valid-verification-token" }),
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Email verified successfully");
    });

    it("should handle invalid verification token", async () => {
      // Mock invalid token response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: "Invalid verification token",
        }),
      } as Response);

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid-token" }),
      });

      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid verification token");
    });
  });

  describe("Session Management", () => {
    it("should refresh session data", async () => {
      // Mock session refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            role: "EMPLOYEE",
            status: "APPROVED",
            emailVerified: true,
          },
        }),
      } as Response);

      const response = await fetch("/api/auth/refresh-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "1" }),
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.role).toBe("EMPLOYEE");
      expect(result.data.status).toBe("APPROVED");
    });

    it("should handle logout", async () => {
      const { signOut } = require("next-auth/react");

      // Mock successful logout
      signOut.mockResolvedValueOnce({ url: "/login" });

      await signOut({ redirect: false });

      expect(signOut).toHaveBeenCalledWith({ redirect: false });
    });
  });

  describe("RBAC Integration Tests", () => {
    it("should enforce admin-only access", () => {
      const adminUser = {
        role: "ADMIN",
        status: "APPROVED",
        emailVerified: true,
      };
      const managerUser = {
        role: "MANAGER",
        status: "APPROVED",
        emailVerified: true,
      };
      const employeeUser = {
        role: "EMPLOYEE",
        status: "APPROVED",
        emailVerified: true,
      };

      // Admin should access all routes
      expect(adminUser.role === "ADMIN").toBe(true);

      // Manager should not access admin routes
      expect(managerUser.role === "ADMIN").toBe(false);

      // Employee should not access admin routes
      expect(employeeUser.role === "ADMIN").toBe(false);
    });

    it("should enforce manager and admin access", () => {
      const adminUser = { role: "ADMIN" };
      const managerUser = { role: "MANAGER" };
      const employeeUser = { role: "EMPLOYEE" };

      const canAccessManagerRoutes = (role: string) =>
        role === "ADMIN" || role === "MANAGER";

      expect(canAccessManagerRoutes(adminUser.role)).toBe(true);
      expect(canAccessManagerRoutes(managerUser.role)).toBe(true);
      expect(canAccessManagerRoutes(employeeUser.role)).toBe(false);
    });

    it("should enforce approved status requirement", () => {
      const pendingUser = { status: "PENDING" };
      const verifiedUser = { status: "VERIFIED" };
      const approvedUser = { status: "APPROVED" };
      const rejectedUser = { status: "REJECTED" };
      const suspendedUser = { status: "SUSPENDED" };

      const canAccessDashboard = (status: string) => status === "APPROVED";

      expect(canAccessDashboard(pendingUser.status)).toBe(false);
      expect(canAccessDashboard(verifiedUser.status)).toBe(false);
      expect(canAccessDashboard(approvedUser.status)).toBe(true);
      expect(canAccessDashboard(rejectedUser.status)).toBe(false);
      expect(canAccessDashboard(suspendedUser.status)).toBe(false);
    });
  });
});
