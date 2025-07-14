import { NextRequest, NextResponse } from "next/server";
import { auth } from "#root/auth";
import { prisma } from "@/lib/db";

// Simple in-memory cache for user data (in production, use Redis)
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
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

    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.userStatus,
      isEmailVerified: Boolean(user.emailVerified),
      isActive: user.isActive,
    };

    // Cache the result
    userCache.set(userId, { data: userData, timestamp: now });

    // Return updated user data for session update
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
