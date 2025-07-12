import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(),
};

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it("renders loading state when validating token", () => {
    mockSearchParams.get.mockReturnValue("valid-token");

    render(<ResetPasswordForm />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Validating your reset token")).toBeInTheDocument();
  });

  it("shows invalid token message for missing token", async () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
      expect(
        screen.getByText(/This password reset link is invalid or has expired/)
      ).toBeInTheDocument();
    });
  });

  it("shows invalid token message for expired token", async () => {
    mockSearchParams.get.mockReturnValue("expired-token");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await act(async () => {
      render(<ResetPasswordForm />);
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
    });
  });

  it("renders password form for valid token", async () => {
    mockSearchParams.get.mockReturnValue("valid-token");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await act(async () => {
      render(<ResetPasswordForm />);
    });

    await waitFor(() => {
      expect(screen.getByText("Set New Password")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter new password")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Confirm new password")
      ).toBeInTheDocument();
    });
  });

  it("validates password requirements", async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue("valid-token");
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true }) // Token validation
      .mockResolvedValueOnce({ ok: true }); // Password reset

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText("Set New Password")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    const submitButton = screen.getByRole("button", { name: "Reset Password" });

    // Try weak password that doesn't meet requirements
    await user.type(passwordInput, "weak");
    await user.tab(); // Trigger blur event to validate

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 12 characters")
      ).toBeInTheDocument();
    });
  });

  it("validates password confirmation match", async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue("valid-token");
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText("Set New Password")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    const confirmInput = screen.getByPlaceholderText("Confirm new password");
    const submitButton = screen.getByRole("button", { name: "Reset Password" });

    await user.type(passwordInput, "StrongPass123");
    await user.type(confirmInput, "DifferentPass123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it("successfully resets password and redirects", async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue("valid-token");

    // Clear and setup fresh fetch mock
    jest.clearAllMocks();
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockFetch
      .mockResolvedValueOnce({ ok: true }) // Token validation
      .mockResolvedValueOnce({
        // Password reset
        ok: true,
        json: async () => ({ message: "Password reset successfully" }),
      });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText("Set New Password")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    const confirmInput = screen.getByPlaceholderText("Confirm new password");
    const submitButton = screen.getByRole("button", { name: "Reset Password" });

    await user.type(passwordInput, "StrongPass123!");
    await user.type(confirmInput, "StrongPass123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/login?message=password-reset-success"
      );
    });
  });

  it("shows error message on reset failure", async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue("valid-token");

    // Clear and setup fresh fetch mock
    jest.clearAllMocks();
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockFetch
      .mockResolvedValueOnce({ ok: true }) // Token validation
      .mockResolvedValueOnce({
        // Password reset failure
        ok: false,
        json: async () => ({ error: "Token expired" }),
      });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText("Set New Password")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    const confirmInput = screen.getByPlaceholderText("Confirm new password");
    const submitButton = screen.getByRole("button", { name: "Reset Password" });

    await user.type(passwordInput, "StrongPass123!");
    await user.type(confirmInput, "StrongPass123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Token expired")).toBeInTheDocument();
    });
  });
});
