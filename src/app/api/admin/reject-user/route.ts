import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { z } from 'zod';

const rejectUserSchema = z.object({
  userId: z.number(),
  reason: z.string().optional(),
});

// POST /api/admin/reject-user - Reject a pending user
export const POST = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      // Validate request body
      const validation = rejectUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.issues },
          { status: 400 }
        );
      }

      const { userId, reason } = validation.data;

      // Check if user exists and is pending
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (user.userStatus !== 'PENDING' && user.userStatus !== 'VERIFIED') {
        return NextResponse.json(
          { error: 'User is not pending approval' },
          { status: 400 }
        );
      }

      // Update user status to rejected
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          userStatus: 'REJECTED',
          isActive: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User rejected successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          userStatus: updatedUser.userStatus,
        },
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      return NextResponse.json(
        { error: 'Failed to reject user' },
        { status: 500 }
      );
    }
  }
);
