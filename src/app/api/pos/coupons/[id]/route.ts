import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withPermission } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { USER_ROLES } from '@/lib/auth/roles';

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  minimumAmount: z.number().positive().optional(),
  maxUses: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

export const GET = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  async (req: NextRequest, { user }, { params }) => {
    try {
      const couponId = parseInt(params.id);

      if (isNaN(couponId)) {
        return NextResponse.json(
          { error: 'Invalid coupon ID' },
          { status: 400 }
        );
      }

      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
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

      if (!coupon) {
        return NextResponse.json(
          { error: 'Coupon not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(coupon);
    } catch (error) {
      console.error('Error fetching coupon:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coupon' },
        { status: 500 }
      );
    }
  }
);

export const PUT = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (req: NextRequest, { user }, { params }) => {
    try {
      const couponId = parseInt(params.id);

      if (isNaN(couponId)) {
        return NextResponse.json(
          { error: 'Invalid coupon ID' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const validatedData = updateCouponSchema.parse(body);

      // Check if coupon exists
      const existingCoupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!existingCoupon) {
        return NextResponse.json(
          { error: 'Coupon not found' },
          { status: 404 }
        );
      }

      // Check if code is being updated and if it already exists
      if (validatedData.code && validatedData.code !== existingCoupon.code) {
        const codeExists = await prisma.coupon.findUnique({
          where: { code: validatedData.code },
        });

        if (codeExists) {
          return NextResponse.json(
            { error: 'Coupon code already exists' },
            { status: 400 }
          );
        }
      }

      const updatedCoupon = await prisma.coupon.update({
        where: { id: couponId },
        data: validatedData,
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

      return NextResponse.json(updatedCoupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid data', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error updating coupon:', error);
      return NextResponse.json(
        { error: 'Failed to update coupon' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (req: NextRequest, { user }, { params }) => {
    try {
      const couponId = parseInt(params.id);

      if (isNaN(couponId)) {
        return NextResponse.json(
          { error: 'Invalid coupon ID' },
          { status: 400 }
        );
      }

      // Check if coupon exists
      const existingCoupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!existingCoupon) {
        return NextResponse.json(
          { error: 'Coupon not found' },
          { status: 404 }
        );
      }

      // Check if coupon has been used
      const usedCoupon = await prisma.salesItem.findFirst({
        where: { coupon_id: couponId },
      });

      if (usedCoupon) {
        return NextResponse.json(
          { error: 'Cannot delete coupon that has been used in transactions' },
          { status: 400 }
        );
      }

      await prisma.coupon.delete({
        where: { id: couponId },
      });

      return NextResponse.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return NextResponse.json(
        { error: 'Failed to delete coupon' },
        { status: 500 }
      );
    }
  }
);
