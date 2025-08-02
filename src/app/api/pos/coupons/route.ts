import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { USER_ROLES } from '@/lib/auth/roles';

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minimumAmount: z.number().positive().optional(),
  maxUses: z.number().positive().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
});

export const GET = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || 'all';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Status filter
      if (status === 'active') {
        where.isActive = true;
        where.validUntil = { gt: new Date() };
      } else if (status === 'inactive') {
        where.isActive = false;
      } else if (status === 'expired') {
        where.validUntil = { lt: new Date() };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await prisma.coupon.count({ where });

      // Get coupons with pagination
      const coupons = await prisma.coupon.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        data: coupons,
        pagination: {
          page,
          limit,
          totalPages,
          total,
        },
      });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coupons' },
        { status: 500 }
      );
    }
  }
);

export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const validatedData = createCouponSchema.parse(body);

      // Check if coupon code already exists
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: validatedData.code },
      });

      if (existingCoupon) {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 400 }
        );
      }

      const coupon = await prisma.coupon.create({
        data: {
          ...validatedData,
          createdBy: parseInt(req.user.id),
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(coupon, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid data', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error creating coupon:', error);
      return NextResponse.json(
        { error: 'Failed to create coupon' },
        { status: 500 }
      );
    }
  }
);
