import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Simplified debug version of users API
export async function GET() {
  try {
    console.log("=== DEBUG USERS API ===");

    // Check session
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "Found" : "None");
    console.log("User role:", session?.user?.role);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin role required" },
        { status: 403 }
      );
    }

    // Try database connection
    console.log("Prisma client created");

    // Simple query
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      take: 3,
    });

    console.log("Users found:", users?.length || 0);

    return NextResponse.json({
      success: true,
      count: users?.length || 0,
      users: users || [],
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
