import { NextRequest, NextResponse } from "next/server";
import { auth } from "#root/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
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

    // Return updated user data for session update
    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        status: user.userStatus,
        isEmailVerified: Boolean(user.emailVerified),
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
