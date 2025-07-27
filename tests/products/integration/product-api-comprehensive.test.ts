import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { auth } from '../../../../auth';
import { prisma } from '@/lib/db';

// Mock dependencies
jest.mock('@/auth');
jest.mock('@/lib/db');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock user sessions
const mockAdminUser = {
  user: {
    id: '1',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'APPROVED',
  },
};

const mockManagerUser = {
  user: {
    id: '2',
    email: 'manager@example.com',
    role: 'MANAGER',
    status: 'APPROVED',
  },
};

const mockStaffUser = {
  user: {
    id: '3',
    email: 'staff@example.com',
    role: 'STAFF',
    status: 'APPROVED',
  },
};

const mockPendingUser = {
  user: {
    id: '4',
    email: 'pending@example.com',
    role: 'STAFF',
    status: 'PENDING',
  },
};

// Mock product data
const mockProduct = {
  id: 1,
  name: 'Test Product',
  description: 'Test Description',
  sku: 'TEST-001',
  barcode: '1234567890123',
  cost: 10.5,
  price: 15.99,
  stock: 100,
  minStock: 10,
  maxStock: 200,
  unit: 'piece',
  status: 'ACTIVE',
  isArchived: false,
  categoryId: 1,
  brandId: 1,
  supplierId: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  category: { id: 1, name: 'Test Category' },
  brand: { id: 1, name: 'Test Brand' },
  supplier: { id: 1, name: 'Test Supplier', email: 'supplier@test.com' },
  images: [],
};

describe('Product API Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.product = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    } as any;
    mockPrisma.category = {
      findUnique: jest.fn(),
    } as any;
    mockPrisma.brand = {
      findUnique: jest.fn(),
    } as any;
    mockPrisma.supplier = {
      findUnique: jest.fn(),
    } as any;
    mockPrisma.auditLog = {
      create: jest.fn(),
    } as any;
    mockPrisma.$queryRaw = jest.fn();
    mockPrisma.$transaction = jest.fn();
  });

  describe('GET /api/products', () => {
    it('should return products list with pagination for authenticated user', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/products?page=1&limit=10'
      );

      // Import the handler dynamically to avoid module loading issues
      const { GET } = await import('../../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(1);
    });

    it('should handle search parameters', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/products?search=test&categoryId=1&brandId=1'
      );

      const { GET } = await import('../../../../src/app/api/products/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'test', mode: 'insensitive' } },
              { sku: { contains: 'test', mode: 'insensitive' } },
              { barcode: { contains: 'test', mode: 'insensitive' } },
            ]),
            categoryId: 1,
            brandId: 1,
          }),
        })
      );
    });

    it('should handle low stock filter', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 1 }]);
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/products?lowStock=true'
      );

      const { GET } = await import('../../../../src/app/api/products/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT id FROM products WHERE stock <= min_stock'
        )
      );
    });

    it('should handle sorting parameters', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/products?sortBy=price&sortOrder=desc'
      );

      const { GET } = await import('../../../../src/app/api/products/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'desc' },
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/products');

      const { GET } = await import('../../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 403 for pending user', async () => {
      mockAuth.mockResolvedValue(mockPendingUser);

      const request = new NextRequest('http://localhost:3000/api/products');

      const { GET } = await import('../../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account not approved');
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/products');

      const { GET } = await import('../../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch products');
    });
  });

  describe('POST /api/products', () => {
    const validProductData = {
      name: 'New Product',
      description: 'New Description',
      sku: 'NEW-001',
      barcode: '1234567890124',
      purchasePrice: 10.5,
      sellingPrice: 15.99,
      currentStock: 100,
      minimumStock: 10,
      maximumStock: 200,
      unit: 'piece',
      status: 'ACTIVE',
      categoryId: 1,
      brandId: 1,
      supplierId: 1,
    };

    it('should create product successfully for admin user', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 1,
        name: 'Category',
      });
      mockPrisma.brand.findUnique.mockResolvedValue({ id: 1, name: 'Brand' });
      mockPrisma.supplier.findUnique.mockResolvedValue({
        id: 1,
        name: 'Supplier',
      });
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProductData),
      });

      const { POST } = await import('../../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toEqual(mockProduct);
    });

    it('should create product successfully for manager user', async () => {
      mockAuth.mockResolvedValue(mockManagerUser);
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 1,
        name: 'Category',
      });
      mockPrisma.brand.findUnique.mockResolvedValue({ id: 1, name: 'Brand' });
      mockPrisma.supplier.findUnique.mockResolvedValue({
        id: 1,
        name: 'Supplier',
      });
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProductData),
      });

      const { POST } = await import('../../../../src/app/api/products/route');
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should return 403 for staff user', async () => {
      mockAuth.mockResolvedValue(mockStaffUser);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProductData),
      });

      const { POST } = await import('../../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should return 400 for duplicate SKU', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProductData),
      });

      const { POST } = await import('../../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Product with this SKU already exists');
    });

    it('should return 400 for duplicate barcode', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValueOnce(null);
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProductData),
      });

      const { POST } = await import('../../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Product with this barcode already exists');
    });

    it('should return 404 for non-existent category', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProductData),
      });

      const { POST } = await import('../../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Category not found');
    });

    it('should handle validation errors', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);

      const invalidData = { name: '', sku: 'INVALID' };

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('../../../../src/app/api/products/route');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/products/[id]', () => {
    it('should return single product for authenticated user', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const request = new NextRequest('http://localhost:3000/api/products/1');

      const { GET } = await import(
        '../../../../src/app/api/products/[id]/route'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockProduct);
    });

    it('should return 404 for non-existent product', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/products/999');

      const { GET } = await import(
        '../../../../src/app/api/products/[id]/route'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: '999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Product not found');
    });

    it('should return 400 for invalid product ID', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);

      const request = new NextRequest(
        'http://localhost:3000/api/products/invalid'
      );

      const { GET } = await import(
        '../../../../src/app/api/products/[id]/route'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: 'invalid' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid product ID');
    });
  });

  describe('PUT /api/products/[id]', () => {
    const updateData = {
      name: 'Updated Product',
      sellingPrice: 19.99,
    };

    it('should update product successfully for admin user', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateData,
      });

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import(
        '../../../../src/app/api/products/[id]/route'
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Updated Product');
    });

    it('should return 403 for staff user', async () => {
      mockAuth.mockResolvedValue(mockStaffUser);

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import(
        '../../../../src/app/api/products/[id]/route'
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should return 400 for duplicate SKU', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 2,
        sku: 'DUPLICATE-001',
      });

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: 'DUPLICATE-001' }),
      });

      const { PUT } = await import(
        '../../../../src/app/api/products/[id]/route'
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Product with this SKU already exists');
    });
  });

  describe('GET /api/products/low-stock', () => {
    it('should return low stock products', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/products/low-stock'
      );

      const { GET } = await import(
        '../../../../src/app/api/products/low-stock/route'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toBeDefined();
      expect(data.metrics).toBeDefined();
    });

    it('should handle search parameters', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      const request = new NextRequest(
        'http://localhost:3000/api/products/low-stock?search=test'
      );

      const { GET } = await import(
        '../../../../src/app/api/products/low-stock/route'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/products/archived', () => {
    it('should return archived products', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([
        { ...mockProduct, isArchived: true },
      ]);
      mockPrisma.product.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/products/archived'
      );

      const { GET } = await import(
        '../../../../src/app/api/products/archived/route'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].isArchived).toBe(true);
    });

    it('should handle search and filter parameters', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/products/archived?search=test&category=1&brand=1'
      );

      const { GET } = await import(
        '../../../../src/app/api/products/archived/route'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/products/archive', () => {
    it('should bulk archive products for admin user', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 1, name: 'Product 1', isArchived: false },
        { id: 2, name: 'Product 2', isArchived: false },
      ]);
      mockPrisma.product.updateMany.mockResolvedValue({ count: 2 });

      const request = new NextRequest(
        'http://localhost:3000/api/products/archive',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: [1, 2],
            action: 'archive',
          }),
        }
      );

      const { POST } = await import(
        '../../../../src/app/api/products/archive/route'
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('archived');
    });

    it('should return 403 for staff user', async () => {
      mockAuth.mockResolvedValue(mockStaffUser);

      const request = new NextRequest(
        'http://localhost:3000/api/products/archive',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: [1],
            action: 'archive',
          }),
        }
      );

      const { POST } = await import(
        '../../../../src/app/api/products/archive/route'
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should return 404 for non-existent products', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/products/archive',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: [999],
            action: 'archive',
          }),
        }
      );

      const { POST } = await import(
        '../../../../src/app/api/products/archive/route'
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Products not found');
    });
  });

  describe('PATCH /api/products/[id]/archive', () => {
    it('should archive single product', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        isArchived: true,
      });
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const request = new NextRequest(
        'http://localhost:3000/api/products/1/archive',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            archived: true,
            reason: 'Test archive',
          }),
        }
      );

      const { PATCH } = await import(
        '../../../../src/app/api/products/[id]/archive/route'
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('archived');
    });

    it('should return 400 if product already archived', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        isArchived: true,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/products/1/archive',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            archived: true,
            reason: 'Test archive',
          }),
        }
      );

      const { PATCH } = await import(
        '../../../../src/app/api/products/[id]/archive/route'
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already archived');
    });
  });

  describe('POST /api/products/barcodes', () => {
    it('should generate barcodes for products', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 1, name: 'Product 1', barcode: null },
        { id: 2, name: 'Product 2', barcode: 'EXISTING-123' },
      ]);
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.update.mockResolvedValue({} as any);
      mockPrisma.$transaction.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/products/barcodes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate',
            productIds: [1, 2],
            format: 'EAN13',
            prefix: 'TEST',
          }),
        }
      );

      const { POST } = await import(
        '../../../../src/app/api/products/barcodes/route'
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Processed');
    });

    it('should validate barcode', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const request = new NextRequest(
        'http://localhost:3000/api/products/barcodes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'validate',
            barcode: '1234567890123',
          }),
        }
      );

      const { POST } = await import(
        '../../../../src/app/api/products/barcodes/route'
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exists).toBe(true);
    });
  });

  describe('GET /api/products/barcodes', () => {
    it('should return barcode statistics', async () => {
      mockAuth.mockResolvedValue(mockAdminUser);
      mockPrisma.product.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/products/barcodes'
      );

      const { GET } = await import(
        '../../../../src/app/api/products/barcodes/route'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.statistics.totalProducts).toBe(100);
      expect(data.statistics.withBarcodes).toBe(80);
      expect(data.statistics.coveragePercentage).toBe(80);
    });
  });
});
