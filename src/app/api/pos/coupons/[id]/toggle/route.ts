import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';

export const PATCH = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (req: NextRequest, { user: _user }, { params }) => {
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

      // Toggle the active status
      const updatedCoupon = await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive: !existingCoupon.isActive },
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
      console.error('Error toggling coupon status:', error);
      return NextResponse.json(
        { error: 'Failed to toggle coupon status' },
        { status: 500 }
      );
    }
  }
);
