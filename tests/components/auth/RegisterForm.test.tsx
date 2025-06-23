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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Create Account"
    );
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
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
        screen.getByText("Name must be at least 2 characters")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Password must be at least 6 characters")
      ).toBeInTheDocument();
    });
  });

  it("shows error when passwords do not match", async () => {
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
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
        name: "John Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          role: "STAFF",
        }),
      });
    });
  });

  it("shows success message after successful registration", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Account Created!")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your account has been created successfully. You can now sign in."
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

    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
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
        name: "John Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm defaultRole="MANAGER" />);

    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          role: "MANAGER",
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
        name: "John Doe",
        email: "john@example.com",
      }),
    } as Response);

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Account" });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
