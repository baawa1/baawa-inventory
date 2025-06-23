import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

// Mock NextAuth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("LoginForm", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as any);
  });

  it("renders login form correctly", () => {
    render(<LoginForm />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sign In"
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows validation errors for invalid inputs", async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Password must be at least 6 characters")
      ).toBeInTheDocument();
    });
  });

  it("submits form with valid credentials", async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error message for invalid credentials", async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      error: "Invalid credentials",
    } as any);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("uses callback URL when provided", async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

    render(<LoginForm callbackUrl="/admin/dashboard" />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("shows loading state during submission", async () => {
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, error: null } as any), 100)
        )
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Signing in..." })
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});
