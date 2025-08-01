import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';

// GET /api/admin/activity - Get recent admin activity
export const GET = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      // Get recent user registrations
      const recentRegistrations = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          userStatus: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // Get recent user status changes (approvals, rejections, etc.)
      const recentStatusChanges = await prisma.user.findMany({
        where: {
          OR: [
            { userStatus: 'APPROVED' },
            { userStatus: 'REJECTED' },
            { userStatus: 'SUSPENDED' },
          ],
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          userStatus: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      });

      // Combine and format activities
      const activities = [
        ...recentRegistrations.map(user => ({
          id: `reg-${user.id}`,
          action: 'New user registration',
          user: user.email,
          time: user.createdAt,
          type: 'user' as const,
          userData: user,
        })),
        ...recentStatusChanges.map(user => ({
          id: `status-${user.id}`,
          action: `User ${user.userStatus.toLowerCase()}`,
          user: user.email,
          time: user.updatedAt,
          type:
            user.userStatus === 'APPROVED'
              ? 'approval'
              : ('deactivation' as const),
          userData: user,
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        activities,
      });
    } catch (error) {
      console.error('Error fetching admin activity:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity data' },
        { status: 500 }
      );
    }
  }
);
