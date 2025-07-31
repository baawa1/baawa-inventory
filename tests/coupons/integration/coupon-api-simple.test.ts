import { GET, POST } from '@/app/api/pos/coupons/route';
import { GET as GET_COUPON } from '@/app/api/pos/coupons/[id]/route';
import { PATCH as TOGGLE_COUPON } from '@/app/api/pos/coupons/[id]/toggle/route';
import { POST as VALIDATE_COUPON } from '@/app/api/pos/coupons/validate/route';
import { USER_ROLES } from '@/lib/auth/roles';

// Mock the middleware
jest.mock('@/lib/api-middleware', () => ({
  withPermission: (roles: string[], handler: Function) => handler,
  withAuth: (handler: Function) => handler,
}));

// Mock Prisma
const mockPrisma = {
  coupon: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  salesItem: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

// Mock NextRequest
const createMockRequest = (url: string, method: string = 'GET', body?: any) => {
  return {
    url,
    method,
    json: jest.fn().mockResolvedValue(body),
    nextUrl: new URL(url),
  } as any;
};

describe('Coupon API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pos/coupons', () => {
    it('returns coupons successfully', async () => {
      const mockCoupons = [
        {
          id: 1,
          code: 'SAVE10',
          name: '10% Off',
          description: 'Get 10% off',
          type: 'PERCENTAGE',
          value: 10,
          minimumAmount: 5000,
          maxUses: 100,
          currentUses: 5,
          isActive: true,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          createdBy: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          createdByUser: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ];

      mockPrisma.coupon.findMany.mockResolvedValue(mockCoupons);

      const request = createMockRequest(
        'http://localhost:3000/api/pos/coupons?search=SAVE&status=active'
      );
      const response = await GET(
        request,
        { user: { id: '1', role: USER_ROLES.ADMIN } },
        {}
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockCoupons);
    });
  });

  describe('POST /api/pos/coupons', () => {
    it('creates a new coupon successfully', async () => {
      const couponData = {
        code: 'NEW10',
        name: 'New Coupon',
        description: 'New discount',
        type: 'PERCENTAGE',
        value: 10,
        minimumAmount: 1000,
        maxUses: 50,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
      };

      const createdCoupon = {
        id: 1,
        ...couponData,
        currentUses: 0,
        isActive: true,
        createdBy: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdByUser: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      mockPrisma.coupon.create.mockResolvedValue(createdCoupon);

      const request = createMockRequest(
        'http://localhost:3000/api/pos/coupons',
        'POST',
        couponData
      );
      const response = await POST(
        request,
        { user: { id: '1', role: USER_ROLES.ADMIN } },
        {}
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(createdCoupon);
    });
  });

  describe('GET /api/pos/coupons/[id]', () => {
    it('returns a specific coupon', async () => {
      const mockCoupon = {
        id: 1,
        code: 'SAVE10',
        name: '10% Off',
        type: 'PERCENTAGE',
        value: 10,
        currentUses: 5,
        isActive: true,
        createdByUser: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const request = createMockRequest(
        'http://localhost:3000/api/pos/coupons/1'
      );
      const response = await GET_COUPON(
        request,
        { user: { id: '1', role: USER_ROLES.ADMIN } },
        { params: { id: '1' } }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockCoupon);
    });
  });

  describe('PATCH /api/pos/coupons/[id]/toggle', () => {
    it('toggles coupon active status', async () => {
      const mockCoupon = {
        id: 1,
        code: 'SAVE10',
        isActive: false,
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.coupon.update.mockResolvedValue({
        ...mockCoupon,
        isActive: true,
      });

      const request = createMockRequest(
        'http://localhost:3000/api/pos/coupons/1/toggle',
        'PATCH'
      );
      const response = await TOGGLE_COUPON(
        request,
        { user: { id: '1', role: USER_ROLES.ADMIN } },
        { params: { id: '1' } }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isActive).toBe(true);
    });
  });

  describe('POST /api/pos/coupons/validate', () => {
    it('validates a valid coupon', async () => {
      const mockCoupon = {
        id: 1,
        code: 'SAVE10',
        name: '10% Off',
        type: 'PERCENTAGE',
        value: 10,
        minimumAmount: 5000,
        maxUses: 100,
        currentUses: 5,
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
      };

      mockPrisma.coupon.findFirst.mockResolvedValue(mockCoupon);

      const request = createMockRequest(
        'http://localhost:3000/api/pos/coupons/validate',
        'POST',
        {
          code: 'SAVE10',
          totalAmount: 10000,
        }
      );

      const response = await VALIDATE_COUPON(
        request,
        { user: { id: '1', role: USER_ROLES.STAFF } },
        {}
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.coupon.code).toBe('SAVE10');
      expect(data.discountAmount).toBe(1000);
      expect(data.finalAmount).toBe(9000);
    });

    it('returns error for invalid coupon code', async () => {
      mockPrisma.coupon.findFirst.mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/pos/coupons/validate',
        'POST',
        {
          code: 'INVALID',
          totalAmount: 10000,
        }
      );

      const response = await VALIDATE_COUPON(
        request,
        { user: { id: '1', role: USER_ROLES.STAFF } },
        {}
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid coupon code');
    });
  });
});
