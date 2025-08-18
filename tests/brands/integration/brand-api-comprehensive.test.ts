// Import integration setup FIRST to ensure proper mocking
import '../../integration-setup';
import { createPrismaMock } from '../../integration-setup';

// Create Prisma mock with brand-specific methods
createPrismaMock();

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { createBrandSchema, updateBrandSchema } from '@/lib/validations/brand';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Brand API - Comprehensive Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockAuth.mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'ADMIN',
        status: 'APPROVED',
      },
    } as any);

    // Mock Prisma methods
    mockPrisma.brand = {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    } as any;
  });

  describe('GET /api/brands', () => {
    it('should return brands with pagination', async () => {
      const mockBrands = [
        {
          id: 1,
          name: 'Test Brand 1',
          description: 'Description 1',
          image: 'https://example.com/1.jpg',
          website: 'https://brand1.com',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { products: 5 },
        },
        {
          id: 2,
          name: 'Test Brand 2',
          description: 'Description 2',
          image: 'https://example.com/2.jpg',
          website: 'https://brand2.com',
          isActive: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          _count: { products: 3 },
        },
      ];

      mockPrisma.brand.count.mockResolvedValue(2);
      mockPrisma.brand.findMany.mockResolvedValue(mockBrands);

      const request = new NextRequest('http://localhost:3000/api/brands');

      // Import the handler dynamically to avoid module loading issues
      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalPages: 1,
        total: 2,
      });
      expect(data.data[0]).toEqual({
        id: 1,
        name: 'Test Brand 1',
        description: 'Description 1',
        image: 'https://example.com/1.jpg',
        website: 'https://brand1.com',
        isActive: true,
        productCount: 5,
        createdAt: mockBrands[0].createdAt.toISOString(),
        updatedAt: mockBrands[0].updatedAt.toISOString(),
      });
    });

    it('should handle search parameter', async () => {
      const mockBrands = [
        {
          id: 1,
          name: 'Apple',
          description: 'Apple brand',
          image: 'https://example.com/apple.jpg',
          website: 'https://apple.com',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { products: 10 },
        },
      ];

      mockPrisma.brand.count.mockResolvedValue(1);
      mockPrisma.brand.findMany.mockResolvedValue(mockBrands);

      const request = new NextRequest(
        'http://localhost:3000/api/brands?search=apple'
      );

      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Apple');

      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'apple', mode: 'insensitive' } },
              { description: { contains: 'apple', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should handle isActive filter', async () => {
      mockPrisma.brand.count.mockResolvedValue(0);
      mockPrisma.brand.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/brands?isActive=false'
      );

      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });

    it('should handle sorting parameters', async () => {
      mockPrisma.brand.count.mockResolvedValue(0);
      mockPrisma.brand.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/brands?sortBy=createdAt&sortOrder=desc'
      );

      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockPrisma.brand.count.mockResolvedValue(50);
      mockPrisma.brand.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/brands?page=3&limit=15'
      );

      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toEqual({
        page: 3,
        limit: 15,
        totalPages: 4,
        total: 50,
      });
      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30, // (3-1) * 15
          take: 15,
        })
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brands');

      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 403 for non-approved users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'STAFF',
          status: 'PENDING',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/brands');

      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account not approved');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.brand.count.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/brands');

      const { GET } = await import('@/app/api/brands/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch brands');
    });
  });

  describe('POST /api/brands', () => {
    it('should create a new brand successfully', async () => {
      const brandData = {
        name: 'New Brand',
        description: 'A new brand',
        image: 'https://example.com/new-brand.jpg',
        website: 'https://newbrand.com',
        isActive: true,
      };

      const createdBrand = {
        id: 1,
        ...brandData,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.brand.findFirst.mockResolvedValue(null); // No existing brand
      mockPrisma.brand.create.mockResolvedValue(createdBrand);

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Brand created successfully');
      expect(data.data).toEqual({
        id: 1,
        name: 'New Brand',
        description: 'A new brand',
        image: 'https://example.com/new-brand.jpg',
        website: 'https://newbrand.com',
        isActive: true,
        productCount: 0,
        createdAt: createdBrand.createdAt.toISOString(),
        updatedAt: createdBrand.updatedAt.toISOString(),
      });
    });

    it('should reject duplicate brand names', async () => {
      const brandData = {
        name: 'Existing Brand',
        description: 'A brand that already exists',
        image: 'https://example.com/existing.jpg',
        isActive: true,
      };

      const existingBrand = {
        id: 1,
        name: 'Existing Brand',
        description: 'Already exists',
        image: 'https://example.com/existing.jpg',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.brand.findFirst.mockResolvedValue(existingBrand);

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Brand with this name already exists');
    });

    it('should reject invalid brand data', async () => {
      const invalidData = {
        name: '', // Empty name
        description: 'Valid description',
        image: 'https://example.com/image.jpg',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Brand name is required');
    });

    it('should reject invalid website URL', async () => {
      const invalidData = {
        name: 'Valid Brand',
        description: 'Valid description',
        image: 'https://example.com/image.jpg',
        website: 'not-a-valid-url',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Please enter a valid website URL');
    });

    it('should return 403 for insufficient permissions', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'STAFF', // Only ADMIN and MANAGER can create brands
          status: 'APPROVED',
        },
      } as any);

      const brandData = {
        name: 'New Brand',
        description: 'A new brand',
        image: 'https://example.com/new-brand.jpg',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should handle database errors during creation', async () => {
      mockPrisma.brand.findFirst.mockResolvedValue(null);
      mockPrisma.brand.create.mockRejectedValue(new Error('Database error'));

      const brandData = {
        name: 'New Brand',
        description: 'A new brand',
        image: 'https://example.com/new-brand.jpg',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create brand');
    });

    it('should handle case-insensitive name checking', async () => {
      const brandData = {
        name: 'Test Brand',
        description: 'A test brand',
        image: 'https://example.com/test.jpg',
        isActive: true,
      };

      const existingBrand = {
        id: 1,
        name: 'test brand', // Different case
        description: 'Already exists',
        image: 'https://example.com/existing.jpg',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.brand.findFirst.mockResolvedValue(existingBrand);

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Brand with this name already exists');

      expect(mockPrisma.brand.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'Test Brand',
            mode: 'insensitive',
          },
        },
      });
    });
  });

  describe('PUT /api/brands/[id]', () => {
    it('should update a brand successfully', async () => {
      const updateData = {
        name: 'Updated Brand',
        description: 'Updated description',
        image: 'https://example.com/updated.jpg',
        website: 'https://updated.com',
        isActive: false,
      };

      const existingBrand = {
        id: 1,
        name: 'Original Brand',
        description: 'Original description',
        image: 'https://example.com/original.jpg',
        website: 'https://original.com',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedBrand = {
        ...existingBrand,
        ...updateData,
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.brand.findUnique.mockResolvedValue(existingBrand);
      mockPrisma.brand.findFirst.mockResolvedValue(null); // No name conflict
      mockPrisma.brand.update.mockResolvedValue(updatedBrand);

      const request = new NextRequest('http://localhost:3000/api/brands/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('@/app/api/brands/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedBrand);
    });

    it('should return 404 for non-existent brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      const updateData = {
        name: 'Updated Brand',
        description: 'Updated description',
      };

      const request = new NextRequest('http://localhost:3000/api/brands/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('@/app/api/brands/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Brand not found');
    });

    it('should reject name conflicts with other brands', async () => {
      const existingBrand = {
        id: 1,
        name: 'Original Brand',
        description: 'Original description',
        image: 'https://example.com/original.jpg',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const conflictingBrand = {
        id: 2,
        name: 'Conflicting Brand',
        description: 'This will conflict',
        image: 'https://example.com/conflict.jpg',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.brand.findUnique.mockResolvedValue(existingBrand);
      mockPrisma.brand.findFirst.mockResolvedValue(conflictingBrand);

      const updateData = {
        name: 'Conflicting Brand', // Same name as another brand
      };

      const request = new NextRequest('http://localhost:3000/api/brands/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('@/app/api/brands/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Brand name already exists');
    });

    it('should handle partial updates', async () => {
      const existingBrand = {
        id: 1,
        name: 'Original Brand',
        description: 'Original description',
        image: 'https://example.com/original.jpg',
        website: 'https://original.com',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedBrand = {
        ...existingBrand,
        name: 'Updated Brand',
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.brand.findUnique.mockResolvedValue(existingBrand);
      mockPrisma.brand.findFirst.mockResolvedValue(null);
      mockPrisma.brand.update.mockResolvedValue(updatedBrand);

      const updateData = {
        name: 'Updated Brand', // Only updating name
      };

      const request = new NextRequest('http://localhost:3000/api/brands/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('@/app/api/brands/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Brand');
      expect(data.data.description).toBe('Original description'); // Unchanged
    });

    it('should handle field mapping correctly', async () => {
      const existingBrand = {
        id: 1,
        name: 'Original Brand',
        description: 'Original description',
        image: 'https://example.com/original.jpg',
        website: 'https://original.com',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedBrand = {
        ...existingBrand,
        isActive: false,
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.brand.findUnique.mockResolvedValue(existingBrand);
      mockPrisma.brand.findFirst.mockResolvedValue(null);
      mockPrisma.brand.update.mockResolvedValue(updatedBrand);

      const updateData = {
        isActive: false, // Using camelCase as per updated schema
      };

      const request = new NextRequest('http://localhost:3000/api/brands/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('@/app/api/brands/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isActive).toBe(false);
    });
  });

  describe('DELETE /api/brands/[id]', () => {
    it('should delete a brand successfully', async () => {
      const existingBrand = {
        id: 1,
        name: 'Brand to Delete',
        description: 'This brand will be deleted',
        image: 'https://example.com/delete.jpg',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.brand.findUnique.mockResolvedValue(existingBrand);
      mockPrisma.brand.delete.mockResolvedValue(existingBrand);

      const request = new NextRequest('http://localhost:3000/api/brands/1', {
        method: 'DELETE',
      });

      const { DELETE } = await import('@/app/api/brands/[id]/route');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Brand deleted successfully');
      expect(mockPrisma.brand.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 404 for non-existent brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brands/999', {
        method: 'DELETE',
      });

      const { DELETE } = await import('@/app/api/brands/[id]/route');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Brand not found');
    });

    it('should handle database errors during deletion', async () => {
      const existingBrand = {
        id: 1,
        name: 'Brand to Delete',
        description: 'This brand will be deleted',
        image: 'https://example.com/delete.jpg',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.brand.findUnique.mockResolvedValue(existingBrand);
      mockPrisma.brand.delete.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/brands/1', {
        method: 'DELETE',
      });

      const { DELETE } = await import('@/app/api/brands/[id]/route');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete brand');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Request body is required');
    });

    it('should handle invalid brand ID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/brands/invalid',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Brand' }),
        }
      );

      const { PUT } = await import('@/app/api/brands/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'invalid' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Brand ID must be a positive integer');
    });

    it('should handle concurrent brand creation with same name', async () => {
      const brandData = {
        name: 'Concurrent Brand',
        description: 'A brand created concurrently',
        image: 'https://example.com/concurrent.jpg',
        isActive: true,
      };

      // First call returns null (no existing brand)
      // Second call returns existing brand (created by another request)
      mockPrisma.brand.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          name: 'Concurrent Brand',
          description: 'Already created',
          image: 'https://example.com/concurrent.jpg',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        });

      mockPrisma.brand.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      const request = new NextRequest('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });

      const { POST } = await import('@/app/api/brands/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create brand');
    });
  });
});
