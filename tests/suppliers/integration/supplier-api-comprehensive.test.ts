import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/suppliers/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/suppliers/[id]/route';
import { prisma } from '@/lib/db';
// Mock utility functions
const createMockSession = () => ({
  user: {
    id: '1',
    email: 'test@example.com',
    role: 'ADMIN',
    status: 'APPROVED',
  },
});

// Mock authentication
jest.mock('../../../../auth', () => ({
  auth: jest.fn(),
}));

// Mock permissions
jest.mock('@/lib/auth/roles', () => ({
  hasPermission: jest.fn(),
}));

const { auth } = require('../../../../auth');
const { hasPermission } = require('@/lib/auth/roles');

describe('Supplier API - Comprehensive Integration Tests', () => {
  let mockSession: any;
  let testSupplier: any;

  beforeEach(async () => {
    // Clear database
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        userStatus: 'APPROVED',
        emailVerified: true,
      },
    });

    // Create test supplier
    testSupplier = await prisma.supplier.create({
      data: {
        name: 'Test Supplier',
        contactPerson: 'John Doe',
        email: 'john@testsupplier.com',
        phone: '+2348012345678',
        address: '123 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        isActive: true,
      },
    });

    // Setup mock session
    mockSession = {
      user: {
        id: testUser.id.toString(),
        email: testUser.email,
        role: testUser.role,
        status: testUser.userStatus,
      },
    };
  });

  afterEach(async () => {
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();
    jest.clearAllMocks();
  });

  describe('GET /api/suppliers', () => {
    it('should return suppliers list with pagination', async () => {
      // Create additional suppliers
      await prisma.supplier.createMany({
        data: [
          { name: 'Supplier 1', isActive: true },
          { name: 'Supplier 2', isActive: true },
          { name: 'Supplier 3', isActive: true },
        ],
      });

      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers?page=1&limit=2'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(4);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
    });

    it('should filter suppliers by search term', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers?search=Test'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Test Supplier');
    });

    it('should filter suppliers by active status', async () => {
      await prisma.supplier.create({
        data: { name: 'Inactive Supplier', isActive: false },
      });

      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers?isActive=true'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((s: any) => s.isActive)).toBe(true);
    });

    it('should sort suppliers by name', async () => {
      await prisma.supplier.createMany({
        data: [
          { name: 'Alpha Supplier', isActive: true },
          { name: 'Beta Supplier', isActive: true },
        ],
      });

      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers?sortBy=name&sortOrder=asc'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0].name).toBe('Alpha Supplier');
      expect(data.data[1].name).toBe('Beta Supplier');
    });

    it('should return 401 for unauthenticated request', async () => {
      auth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/suppliers');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for insufficient permissions', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/suppliers');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should handle invalid query parameters', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers?page=0&limit=0'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/suppliers', () => {
    it('should create a new supplier successfully', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const supplierData = {
        name: 'New Supplier',
        contactPerson: 'Jane Doe',
        email: 'jane@newsupplier.com',
        phone: '+2348098765432',
        address: '456 New Street',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Supplier');
      expect(data.data.email).toBe('jane@newsupplier.com');

      // Verify supplier was created in database
      const createdSupplier = await prisma.supplier.findFirst({
        where: { name: 'New Supplier' },
      });
      expect(createdSupplier).toBeTruthy();
    });

    it('should reject supplier with duplicate name', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const supplierData = {
        name: 'Test Supplier', // Already exists
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      const response = await POST(request);

      expect(response.status).toBe(409);
    });

    it('should reject supplier without required fields', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const supplierData = {
        contactPerson: 'John Doe',
        email: 'john@example.com',
        // Missing name and isActive
      };

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject supplier with invalid email', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const supplierData = {
        name: 'Invalid Email Supplier',
        email: 'invalid-email',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject supplier with invalid phone', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const supplierData = {
        name: 'Invalid Phone Supplier',
        phone: 'invalid-phone',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject supplier with invalid website', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const supplierData = {
        name: 'Invalid Website Supplier',
        website: 'not-a-url',
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated request', async () => {
      auth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', isActive: true }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for insufficient permissions', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', isActive: true }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/suppliers/[id]', () => {
    it('should return supplier by ID', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testSupplier.id);
      expect(data.data.name).toBe('Test Supplier');
    });

    it('should return 404 for non-existent supplier', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers/99999'
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: '99999' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers/invalid'
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: 'invalid' }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated request', async () => {
      auth.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`
      );
      const response = await GET_BY_ID(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/suppliers/[id]', () => {
    it('should update supplier successfully', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const updateData = {
        name: 'Updated Supplier Name',
        contactPerson: 'Jane Doe',
        email: 'jane@updatedsupplier.com',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Supplier Name');
      expect(data.data.contactPerson).toBe('Jane Doe');

      // Verify supplier was updated in database
      const updatedSupplier = await prisma.supplier.findUnique({
        where: { id: testSupplier.id },
      });
      expect(updatedSupplier?.name).toBe('Updated Supplier Name');
    });

    it('should reject update with duplicate name', async () => {
      // Create another supplier
      const otherSupplier = await prisma.supplier.create({
        data: { name: 'Other Supplier', isActive: true },
      });

      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const updateData = {
        name: 'Other Supplier', // Duplicate name
      };

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });

      expect(response.status).toBe(409);
    });

    it('should reject update with invalid data', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const updateData = {
        email: 'invalid-email',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent supplier', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers/99999',
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Name' }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: '99999' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated request', async () => {
      auth.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Name' }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/suppliers/[id]', () => {
    it('should delete supplier successfully', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });

      expect(response.status).toBe(200);

      // Verify supplier was deleted from database
      const deletedSupplier = await prisma.supplier.findUnique({
        where: { id: testSupplier.id },
      });
      expect(deletedSupplier).toBeNull();
    });

    it('should return 404 for non-existent supplier', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/suppliers/99999',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: '99999' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated request', async () => {
      auth.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 for insufficient permissions', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(false);

      const request = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: testSupplier.id.toString() }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest
        .spyOn(prisma.supplier, 'findMany')
        .mockRejectedValue(new Error('Database connection failed'));

      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/suppliers');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should handle validation errors with detailed messages', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email',
        phone: '123', // Too short
        isActive: true,
      };

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle concurrent updates correctly', async () => {
      auth.mockResolvedValue(mockSession);
      hasPermission.mockReturnValue(true);

      const updateData1 = { name: 'Update 1' };
      const updateData2 = { name: 'Update 2' };

      const request1 = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData1),
        }
      );

      const request2 = new NextRequest(
        `http://localhost:3000/api/suppliers/${testSupplier.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData2),
        }
      );

      const [response1, response2] = await Promise.all([
        PUT(request1, {
          params: Promise.resolve({ id: testSupplier.id.toString() }),
        }),
        PUT(request2, {
          params: Promise.resolve({ id: testSupplier.id.toString() }),
        }),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify final state
      const finalSupplier = await prisma.supplier.findUnique({
        where: { id: testSupplier.id },
      });
      expect(finalSupplier?.name).toMatch(/Update [12]/);
    });
  });
});
