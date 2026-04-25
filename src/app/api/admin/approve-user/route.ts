import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { emailService } from '@/lib/email';
import { AuditLogger } from '@/lib/utils/audit-logger';
import { getAppBaseUrl } from '@/lib/utils';
import { resolveActingUserId } from '@/lib/utils/resolve-acting-user-id';
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
      const adminId = await resolveActingUserId({
        id: request.user.id,
        email: request.user.email,
      });
      const processedAt = new Date();

      if (!adminId) {
        return NextResponse.json(
          {
            error:
              'Administrator account could not be resolved. Please sign out and sign in again.',
          },
          { status: 401 }
        );
      }

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
          approvedBy: adminId,
          approvedAt: processedAt,
          rejectionReason: null,
          sessionNeedsRefresh: true,
          sessionRefreshAt: processedAt,
        },
        select: {
          id: true,
          firstName: true,
          email: true,
          role: true,
          userStatus: true,
          approvedBy: true,
          approvedAt: true,
        },
      });

      try {
        await emailService.sendUserApprovalEmail(updatedUser.email, {
          firstName: updatedUser.firstName,
          adminName: request.user.name,
          dashboardLink: `${getAppBaseUrl()}/dashboard`,
          role: updatedUser.role,
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      await AuditLogger.logUserStatusChange(
        adminId,
        user.id,
        user.email,
        'APPROVED',
        undefined,
        request
      );

      return NextResponse.json({
        success: true,
        message: 'User approved successfully',
        sessionUpdated: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          userStatus: updatedUser.userStatus,
          approvedBy: updatedUser.approvedBy,
          approvedAt: updatedUser.approvedAt,
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
