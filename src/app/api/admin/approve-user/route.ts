import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { z } from 'zod';

const approveUserSchema = z.object({
  userId: z.number(),
});

// POST /api/admin/approve-user - Approve a pending user
export const POST = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      // Validate request body
      const validation = approveUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.error.issues },
          { status: 400 }
        );
      }

      const { userId } = validation.data;

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

      // Update user status to approved
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          userStatus: 'APPROVED',
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User approved successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          userStatus: updatedUser.userStatus,
        },
      });
    } catch (error) {
      console.error('Error approving user:', error);
      return NextResponse.json(
        { error: 'Failed to approve user' },
        { status: 500 }
      );
    }
  }
);
