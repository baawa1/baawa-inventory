import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import {
  createCategorySchema,
  updateCategorySchema,
} from '@/lib/validations/category';

// Mock dependencies
jest.mock('@/auth');
jest.mock('@/lib/db');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Category API - Comprehensive Integration Tests', () => {
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
    mockPrisma.category = {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    } as any;
  });

  describe('GET /api/categories', () => {
    it('should return categories with pagination', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Electronics',
          description: 'Electronic devices',
          image: 'https://example.com/electronics.jpg',
          isActive: true,
          parentId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          parent: null,
          children: [],
          _count: { products: 10, children: 2 },
        },
        {
          id: 2,
          name: 'Smartphones',
          description: 'Mobile phones',
          image: 'https://example.com/smartphones.jpg',
          isActive: true,
          parentId: 1,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          parent: { id: 1, name: 'Electronics' },
          children: [],
          _count: { products: 5, children: 0 },
        },
      ];

      mockPrisma.category.count.mockResolvedValue(2);
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const request = new NextRequest('http://localhost:3000/api/categories');

      const { GET } = await import('@/app/api/categories/route');
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
        name: 'Electronics',
        description: 'Electronic devices',
        image: 'https://example.com/electronics.jpg',
        isActive: true,
        parentId: null,
        parent: null,
        children: [],
        productCount: 10,
        subcategoryCount: 2,
        createdAt: mockCategories[0].createdAt.toISOString(),
        updatedAt: mockCategories[0].updatedAt.toISOString(),
      });
    });

    it('should handle search parameter', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Electronics',
          description: 'Electronic devices and gadgets',
          image: 'https://example.com/electronics.jpg',
          isActive: true,
          parentId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          parent: null,
          children: [],
          _count: { products: 10, children: 2 },
        },
      ];

      mockPrisma.category.count.mockResolvedValue(1);
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const request = new NextRequest(
        'http://localhost:3000/api/categories?search=electronics'
      );

      const { GET } = await import('@/app/api/categories/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Electronics');

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'electronics', mode: 'insensitive' } },
              { description: { contains: 'electronics', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should handle parentId filter for top-level categories', async () => {
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.category.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/categories?parentId=null'
      );

      const { GET } = await import('@/app/api/categories/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: null,
          }),
        })
      );
    });

    it('should handle parentId filter for subcategories', async () => {
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.category.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/categories?parentId=1'
      );

      const { GET } = await import('@/app/api/categories/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: 1,
          }),
        })
      );
    });

    it('should handle includeChildren parameter', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Electronics',
          description: 'Electronic devices',
          image: 'https://example.com/electronics.jpg',
          isActive: true,
          parentId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          parent: null,
          children: [
            {
              id: 2,
              name: 'Smartphones',
              isActive: true,
              _count: { products: 5 },
            },
          ],
          _count: { products: 10, children: 1 },
        },
      ];

      mockPrisma.category.count.mockResolvedValue(1);
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const request = new NextRequest(
        'http://localhost:3000/api/categories?includeChildren=true'
      );

      const { GET } = await import('@/app/api/categories/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].children).toHaveLength(1);
      expect(data.data[0].children[0].name).toBe('Smartphones');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/categories');

      const { GET } = await import('@/app/api/categories/route');
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

      const request = new NextRequest('http://localhost:3000/api/categories');

      const { GET } = await import('@/app/api/categories/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account not approved');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.category.count.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/categories');

      const { GET } = await import('@/app/api/categories/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch categories');
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new top-level category successfully', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'A new category',
        image: 'https://example.com/new-category.jpg',
        isActive: true,
      };

      const createdCategory = {
        id: 1,
        ...categoryData,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.category.create.mockResolvedValue(createdCategory);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Category created successfully');
      expect(data.data).toEqual({
        id: 1,
        name: 'New Category',
        description: 'A new category',
        image: 'https://example.com/new-category.jpg',
        isActive: true,
        parentId: null,
        productCount: 0,
        subcategoryCount: 0,
        createdAt: createdCategory.createdAt.toISOString(),
        updatedAt: createdCategory.updatedAt.toISOString(),
      });
    });

    it('should create a subcategory successfully', async () => {
      const categoryData = {
        name: 'Subcategory',
        description: 'A subcategory',
        image: 'https://example.com/subcategory.jpg',
        isActive: true,
        parentId: 1,
      };

      const parentCategory = {
        id: 1,
        name: 'Parent Category',
        description: 'Parent category',
        image: 'https://example.com/parent.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const createdCategory = {
        id: 2,
        ...categoryData,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.category.findUnique.mockResolvedValue(parentCategory);
      mockPrisma.category.create.mockResolvedValue(createdCategory);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Category created successfully');
      expect(data.data.parentId).toBe(1);
    });

    it('should reject invalid parent category', async () => {
      const categoryData = {
        name: 'Subcategory',
        description: 'A subcategory',
        image: 'https://example.com/subcategory.jpg',
        isActive: true,
        parentId: 999, // Non-existent parent
      };

      mockPrisma.category.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Parent category not found');
    });

    it('should reject inactive parent category', async () => {
      const categoryData = {
        name: 'Subcategory',
        description: 'A subcategory',
        image: 'https://example.com/subcategory.jpg',
        isActive: true,
        parentId: 1,
      };

      const inactiveParent = {
        id: 1,
        name: 'Inactive Parent',
        description: 'Inactive parent category',
        image: 'https://example.com/inactive.jpg',
        isActive: false, // Inactive parent
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.category.findUnique.mockResolvedValue(inactiveParent);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Cannot create subcategory under inactive parent'
      );
    });

    it('should reject invalid category data', async () => {
      const invalidData = {
        name: '', // Empty name
        description: 'Valid description',
        image: 'https://example.com/image.jpg',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Category name is required');
    });

    it('should reject missing image', async () => {
      const invalidData = {
        name: 'Valid Category',
        description: 'Valid description',
        image: '', // Empty image
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Category image is required');
    });

    it('should return 403 for insufficient permissions', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'STAFF', // Only ADMIN and MANAGER can create categories
          status: 'APPROVED',
        },
      } as any);

      const categoryData = {
        name: 'New Category',
        description: 'A new category',
        image: 'https://example.com/new-category.jpg',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should handle database errors during creation', async () => {
      mockPrisma.category.create.mockRejectedValue(new Error('Database error'));

      const categoryData = {
        name: 'New Category',
        description: 'A new category',
        image: 'https://example.com/new-category.jpg',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create category');
    });
  });

  describe('PUT /api/categories/[id]', () => {
    it('should update a category successfully', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
        image: 'https://example.com/updated.jpg',
        isActive: false,
      };

      const existingCategory = {
        id: 1,
        name: 'Original Category',
        description: 'Original description',
        image: 'https://example.com/original.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedCategory = {
        ...existingCategory,
        ...updateData,
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.category.findUnique.mockResolvedValue(existingCategory);
      mockPrisma.category.update.mockResolvedValue(updatedCategory);

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedCategory);
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/categories/999',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Category not found');
    });

    it('should prevent circular references', async () => {
      const existingCategory = {
        id: 1,
        name: 'Category',
        description: 'A category',
        image: 'https://example.com/category.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.category.findUnique.mockResolvedValue(existingCategory);

      const updateData = {
        parentId: 1, // Setting itself as parent
      };

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Category cannot be its own parent');
    });

    it('should validate parent category exists', async () => {
      const existingCategory = {
        id: 1,
        name: 'Category',
        description: 'A category',
        image: 'https://example.com/category.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.category.findUnique
        .mockResolvedValueOnce(existingCategory) // Category exists
        .mockResolvedValueOnce(null); // Parent doesn't exist

      const updateData = {
        parentId: 999, // Non-existent parent
      };

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Parent category not found');
    });

    it('should prevent setting inactive parent', async () => {
      const existingCategory = {
        id: 1,
        name: 'Category',
        description: 'A category',
        image: 'https://example.com/category.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const inactiveParent = {
        id: 2,
        name: 'Inactive Parent',
        description: 'Inactive parent',
        image: 'https://example.com/inactive.jpg',
        isActive: false, // Inactive
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.category.findUnique
        .mockResolvedValueOnce(existingCategory) // Category exists
        .mockResolvedValueOnce(inactiveParent); // Parent exists but inactive

      const updateData = {
        parentId: 2,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot set parent to inactive category');
    });

    it('should handle partial updates', async () => {
      const existingCategory = {
        id: 1,
        name: 'Original Category',
        description: 'Original description',
        image: 'https://example.com/original.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedCategory = {
        ...existingCategory,
        name: 'Updated Category',
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.category.findUnique.mockResolvedValue(existingCategory);
      mockPrisma.category.update.mockResolvedValue(updatedCategory);

      const updateData = {
        name: 'Updated Category', // Only updating name
      };

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Category');
      expect(data.data.description).toBe('Original description'); // Unchanged
    });
  });

  describe('DELETE /api/categories/[id]', () => {
    it('should delete a category successfully', async () => {
      const existingCategory = {
        id: 1,
        name: 'Category to Delete',
        description: 'This category will be deleted',
        image: 'https://example.com/delete.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.category.findUnique.mockResolvedValue(existingCategory);
      mockPrisma.category.delete.mockResolvedValue(existingCategory);

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'DELETE',
        }
      );

      const { DELETE } = await import('@/app/api/categories/[id]/route');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Category deleted successfully');
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/categories/999',
        {
          method: 'DELETE',
        }
      );

      const { DELETE } = await import('@/app/api/categories/[id]/route');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Category not found');
    });

    it('should handle database errors during deletion', async () => {
      const existingCategory = {
        id: 1,
        name: 'Category to Delete',
        description: 'This category will be deleted',
        image: 'https://example.com/delete.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.category.findUnique.mockResolvedValue(existingCategory);
      mockPrisma.category.delete.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'DELETE',
        }
      );

      const { DELETE } = await import('@/app/api/categories/[id]/route');
      const response = await DELETE(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete category');
    });
  });

  describe('Hierarchical Category Management', () => {
    it('should handle multi-level category hierarchy', async () => {
      const grandparent = {
        id: 1,
        name: 'Electronics',
        description: 'Electronic devices',
        image: 'https://example.com/electronics.jpg',
        isActive: true,
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const parent = {
        id: 2,
        name: 'Mobile Devices',
        description: 'Mobile devices',
        image: 'https://example.com/mobile.jpg',
        isActive: true,
        parentId: 1,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      };

      const child = {
        id: 3,
        name: 'Smartphones',
        description: 'Smartphones',
        image: 'https://example.com/smartphones.jpg',
        isActive: true,
        parentId: 2,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      };

      // Test creating child category
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(parent) // Parent exists
        .mockResolvedValueOnce(grandparent) // Grandparent exists
        .mockResolvedValueOnce(parent); // For circular reference check

      mockPrisma.category.create.mockResolvedValue(child);

      const childData = {
        name: 'Smartphones',
        description: 'Smartphones',
        image: 'https://example.com/smartphones.jpg',
        isActive: true,
        parentId: 2,
      };

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(childData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.parentId).toBe(2);
    });

    it('should prevent deep circular references', async () => {
      const category1 = {
        id: 1,
        name: 'Category 1',
        description: 'Category 1',
        image: 'https://example.com/1.jpg',
        isActive: true,
        parentId: 2, // Points to category 2
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const category2 = {
        id: 2,
        name: 'Category 2',
        description: 'Category 2',
        image: 'https://example.com/2.jpg',
        isActive: true,
        parentId: 3, // Points to category 3
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      };

      const category3 = {
        id: 3,
        name: 'Category 3',
        description: 'Category 3',
        image: 'https://example.com/3.jpg',
        isActive: true,
        parentId: 1, // Points back to category 1 (circular)
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      };

      mockPrisma.category.findUnique
        .mockResolvedValueOnce(category1) // Category exists
        .mockResolvedValueOnce(category2) // Parent exists
        .mockResolvedValueOnce(category3) // Grandparent exists
        .mockResolvedValueOnce(category1); // Back to original (circular detected)

      const updateData = {
        parentId: 2,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/categories/1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Circular reference detected in category hierarchy'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Request body is required');
    });

    it('should handle invalid category ID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/categories/invalid',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Category' }),
        }
      );

      const { PUT } = await import('@/app/api/categories/[id]/route');
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'invalid' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid category ID');
    });

    it('should handle concurrent category creation', async () => {
      const categoryData = {
        name: 'Concurrent Category',
        description: 'A category created concurrently',
        image: 'https://example.com/concurrent.jpg',
        isActive: true,
      };

      mockPrisma.category.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      const { POST } = await import('@/app/api/categories/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create category');
    });
  });
});
