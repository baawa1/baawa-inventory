import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { updateUserProfileSchema } from '@/lib/validations/user';

// GET /api/users/profile - Get current user's profile
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        userStatus: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        avatar_url: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/users/profile - Update current user's profile
export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user.id);
    const body = await request.json();

    // Validate the request body
    const validatedData = updateUserProfileSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        userStatus: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data (only allow specific fields)
    const updateData: any = {};

    if (validatedData.firstName !== undefined) {
      updateData.firstName = validatedData.firstName;
    }
    if (validatedData.lastName !== undefined) {
      updateData.lastName = validatedData.lastName;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.avatar_url !== undefined) {
      updateData.avatar_url = validatedData.avatar_url;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        userStatus: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        avatar_url: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
});
