import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { ProductList } from '@/components/inventory/ProductList';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock the API hooks
jest.mock('@/hooks/api/products', () => ({
  useProducts: jest.fn(),
}));

jest.mock('@/hooks/api/categories', () => ({
  useCategories: () => ({
    data: [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Clothing' },
    ],
    isLoading: false,
  }),
}));

jest.mock('@/hooks/api/brands', () => ({
  useBrands: () => ({
    data: [
      { id: 1, name: 'Samsung' },
      { id: 2, name: 'Apple' },
    ],
    isLoading: false,
  }),
}));

jest.mock('@/hooks/api/suppliers', () => ({
  useSuppliers: () => ({
    data: [
      { id: 1, name: 'Supplier A' },
      { id: 2, name: 'Supplier B' },
    ],
    isLoading: false,
  }),
}));

const mockUseProducts = require('@/hooks/api/products').useProducts;

describe('ProductList', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'ADMIN',
    status: 'APPROVED',
    isEmailVerified: true,
  };

  const mockProducts = [
    {
      id: 1,
      name: 'iPhone 14 Pro',
      sku: 'IPH14P-001',
      barcode: '1234567890123',
      cost: 800,
      price: 999,
      stock: 15,
      minStock: 10,
      maxStock: 50,
      unit: 'piece',
      status: 'active',
      isArchived: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      category: { id: 1, name: 'Electronics' },
      brand: { id: 2, name: 'Apple' },
      supplier: { id: 1, name: 'Supplier A', email: 'supplier@test.com' },
      images: [],
      stockStatus: 'normal',
      profitMargin: 199,
      profitMarginPercent: 24.875,
    },
    {
      id: 2,
      name: 'Samsung Galaxy S23',
      sku: 'SAMS23-001',
      barcode: '9876543210987',
      cost: 700,
      price: 899,
      stock: 5,
      minStock: 10,
      maxStock: 30,
      unit: 'piece',
      status: 'active',
      isArchived: false,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      category: { id: 1, name: 'Electronics' },
      brand: { id: 1, name: 'Samsung' },
      supplier: { id: 2, name: 'Supplier B', email: 'supplier2@test.com' },
      images: [],
      stockStatus: 'low',
      profitMargin: 199,
      profitMarginPercent: 28.429,
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render product list with data', () => {
    renderWithQueryClient(<ProductList user={mockUser} />);

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy S23')).toBeInTheDocument();
    expect(screen.getByText('IPH14P-001')).toBeInTheDocument();
    expect(screen.getByText('SAMS23-001')).toBeInTheDocument();
  });

  it('should display product information correctly', () => {
    renderWithQueryClient(<ProductList user={mockUser} />);

    // Check stock status badges
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();

    // Check prices
    expect(screen.getByText('₦999.00')).toBeInTheDocument();
    expect(screen.getByText('₦899.00')).toBeInTheDocument();

    // Check categories and brands
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Samsung')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseProducts.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseProducts.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      error: 'Failed to load products',
      refetch: jest.fn(),
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const searchInput = screen.getByPlaceholderText(/search products/i);
    await user.type(searchInput, 'iPhone');

    // Wait for debounced search
    await waitFor(
      () => {
        expect(mockRefetch).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it('should handle category filter', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const categorySelect = screen.getByLabelText(/category/i);
    await user.click(categorySelect);
    await user.click(screen.getByText('Electronics'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle brand filter', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const brandSelect = screen.getByLabelText(/brand/i);
    await user.click(brandSelect);
    await user.click(screen.getByText('Apple'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle low stock filter', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const lowStockCheckbox = screen.getByLabelText(/low stock only/i);
    await user.click(lowStockCheckbox);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle status filter', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const statusSelect = screen.getByLabelText(/status/i);
    await user.click(statusSelect);
    await user.click(screen.getByText('All'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle sorting', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.click(sortSelect);
    await user.click(screen.getByText('Price'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    const paginationWithPages = {
      ...mockPagination,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
    };

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: paginationWithPages,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle page size change', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const pageSizeSelect = screen.getByLabelText(/show/i);
    await user.click(pageSizeSelect);
    await user.click(screen.getByText('25'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle refresh', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();

    mockUseProducts.mockReturnValue({
      data: {
        data: mockProducts,
        pagination: mockPagination,
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should show empty state when no products', () => {
    mockUseProducts.mockReturnValue({
      data: {
        data: [],
        pagination: { ...mockPagination, total: 0 },
        filters: {
          search: '',
          categoryId: null,
          brandId: null,
          supplierId: null,
          lowStock: false,
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithQueryClient(<ProductList user={mockUser} />);

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it('should show add product button', () => {
    renderWithQueryClient(<ProductList user={mockUser} />);

    const addButton = screen.getByRole('button', { name: /add product/i });
    expect(addButton).toBeInTheDocument();
  });

  it('should display profit margin information', () => {
    renderWithQueryClient(<ProductList user={mockUser} />);

    // Check profit margin display
    expect(screen.getByText('₦199.00')).toBeInTheDocument(); // Profit amount
    expect(screen.getByText('24.9%')).toBeInTheDocument(); // Profit percentage
  });

  it('should handle bulk actions', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProductList user={mockUser} />);

    // Select products
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Select first product
    await user.click(checkboxes[2]); // Select second product

    // Check if bulk actions are available
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });
});
