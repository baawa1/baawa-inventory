import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/pos/POSErrorBoundary', () => ({
  usePOSErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

global.fetch = jest.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
  },
  writable: true,
});

Element.prototype.scrollIntoView = jest.fn();

const catalog = [
  {
    id: 1,
    name: 'Test Product 1',
    sku: 'SKU001',
    barcode: '1234567890128',
    price: 1000,
    stock: 10,
    category: 'Electronics',
    brand: 'Test Brand',
    description: 'Test description',
    images: [],
  },
  {
    id: 2,
    name: 'Test Product 2',
    sku: 'SKU002',
    barcode: '9876543210987',
    price: 2000,
    stock: 0,
    category: 'Electronics',
    brand: 'Test Brand',
    description: 'Test description 2',
    images: [],
  },
  {
    id: 3,
    name: 'Another Product',
    sku: 'SKU003',
    barcode: '5556667778885',
    price: 1500,
    stock: 5,
    category: 'Clothing',
    brand: 'Another Brand',
    description: 'Another description',
    images: [],
  },
];

const filtersPayload = {
  categories: ['Clothing', 'Electronics'],
  brands: ['Another Brand', 'Test Brand'],
};

const toPosProduct = (product: (typeof catalog)[number]) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  price: product.price,
  stock: product.stock,
  categoryName: product.category,
  brandName: product.brand,
  description: product.description,
  images: product.images,
  primaryImageUrl:
    Array.isArray(product.images) && typeof product.images[0] === 'object'
      ? (product.images[0] as { url?: string }).url || null
      : null,
  updatedAt: '2026-04-26T08:00:00.000Z',
});

const toBarcodeLookupProduct = (product: (typeof catalog)[number]) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  barcode: product.barcode,
  price: product.price,
  stock: product.stock,
  status: 'ACTIVE',
  category: product.category,
  brand: product.brand,
  description: product.description,
  images: product.images,
  primaryImageUrl: null,
  updatedAt: '2026-04-26T08:00:00.000Z',
});

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

const installFetchMock = (options?: {
  initialProducts?: typeof catalog;
  filters?: typeof filtersPayload;
}) => {
  const initialProducts = options?.initialProducts ?? catalog;
  const activeFilters = options?.filters ?? filtersPayload;

  (fetch as jest.Mock).mockImplementation((input: string | URL | Request) => {
    const urlString =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const url = new URL(urlString, 'http://localhost');

    if (url.pathname === '/api/pos/products') {
      const includeFilters = url.searchParams.get('includeFilters') === 'true';

      return jsonResponse({
        success: true,
        data: initialProducts.map(toPosProduct),
        pagination: {
          page: 1,
          limit: Number(url.searchParams.get('limit') || '50'),
          total: initialProducts.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        ...(includeFilters ? { filters: activeFilters } : {}),
      });
    }

    if (url.pathname === '/api/pos/search-products') {
      const searchTerm = (url.searchParams.get('search') || '').toLowerCase();
      const searchResults = catalog.filter(product =>
        [product.name, product.sku, product.barcode]
          .some(value => value.toLowerCase().includes(searchTerm))
      );

      return jsonResponse({
        success: true,
        data: {
          products: searchResults.map(toPosProduct),
          total: searchResults.length,
          searchTerm,
        },
      });
    }

    if (url.pathname === '/api/pos/barcode-lookup') {
      const barcode = url.searchParams.get('barcode') || '';
      const product = catalog.find(item => item.barcode === barcode);

      if (!product) {
        return jsonResponse({ error: 'Product not found' }, 404);
      }

      return jsonResponse(toBarcodeLookupProduct(product));
    }

    return jsonResponse({ error: 'Unhandled request' }, 404);
  });
};

describe('ProductGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    installFetchMock();
  });

  it('renders the current search UI and initial product list', async () => {
    renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Another Product')).toBeInTheDocument();
    });

    expect(
      (fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes('/api/pos/products?limit=1&page=1&fields=pos&includeFilters=true')
      )
    ).toBe(true);
  });

  it('uses filter metadata instead of only the currently loaded product page', async () => {
    installFetchMock({
      initialProducts: [catalog[0], catalog[1]] as typeof catalog,
    });

    renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('combobox')[0]);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Clothing' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Electronics' })
      ).toBeInTheDocument();
    });
  });

  it('uses server-backed search after the debounce interval', async () => {
    jest.useFakeTimers();

    renderWithQueryClient(<ProductGrid onProductSelect={jest.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search products...');

    fireEvent.change(searchInput, { target: { value: 'Another' } });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(
        (fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes('/api/pos/search-products?') &&
          String(url).includes('search=Another')
        )
      ).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText('Another Product')).toBeInTheDocument();
      expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument();
    });
  });

  it('adds a product to the cart with the current payload shape', async () => {
    const onProductSelect = jest.fn();
    renderWithQueryClient(<ProductGrid onProductSelect={onProductSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Product 1'));

    expect(onProductSelect).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Product 1',
      sku: 'SKU001',
      barcode: undefined,
      price: 1000,
      basePrice: 1000,
      stock: 10,
      category: 'Electronics',
      brand: 'Test Brand',
    });
  });

  it('blocks out-of-stock products from being added', async () => {
    const onProductSelect = jest.fn();
    renderWithQueryClient(<ProductGrid onProductSelect={onProductSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Product 2'));

    expect(onProductSelect).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Product is out of stock');
  });

  it('looks up numeric Enter input through the barcode endpoint', async () => {
    const onProductSelect = jest.fn();
    renderWithQueryClient(<ProductGrid onProductSelect={onProductSelect} />);

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: '1234567890128' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(
        (fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes('/api/pos/barcode-lookup?barcode=1234567890128')
        )
      ).toBe(true);
    });

    expect(onProductSelect).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Product 1',
      sku: 'SKU001',
      barcode: '1234567890128',
      price: 1000,
      basePrice: 1000,
      stock: 10,
      category: 'Electronics',
      brand: 'Test Brand',
    });
  });
});
