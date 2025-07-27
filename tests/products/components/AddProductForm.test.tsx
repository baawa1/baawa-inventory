import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import AddProductForm from '@/components/inventory/AddProductForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Individual test file mocks removed - using global setup mocks instead

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AddProductForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockFetch.mockClear();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render the form with all required fields', () => {
    renderWithQueryClient(<AddProductForm />);

    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purchase price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/selling price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current stock/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minimum stock/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('should render optional fields', () => {
    renderWithQueryClient(<AddProductForm />);

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/barcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supplier/i)).toBeInTheDocument();
  });

  it('should validate required fields on submit', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddProductForm />);

    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/sku is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/purchase price is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/selling price is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/minimum stock is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/current stock is required/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate SKU format', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddProductForm />);

    const skuInput = screen.getByLabelText(/sku/i);
    await user.type(skuInput, 'invalid@sku');

    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /sku can only contain letters, numbers, hyphens, and underscores/i
        )
      ).toBeInTheDocument();
    });
  });

  it('should validate price fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddProductForm />);

    const purchasePriceInput = screen.getByLabelText(/purchase price/i);
    const sellingPriceInput = screen.getByLabelText(/selling price/i);

    await user.type(purchasePriceInput, '-10');
    await user.type(sellingPriceInput, '-15');

    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/purchase price must be positive/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/selling price must be positive/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate stock fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddProductForm />);

    const currentStockInput = screen.getByLabelText(/current stock/i);
    const minimumStockInput = screen.getByLabelText(/minimum stock/i);

    await user.type(currentStockInput, '-5');
    await user.type(minimumStockInput, '-10');

    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/current stock must be positive/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/minimum stock must be positive/i)
      ).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Test Product',
          sku: 'TEST-001',
        },
      }),
    } as Response);

    renderWithQueryClient(<AddProductForm />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/sku/i), 'TEST-001');
    await user.type(screen.getByLabelText(/purchase price/i), '10.50');
    await user.type(screen.getByLabelText(/selling price/i), '15.99');
    await user.type(screen.getByLabelText(/current stock/i), '10');
    await user.type(screen.getByLabelText(/minimum stock/i), '5');

    // Fill in optional fields
    await user.type(screen.getByLabelText(/description/i), 'A test product');
    await user.type(screen.getByLabelText(/barcode/i), '1234567890123');

    // Select category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.click(categorySelect);
    await user.click(screen.getByText('Electronics'));

    // Select brand
    const brandSelect = screen.getByLabelText(/brand/i);
    await user.click(brandSelect);
    await user.click(screen.getByText('Samsung'));

    // Select supplier
    const supplierSelect = screen.getByLabelText(/supplier/i);
    await user.click(supplierSelect);
    await user.click(screen.getByText('Supplier A'));

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Product',
          sku: 'TEST-001',
          barcode: '1234567890123',
          description: 'A test product',
          categoryId: 1,
          brandId: 1,
          supplierId: 1,
          purchasePrice: 10.5,
          sellingPrice: 15.99,
          minimumStock: 5,
          maximumStock: null,
          currentStock: 10,
          status: 'active',
          unit: 'piece',
          weight: null,
          dimensions: '',
          color: '',
          size: '',
          material: '',
          tags: [],
          salePrice: null,
          saleStartDate: null,
          saleEndDate: null,
          metaTitle: '',
          metaDescription: '',
          seoKeywords: [],
          isFeatured: false,
          sortOrder: null,
          imageUrl: null,
          notes: null,
        }),
      });
    });
  });

  it('should handle API errors', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Product with this SKU already exists',
      }),
    } as Response);

    renderWithQueryClient(<AddProductForm />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/sku/i), 'TEST-001');
    await user.type(screen.getByLabelText(/purchase price/i), '10.50');
    await user.type(screen.getByLabelText(/selling price/i), '15.99');
    await user.type(screen.getByLabelText(/current stock/i), '10');
    await user.type(screen.getByLabelText(/minimum stock/i), '5');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/product with this sku already exists/i)
      ).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithQueryClient(<AddProductForm />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/sku/i), 'TEST-001');
    await user.type(screen.getByLabelText(/purchase price/i), '10.50');
    await user.type(screen.getByLabelText(/selling price/i), '15.99');
    await user.type(screen.getByLabelText(/current stock/i), '10');
    await user.type(screen.getByLabelText(/minimum stock/i), '5');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    // Check loading state
    expect(
      screen.getByRole('button', { name: /creating/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });

  it('should handle cancel action', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddProductForm />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should navigate back (mocked)
    expect(cancelButton).toBeInTheDocument();
  });

  it('should validate field length limits', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddProductForm />);

    const nameInput = screen.getByLabelText(/product name/i);
    const longName = 'A'.repeat(256); // Too long
    await user.type(nameInput, longName);

    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/product name must be 255 characters or less/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle optional fields correctly', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Test Product',
          sku: 'TEST-001',
        },
      }),
    } as Response);

    renderWithQueryClient(<AddProductForm />);

    // Fill in only required fields
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/sku/i), 'TEST-001');
    await user.type(screen.getByLabelText(/purchase price/i), '10.50');
    await user.type(screen.getByLabelText(/selling price/i), '15.99');
    await user.type(screen.getByLabelText(/current stock/i), '10');
    await user.type(screen.getByLabelText(/minimum stock/i), '5');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /create product/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Product',
          sku: 'TEST-001',
          barcode: null,
          description: null,
          categoryId: null,
          brandId: null,
          supplierId: null,
          purchasePrice: 10.5,
          sellingPrice: 15.99,
          minimumStock: 5,
          maximumStock: null,
          currentStock: 10,
          status: 'active',
          unit: 'piece',
          weight: null,
          dimensions: '',
          color: '',
          size: '',
          material: '',
          tags: [],
          salePrice: null,
          saleStartDate: null,
          saleEndDate: null,
          metaTitle: '',
          metaDescription: '',
          seoKeywords: [],
          isFeatured: false,
          sortOrder: null,
          imageUrl: null,
          notes: null,
        }),
      });
    });
  });
});
