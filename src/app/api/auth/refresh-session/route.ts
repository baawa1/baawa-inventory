import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { handleApiError } from "@/lib/api-error-handler";
import { prisma } from "@/lib/db";

// Simple in-memory cache for user data (in production, use Redis)
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const POST = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    const userId = _request.user.id;
    const now = Date.now();

    // Check cache first
    const cached = userCache.get(userId);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ user: cached.data });
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userStatus: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update cache
    userCache.set(userId, { data: user, timestamp: now });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
});
