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

  describe("Token Validation States", () => {
    it("renders loading state when validating token", () => {
      mockSearchParams.get.mockReturnValue("valid-token");

      render(<ResetPasswordForm />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(
        screen.getByText("Validating your reset token")
      ).toBeInTheDocument();
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
        expect(screen.getByTestId("token-error")).toBeInTheDocument();
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
          screen.getByText("Enter your new password below")
        ).toBeInTheDocument();
        expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
        expect(screen.getByTestId("password-input")).toBeInTheDocument();
        expect(
          screen.getByTestId("confirm-password-input")
        ).toBeInTheDocument();
        expect(screen.getByTestId("reset-button")).toBeInTheDocument();
      });
    });

    it("handles network error during token validation", async () => {
      mockSearchParams.get.mockReturnValue("valid-token");
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await act(async () => {
        render(<ResetPasswordForm />);
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
      });
    });
  });

  describe("Password Validation", () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await act(async () => {
        render(<ResetPasswordForm />);
      });

      await waitFor(() => {
        expect(screen.getByText("Set New Password")).toBeInTheDocument();
      });
    });

    it("validates minimum password length", async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");

      await user.type(passwordInput, "short");
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 12 characters")
        ).toBeInTheDocument();
      });
    });

    it("validates maximum password length", async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");
      const longPassword = "a".repeat(129);

      await user.type(passwordInput, longPassword);
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(
          screen.getByText("Password must be less than 128 characters")
        ).toBeInTheDocument();
      });
    });

    it("validates password complexity requirements", async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");

      // Test password without special character
      await user.type(passwordInput, "StrongPass123");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(
            /Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character/
          )
        ).toBeInTheDocument();
      });
    });

    it("validates password confirmation match", async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");
      const submitButton = screen.getByTestId("reset-button");

      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "DifferentPass123!");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
    });

    it("accepts valid password format", async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");

      await user.type(passwordInput, "StrongPass123!");
      await user.tab();

      // Should not show validation error for valid password
      await waitFor(() => {
        expect(
          screen.queryByText(/Password must contain/)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await act(async () => {
        render(<ResetPasswordForm />);
      });

      await waitFor(() => {
        expect(screen.getByText("Set New Password")).toBeInTheDocument();
      });
    });

    it("successfully resets password and redirects", async () => {
      const user = userEvent.setup();

      // Setup fetch mock for password reset with delay
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    message: "Password reset successfully",
                  }),
                }),
              100
            )
          )
      );

      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");
      const submitButton = screen.getByTestId("reset-button");

      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText("Resetting...")).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Check redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/login?message=password-reset-success"
        );
      });
    });

    it("shows error message on reset failure", async () => {
      const user = userEvent.setup();

      // Setup fetch mock for password reset failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Token expired" }),
      });

      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");
      const submitButton = screen.getByTestId("reset-button");

      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Token expired")).toBeInTheDocument();
        expect(
          screen.getByTestId("password-mismatch-error")
        ).toBeInTheDocument();
      });
    });

    it("handles network error during password reset", async () => {
      const user = userEvent.setup();

      // Setup fetch mock for network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");
      const submitButton = screen.getByTestId("reset-button");

      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("prevents submission with invalid password", async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");
      const submitButton = screen.getByTestId("reset-button");

      // Clear the fetch mock to track calls
      jest.clearAllMocks();
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await user.type(passwordInput, "weak");
      await user.type(confirmInput, "weak");
      await user.click(submitButton);

      // Should not make API call with invalid password
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("prevents submission with mismatched passwords", async () => {
      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");
      const submitButton = screen.getByTestId("reset-button");

      // Clear the fetch mock to track calls
      jest.clearAllMocks();
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "DifferentPass123!");
      await user.click(submitButton);

      // Should not make API call with mismatched passwords
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("UI Interactions", () => {
    it("disables form inputs during submission", async () => {
      mockSearchParams.get.mockReturnValue("valid-token");
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Token validation
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ ok: true }), 100)
            )
        ); // Slow response

      await act(async () => {
        render(<ResetPasswordForm />);
      });

      await waitFor(() => {
        expect(screen.getByText("Set New Password")).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");
      const submitButton = screen.getByTestId("reset-button");

      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).toBeDisabled();
        expect(confirmInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    it("navigates to forgot password page from invalid token state", async () => {
      mockSearchParams.get.mockReturnValue(null);

      render(<ResetPasswordForm />);

      await waitFor(() => {
        expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
      });

      const requestNewLinkButton = screen.getByText("Request New Reset Link");
      await userEvent.click(requestNewLinkButton);

      expect(mockPush).toHaveBeenCalledWith("/forgot-password");
    });
  });

  describe("Accessibility", () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await act(async () => {
        render(<ResetPasswordForm />);
      });

      await waitFor(() => {
        expect(screen.getByText("Set New Password")).toBeInTheDocument();
      });
    });

    it("has proper form labels and associations", () => {
      const passwordInput = screen.getByTestId("password-input");
      const confirmInput = screen.getByTestId("confirm-password-input");

      expect(screen.getByText("New Password")).toBeInTheDocument();
      expect(screen.getByText("Confirm Password")).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(confirmInput).toHaveAttribute("type", "password");
    });

    it("has proper button states and text", () => {
      const submitButton = screen.getByTestId("reset-button");

      expect(submitButton).toHaveTextContent("Reset Password");
      expect(submitButton).not.toBeDisabled();
    });
  });
});
