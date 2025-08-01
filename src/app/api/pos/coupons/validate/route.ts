import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withPermission } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { USER_ROLES } from '@/lib/auth/roles';

const validateCouponSchema = z.object({
  code: z.string().min(1),
  totalAmount: z.number().positive(),
});

export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json();
      const { code, totalAmount } = validateCouponSchema.parse(body);

      // Find the coupon
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: 'Invalid coupon code' },
          { status: 400 }
        );
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return NextResponse.json(
          { error: 'Coupon is inactive' },
          { status: 400 }
        );
      }

      // Check if coupon is expired
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json(
          { error: 'Coupon is not valid at this time' },
          { status: 400 }
        );
      }

      // Check if maximum uses reached
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return NextResponse.json(
          { error: 'Coupon usage limit reached' },
          { status: 400 }
        );
      }

      // Check minimum amount requirement
      if (coupon.minimumAmount && totalAmount < Number(coupon.minimumAmount)) {
        return NextResponse.json(
          {
            error: `Minimum purchase amount of ₦${Number(coupon.minimumAmount).toLocaleString()} required`,
            minimumAmount: Number(coupon.minimumAmount),
          },
          { status: 400 }
        );
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (totalAmount * Number(coupon.value)) / 100;

        // Validate percentage discount
        if (Number(coupon.value) > 100) {
          return NextResponse.json(
            { error: 'Coupon discount percentage cannot exceed 100%' },
            { status: 400 }
          );
        }
      } else {
        discountAmount = Number(coupon.value);
      }

      // Ensure discount doesn't exceed total amount
      discountAmount = Math.min(discountAmount, totalAmount);

      // Ensure discount is not negative
      discountAmount = Math.max(0, discountAmount);

      return NextResponse.json({
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          minimumAmount: coupon.minimumAmount,
        },
        discountAmount,
        finalAmount: totalAmount - discountAmount,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid data', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error validating coupon:', error);
      return NextResponse.json(
        { error: 'Failed to validate coupon' },
        { status: 500 }
      );
    }
  }
);
