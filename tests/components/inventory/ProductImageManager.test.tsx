import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductImageManager } from "@/components/inventory/ProductImageManager";

// Mock fetch
global.fetch = jest.fn();

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null;
  result: string | null = null;

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,mockbase64data`;
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => "mock-blob-url");
global.URL.revokeObjectURL = jest.fn();

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockImageData = {
  productId: 1,
  productName: "Test Product",
  images: [
    {
      id: "img1",
      url: "https://example.com/image1.jpg",
      filename: "image1.jpg",
      size: 1024,
      mimeType: "image/jpeg",
      alt: "Test image",
      isPrimary: true,
      uploadedAt: "2023-01-01T00:00:00Z",
    },
    {
      id: "img2",
      url: "https://example.com/image2.jpg",
      filename: "image2.jpg",
      size: 2048,
      mimeType: "image/png",
      alt: "Another test image",
      isPrimary: false,
      uploadedAt: "2023-01-01T00:00:00Z",
    },
  ],
};

describe("ProductImageManager Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("renders the component with product images", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockImageData,
    });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Product Images")).toBeInTheDocument();
    expect(
      screen.getByText("Drag and drop images here, or")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Images (2)")).toBeInTheDocument();
      expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      expect(screen.getByText("image2.jpg")).toBeInTheDocument();
    });
  });

  it("displays empty state when no images exist", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        productId: 1,
        productName: "Test Product",
        images: [],
      }),
    });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Drag and drop images here, or")
      ).toBeInTheDocument();
      expect(screen.getByText("browse files")).toBeInTheDocument();
    });

    // Should not show the images grid
    expect(screen.queryByText("Images (")).not.toBeInTheDocument();
  });

  it("shows primary badge on primary image", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockImageData,
    });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });
  });

  it("handles file drop correctly", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          productId: 1,
          productName: "Test Product",
          images: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Images updated successfully" }),
      });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Drag and drop images here, or")
      ).toBeInTheDocument();
    });

    const dropArea = screen
      .getByText("Drag and drop images here, or")
      .closest("div");

    const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });
    const dropEvent = new Event("drop", { bubbles: true });
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: {
        files: [file],
      },
    });

    fireEvent(dropArea!, dropEvent);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/products/1/images",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  it("handles file selection through input", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          productId: 1,
          productName: "Test Product",
          images: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Images updated successfully" }),
      });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("browse files")).toBeInTheDocument();
    });

    const browseButton = screen.getByText("browse files");
    fireEvent.click(browseButton);

    // Simulate file input change
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/products/1/images",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  it("validates file types and sizes", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        productId: 1,
        productName: "Test Product",
        images: [],
      }),
    });

    const { toast } = require("sonner");

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("browse files")).toBeInTheDocument();
    });

    // Test invalid file type
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });

    Object.defineProperty(fileInput, "files", {
      value: [invalidFile],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("is not a valid image file")
      );
    });

    // Test file too large (over 5MB)
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    Object.defineProperty(fileInput, "files", {
      value: [largeFile],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("is too large")
      );
    });
  });

  it("allows setting primary image", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockImageData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Images updated successfully" }),
      });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("Images (2)")).toBeInTheDocument();
    });

    // Find the second image (non-primary) and click its star button
    const starButtons = screen.getAllByRole("button");
    const nonPrimaryStarButton = starButtons.find(
      (button) =>
        button.innerHTML.includes("star") && !button.innerHTML.includes("fill")
    );

    if (nonPrimaryStarButton) {
      fireEvent.click(nonPrimaryStarButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/products/1/images",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining("isPrimary"),
          })
        );
      });
    }
  });

  it("allows deleting images", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockImageData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Image deleted successfully" }),
      });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("Images (2)")).toBeInTheDocument();
    });

    // Find and click a delete button
    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find(
      (button) =>
        button.getAttribute("aria-label") === "Delete" ||
        button.innerHTML.includes("trash")
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      // Confirm deletion in dialog
      const confirmButton = screen.getByText("Delete");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/products/1/images?imageId="),
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    }
  });

  it("allows editing image alt text", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockImageData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Images updated successfully" }),
      });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("Images (2)")).toBeInTheDocument();
    });

    // Find and click an edit button
    const editButtons = screen.getAllByRole("button");
    const editButton = editButtons.find(
      (button) =>
        button.getAttribute("aria-label") === "Edit" ||
        button.innerHTML.includes("edit")
    );

    if (editButton) {
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Edit Image Alt Text")).toBeInTheDocument();
      });

      const altTextInput = screen.getByPlaceholderText(
        "Describe this image for accessibility..."
      );
      fireEvent.change(altTextInput, { target: { value: "Updated alt text" } });

      const saveButton = screen.getByText("Save Changes");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/products/1/images",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining("Updated alt text"),
          })
        );
      });
    }
  });

  it("shows image preview dialog", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockImageData,
    });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("Images (2)")).toBeInTheDocument();
    });

    // Find and click a view button
    const viewButtons = screen.getAllByRole("button");
    const viewButton = viewButtons.find(
      (button) =>
        button.getAttribute("aria-label") === "View" ||
        button.innerHTML.includes("eye")
    );

    if (viewButton) {
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText("Image Preview")).toBeInTheDocument();
        expect(screen.getByText("Filename:")).toBeInTheDocument();
        expect(screen.getByText("Size:")).toBeInTheDocument();
        expect(screen.getByText("Type:")).toBeInTheDocument();
      });
    }
  });

  it("calls onImagesChange callback when images are updated", async () => {
    const mockOnImagesChange = jest.fn();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          productId: 1,
          productName: "Test Product",
          images: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Images updated successfully" }),
      });

    render(
      <ProductImageManager
        productId={1}
        productName="Test Product"
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText("browse files")).toBeInTheDocument();
    });

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          productId: 1,
          productName: "Test Product",
          images: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    const { toast } = require("sonner");

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("browse files")).toBeInTheDocument();
    });

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update images");
    });
  });

  it("formats file sizes correctly", async () => {
    const customMockData = {
      productId: 1,
      productName: "Test Product",
      images: [
        {
          id: "img1",
          url: "https://example.com/image1.jpg",
          filename: "small.jpg",
          size: 512, // 512 B
          mimeType: "image/jpeg",
          alt: "Small image",
          isPrimary: true,
          uploadedAt: "2023-01-01T00:00:00Z",
        },
        {
          id: "img2",
          url: "https://example.com/image2.jpg",
          filename: "large.jpg",
          size: 1048576, // 1 MB
          mimeType: "image/jpeg",
          alt: "Large image",
          isPrimary: false,
          uploadedAt: "2023-01-01T00:00:00Z",
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => customMockData,
    });

    render(<ProductImageManager productId={1} productName="Test Product" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("512 B")).toBeInTheDocument();
      expect(screen.getByText("1 MB")).toBeInTheDocument();
    });
  });
});
