import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { canViewLowStock } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Check if user has required permissions
    if (!canViewLowStock(request.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error in categories API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
