import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserManagement } from "@/components/admin/UserManagement";

// Mock next-auth
jest.mock("next-auth/react");
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock the UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: any) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: any) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => (
    <tbody data-testid="table-body">{children}</tbody>
  ),
  TableCell: ({ children }: any) => (
    <td data-testid="table-cell">{children}</td>
  ),
  TableHead: ({ children }: any) => (
    <th data-testid="table-head">{children}</th>
  ),
  TableHeader: ({ children }: any) => (
    <thead data-testid="table-header">{children}</thead>
  ),
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogDescription: ({ children }: any) => (
    <div data-testid="dialog-description">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h3 data-testid="dialog-title">{children}</h3>
  ),
  DialogTrigger: ({ children }: any) => (
    <div data-testid="dialog-trigger">{children}</div>
  ),
}));

jest.mock("@/components/ui/form", () => ({
  Form: ({ children }: any) => <form data-testid="form">{children}</form>,
  FormControl: ({ children }: any) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormField: ({ render }: any) =>
    render({ field: { value: "", onChange: jest.fn() } }),
  FormItem: ({ children }: any) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({ children }: any) => (
    <label data-testid="form-label">{children}</label>
  ),
  FormMessage: () => <div data-testid="form-message"></div>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <div data-testid="select-value">{placeholder}</div>
  ),
}));

// Mock react-hook-form
jest.mock("react-hook-form", () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: any) => (e: any) => {
      e.preventDefault();
      fn({});
    },
    reset: jest.fn(),
    clearErrors: jest.fn(),
    formState: { errors: {} },
    setValue: jest.fn(),
    watch: jest.fn(),
  }),
  Form: ({ children }: any) => <div data-testid="form">{children}</div>,
  FormField: ({ children }: any) => (
    <div data-testid="form-field">{children}</div>
  ),
  FormItem: ({ children }: any) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({ children }: any) => (
    <label data-testid="form-label">{children}</label>
  ),
  FormControl: ({ children }: any) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormMessage: ({ children }: any) => (
    <div data-testid="form-message">{children}</div>
  ),
}));

jest.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => ({}),
}));

describe("UserManagement Component", () => {
  beforeEach(() => {
    mockPush.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  it("redirects non-admin users to unauthorized page", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "user@test.com", role: "STAFF" },
      },
      status: "authenticated",
    } as any);

    render(<UserManagement />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/unauthorized");
    });
  });

  it("shows loading state initially", () => {
    mockUseSession.mockReturnValue({
      status: "loading",
    } as any);

    render(<UserManagement />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders user management interface for admin users", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "admin@test.com", role: "ADMIN" },
      },
      status: "authenticated",
    } as any);

    // Mock fetch to return empty users list
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText("Active Users")).toBeInTheDocument();
    });

    // Wait for the fetch to complete and the table to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("table")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Manage active user accounts, roles, and permissions")
    ).toBeInTheDocument();
    expect(screen.getByText("Add New User")).toBeInTheDocument();
  });

  it("fetches and displays users for admin", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "admin@test.com", role: "ADMIN" },
      },
      status: "authenticated",
    } as any);

    const mockUsers = [
      {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        role: "STAFF",
        isActive: true,
        createdAt: "2024-01-01T00:00:00.000Z",
        lastLogin: "2024-01-02T00:00:00.000Z",
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("john@test.com")).toBeInTheDocument();
    expect(screen.getByText("STAFF")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("handles fetch error gracefully", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "admin@test.com", role: "ADMIN" },
      },
      status: "authenticated",
    } as any);
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getAllByText("Network error")).toHaveLength(2);
    });
  });

  it("does not render anything for non-admin authenticated users after redirect", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "user@test.com", role: "STAFF" },
      },
      status: "authenticated",
    } as any);

    const { container } = render(<UserManagement />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/unauthorized");
    });

    // Component should return null for non-admin users
    expect(container.firstChild).toBeNull();
  });
});
