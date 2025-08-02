import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { changePasswordSchema } from '@/lib/validations/user';
import bcrypt from 'bcryptjs';

// PUT /api/users/change-password - Change user's password
export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user.id);
    const body = await request.json();

    // Validate the request body
    const validatedData = changePasswordSchema.parse(body);

    // Get the current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { error: 'No password set for this account' },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update the password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        // Add session refresh tracking for security
        sessionNeedsRefresh: true,
        sessionRefreshAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
});
