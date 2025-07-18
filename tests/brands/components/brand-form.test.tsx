import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrandForm } from "../../../src/components/inventory/brand-form";
import { BrandDialog } from "../../../src/components/inventory/brand-dialog";
import { BrandList } from "../../../src/components/inventory/brand-list";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API hooks
jest.mock("../../../src/hooks/api/use-brands", () => ({
  useBrands: jest.fn(),
  useCreateBrand: jest.fn(),
  useUpdateBrand: jest.fn(),
  useDeleteBrand: jest.fn(),
}));

const mockUseBrands = require("../../../src/hooks/api/use-brands").useBrands;
const mockUseCreateBrand =
  require("../../../src/hooks/api/use-brands").useCreateBrand;
const mockUseUpdateBrand =
  require("../../../src/hooks/api/use-brands").useUpdateBrand;
const mockUseDeleteBrand =
  require("../../../src/hooks/api/use-brands").useDeleteBrand;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("Brand Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("BrandForm", () => {
    const mockBrand = {
      id: "1",
      name: "Test Brand",
      description: "Test Description",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCreateMutation = {
      mutate: jest.fn(),
      isPending: false,
      error: null,
    };

    const mockUpdateMutation = {
      mutate: jest.fn(),
      isPending: false,
      error: null,
    };

    beforeEach(() => {
      mockUseCreateBrand.mockReturnValue(mockCreateMutation);
      mockUseUpdateBrand.mockReturnValue(mockUpdateMutation);
    });

    it("renders create form correctly", () => {
      renderWithQueryClient(<BrandForm />);

      expect(screen.getByLabelText(/brand name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create brand/i })
      ).toBeInTheDocument();
    });

    it("renders edit form correctly", () => {
      renderWithQueryClient(<BrandForm brand={mockBrand} />);

      expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /update brand/i })
      ).toBeInTheDocument();
    });

    it("submits create form with valid data", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<BrandForm />);

      await user.type(screen.getByLabelText(/brand name/i), "New Brand");
      await user.type(screen.getByLabelText(/description/i), "New Description");
      await user.click(screen.getByRole("button", { name: /create brand/i }));

      expect(mockCreateMutation.mutate).toHaveBeenCalledWith({
        name: "New Brand",
        description: "New Description",
        isActive: true,
      });
    });

    it("submits update form with valid data", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<BrandForm brand={mockBrand} />);

      await user.clear(screen.getByLabelText(/brand name/i));
      await user.type(screen.getByLabelText(/brand name/i), "Updated Brand");
      await user.click(screen.getByRole("button", { name: /update brand/i }));

      expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
        id: "1",
        name: "Updated Brand",
        description: "Test Description",
        isActive: true,
      });
    });

    it("shows validation errors for invalid data", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<BrandForm />);

      await user.click(screen.getByRole("button", { name: /create brand/i }));

      await waitFor(() => {
        expect(screen.getByText(/brand name is required/i)).toBeInTheDocument();
      });
    });

    it("shows loading state during submission", () => {
      mockCreateMutation.isPending = true;
      renderWithQueryClient(<BrandForm />);

      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    });

    it("shows error state", () => {
      mockCreateMutation.error = new Error("Creation failed");
      renderWithQueryClient(<BrandForm />);

      expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
    });
  });

  describe("BrandDialog", () => {
    const mockBrand = {
      id: "1",
      name: "Test Brand",
      description: "Test Description",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("renders create dialog correctly", () => {
      renderWithQueryClient(
        <BrandDialog open={true} onOpenChange={jest.fn()} />
      );

      expect(screen.getByText(/create new brand/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/brand name/i)).toBeInTheDocument();
    });

    it("renders edit dialog correctly", () => {
      renderWithQueryClient(
        <BrandDialog open={true} onOpenChange={jest.fn()} brand={mockBrand} />
      );

      expect(screen.getByText(/edit brand/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Brand")).toBeInTheDocument();
    });

    it("closes dialog on cancel", async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();

      renderWithQueryClient(
        <BrandDialog open={true} onOpenChange={onOpenChange} />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("BrandList", () => {
    const mockBrands = [
      {
        id: "1",
        name: "Brand 1",
        description: "Description 1",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Brand 2",
        description: "Description 2",
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockDeleteMutation = {
      mutate: jest.fn(),
      isPending: false,
      error: null,
    };

    beforeEach(() => {
      mockUseBrands.mockReturnValue({
        data: mockBrands,
        isLoading: false,
        error: null,
      });
      mockUseDeleteBrand.mockReturnValue(mockDeleteMutation);
    });

    it("renders brand list correctly", () => {
      renderWithQueryClient(<BrandList />);

      expect(screen.getByText("Brand 1")).toBeInTheDocument();
      expect(screen.getByText("Brand 2")).toBeInTheDocument();
      expect(screen.getByText("Description 1")).toBeInTheDocument();
    });

    it("shows loading state", () => {
      mockUseBrands.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithQueryClient(<BrandList />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("shows empty state", () => {
      mockUseBrands.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithQueryClient(<BrandList />);
      expect(screen.getByText(/no brands found/i)).toBeInTheDocument();
    });

    it("handles brand deletion", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<BrandList />);

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockDeleteMutation.mutate).toHaveBeenCalledWith("1");
    });

    it("shows error state", () => {
      mockUseBrands.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to load brands"),
      });

      renderWithQueryClient(<BrandList />);
      expect(screen.getByText(/failed to load brands/i)).toBeInTheDocument();
    });

    it("filters brands by search term", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<BrandList />);

      const searchInput = screen.getByPlaceholderText(/search brands/i);
      await user.type(searchInput, "Brand 1");

      expect(screen.getByText("Brand 1")).toBeInTheDocument();
      expect(screen.queryByText("Brand 2")).not.toBeInTheDocument();
    });

    it("toggles brand status", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<BrandList />);

      const toggleButtons = screen.getAllByRole("button", {
        name: /toggle status/i,
      });
      await user.click(toggleButtons[0]);

      expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
        id: "1",
        isActive: false,
      });
    });
  });
});
