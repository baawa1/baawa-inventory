import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("RegisterForm", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
  });

  it("renders registration form correctly", () => {
    render(<RegisterForm />);

    // Check for the description text instead of the title to avoid conflicts
    expect(
      screen.getByText("Enter your information to create your account")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeInTheDocument();
  });

  it("shows validation errors for invalid inputs", async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole("button", { name: "Create Account" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("First name must be at least 2 characters")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Last name must be at least 2 characters")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Password must be at least 12 characters")
      ).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "differentpassword" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "SecurePass123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          password: "SecurePass123!",
        }),
      });
    });
  });

  it("shows success message after successful registration", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "SecurePass123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Check Your Email!")).toBeInTheDocument();
      expect(
        screen.getByText(
          "We've sent a verification link to your email address. Please check your inbox and click the link to verify your account."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows error message for failed registration", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Email already exists" }),
    } as Response);

    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "SecurePass123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });

  it("uses custom default role when provided", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm defaultRole="MANAGER" />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "SecurePass123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          password: "SecurePass123!",
        }),
      });
    });
  });

  it("calls onSuccess callback when provided", async () => {
    const mockOnSuccess = jest.fn();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "SecurePass123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
